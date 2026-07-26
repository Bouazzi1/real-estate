import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

export async function GET(request: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const sections = await prisma.cmsSection.findMany({
      orderBy: { order: "asc" },
    });
    return NextResponse.json(sections);
  } catch (e) {
    console.error("GET CMS sections error:", e);
    return NextResponse.json({ error: "Failed to fetch sections" }, { status: 500 });
  }
}

export async function PUT(request: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const body = await request.json();
    const { id, draft, enabled } = body;

    if (!id) {
      return NextResponse.json({ error: "Section ID is required" }, { status: 400 });
    }

    const section = await prisma.cmsSection.findUnique({ where: { id } });
    if (!section) {
      return NextResponse.json({ error: "Section not found" }, { status: 404 });
    }

    const updated = await prisma.cmsSection.update({
      where: { id },
      data: {
        draft: draft !== undefined ? draft : undefined,
        enabled: enabled !== undefined ? enabled : undefined,
        updatedBy: (session.user as any).id,
      },
    });

    // Write audit log
    await prisma.auditLog.create({
      data: {
        userId: (session.user as any).id,
        action: "UPDATE_CMS_DRAFT",
        entity: "CmsSection",
        entityId: id,
        diff: { draft },
      },
    });

    return NextResponse.json(updated);
  } catch (e) {
    console.error("Failed to update CMS section draft:", e);
    return NextResponse.json({ error: "Failed to save draft changes" }, { status: 500 });
  }
}
