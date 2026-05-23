import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { getUserFromRequest } from "@/lib/auth/jwt";
import { prisma } from "@/lib/prisma";
import {extractVideoId, fetchTranscript, fetchVideoMetadata, chunkText,} from "@/lib/youtube/transcript";
import { storeTranscriptChunks, videoAlreadyIngested } from "@/lib/pinecone/vectorStore";

const LoadVideoSchema = z.object({
  url: z.string().url("Invalid URL"),
});

export async function POST(request: NextRequest) {
    const user = getUserFromRequest(request);
  if (!user) {
    return NextResponse.json({ error: "Unauthorized — please log in" }, { status: 401 });
  }

try {
    const body = await request.json();
    const parsed = LoadVideoSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: "Invalid URL provided" }, { status: 400 });
    }

    const { url } = parsed.data;
    const videoId = extractVideoId(url);

    const meta = await fetchVideoMetadata(videoId);

    const alreadyIngested = await videoAlreadyIngested(videoId);
    let chunksStored = 0;
    let transcriptSource: "youtube" | "apify" = "youtube";

    if (!alreadyIngested) {
      const { text, source } = await fetchTranscript(videoId, url);
      transcriptSource = source;

      const chunks = chunkText(text);
      chunksStored = await storeTranscriptChunks(chunks, videoId);
      } else {
      chunksStored = -1; // Sentinel value meaning "already existed"
    }

    const session = await prisma.chatSession.create({
      data: {
        userId: user.userId,
        videoId,
        videoTitle: meta.title,
        videoAuthor: meta.author,
      },
    });

    return NextResponse.json({
      sessionId: session.id,
      videoId,
      videoTitle: meta.title,
      videoAuthor: meta.author,
      chunksStored: chunksStored === -1 ? "cached" : chunksStored,
      transcriptSource: alreadyIngested ? "cached" : transcriptSource,
    });
    } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Unknown error";
    console.error("Load video error:", error);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
