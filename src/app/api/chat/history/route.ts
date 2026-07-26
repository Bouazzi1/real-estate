import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const sessionId = searchParams.get("sessionId");

    if (!sessionId) {
      return NextResponse.json({ error: "Session ID is required" }, { status: 400 });
    }

    const conversation = await prisma.conversation.findUnique({
      where: { sessionId },
      include: {
        messages: {
          orderBy: { createdAt: "asc" },
        },
      },
    });

    if (!conversation) {
      return NextResponse.json([]);
    }

    // Format for client ChatWidget
    const messages = conversation.messages
      .filter((m) => m.role === "USER" || m.role === "ASSISTANT")
      .map((m) => ({
        role: m.role,
        content: m.content,
      }));

    return NextResponse.json(messages);
  } catch (e: any) {
    console.error("Failed to load chat history:", e);
    return NextResponse.json({ error: e.message || "Failed to load history" }, { status: 500 });
  }
}
