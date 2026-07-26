import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

export async function POST(request: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const { sectionIds } = await request.json();

    if (!Array.isArray(sectionIds)) {
      return NextResponse.json({ error: "Invalid sectionIds structure" }, { status: 400 });
    }

    // Run updates sequentially in a transaction to guarantee integrity
    await prisma.$transaction(
      sectionIds.map((id, index) =>
        prisma.cmsSection.update({
          where: { id },
          data: { order: index + 1 },
        })
      )
    );

    return NextResponse.json({ success: true });
  } catch (e) {
    console.error("Failed to reorder sections:", e);
    return NextResponse.json({ error: "Failed to update section orders" }, { status: 500 });
  }
}
