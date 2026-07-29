import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  try {
    const { slug } = await params;
    if (!slug) {
      return NextResponse.json({ error: "Missing slug" }, { status: 400 });
    }

    const updated = await prisma.apartment.update({
      where: { slug },
      data: {
        views: {
          increment: 1,
        },
      },
      select: {
        id: true,
        slug: true,
        views: true,
      },
    });

    return NextResponse.json({ success: true, views: updated.views });
  } catch (e: any) {
    console.error("Failed to increment apartment view:", e);
    return NextResponse.json({ error: "Failed to increment view" }, { status: 500 });
  }
}
