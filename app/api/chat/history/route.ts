import { NextRequest, NextResponse } from "next/server";
import { getUserFromRequest } from "@/lib/auth/jwt";
import { prisma } from "@/lib/prisma";

export async function GET(request: NextRequest) {
  const user = getUserFromRequest(request);
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
try {
    const sessions = await prisma.chatSession.findMany({
      where: { userId: user.userId },
      orderBy: { createdAt: "desc" }, // Most recent first
      include: {
        messages: {
          // Only include the first user message (for preview in the sidebar)
          where: { role: "user" },
          orderBy: { createdAt: "asc" },
          take: 1,
        },
      },
    });

    return NextResponse.json({ sessions });
    } catch (error) {
    console.error("History error:", error);
    return NextResponse.json({ error: "Failed to fetch history" }, { status: 500 });
  }
}