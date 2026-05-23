import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { getUserFromRequest } from "@/lib/auth/jwt";
import { prisma } from "@/lib/prisma";
import { runRAGPipeline } from "@/lib/langgraph/ragPipeline";

const AskSchema = z.object({
  question: z.string().min(1, "Question cannot be empty"),
  sessionId: z.string(),
  videoId: z.string(),
  videoTitle: z.string().optional().default(""),
  videoAuthor: z.string().optional().default(""),
});

export async function POST(request: NextRequest) {
  const user = getUserFromRequest(request);
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const body = await request.json();
    const parsed = AskSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: parsed.error.errors[0].message }, { status: 400 });
    }

    const { question, sessionId, videoId, videoTitle, videoAuthor } = parsed.data;

    const session = await prisma.chatSession.findFirst({
      where: { id: sessionId, userId: user.userId },
      include: {
        messages: {
          orderBy: { createdAt: "desc" },
          take: 10,
        },
      },
    });

    if (!session) {
      return NextResponse.json({ error: "Session not found" }, { status: 404 });
    }

    const chatHistory = session.messages
      .reverse()
      .map((m) => ({ role: m.role as "user" | "assistant", content: m.content }));
 await prisma.message.create({
      data: { sessionId, role: "user", content: question },
    });


    const result = await runRAGPipeline({
      question,
      videoId,
      videoTitle,
      videoAuthor,
      chatHistory,
    });

    await prisma.message.create({
      data: { sessionId, role: "assistant", content: result.answer },
    });

    return NextResponse.json({
      answer: result.answer,
      chunksUsed: result.chunksUsed,
      answerSource: result.answerSource, // "transcript" | "general_knowledge" | "unrelated"
    });
    } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Unknown error";
    console.error("Ask error:", error);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}