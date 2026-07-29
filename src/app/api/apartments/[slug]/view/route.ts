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

    try {
      await prisma.$executeRawUnsafe(
        'UPDATE "Apartment" SET "views" = COALESCE("views", 0) + 1 WHERE "slug" = $1',
        slug
      );
    } catch {
      await prisma.apartment.update({
        where: { slug },
        data: { views: { increment: 1 } },
      });
    }

    return NextResponse.json({ success: true });
  } catch (e: any) {
    console.error("Failed to increment apartment view:", e);
    return NextResponse.json({ error: "Failed to increment view" }, { status: 500 });
  }
}
