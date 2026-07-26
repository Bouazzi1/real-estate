import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { Prisma } from "@prisma/client";

export async function POST(request: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const { action } = await request.json(); // "publish" | "discard"

    const sections = await prisma.cmsSection.findMany();

    if (action === "publish") {
      for (const section of sections) {
        // Copy draft to content if a draft exists
        if (section.draft) {
          await prisma.cmsSection.update({
            where: { id: section.id },
            data: {
              content: section.draft,
              draft: Prisma.DbNull,
              updatedBy: (session.user as any).id,
            },
          });
        }
      }

      // Write audit log
      await prisma.auditLog.create({
        data: {
          userId: (session.user as any).id,
          action: "PUBLISH_CMS",
          entity: "CmsSection",
          entityId: "all",
        },
      });
    } else if (action === "discard") {
      for (const section of sections) {
        // Reset draft to null, returning to published content state
        if (section.draft) {
          await prisma.cmsSection.update({
            where: { id: section.id },
            data: {
              draft: Prisma.DbNull,
            },
          });
        }
      }

      // Write audit log
      await prisma.auditLog.create({
        data: {
          userId: (session.user as any).id,
          action: "DISCARD_CMS_DRAFT",
          entity: "CmsSection",
          entityId: "all",
        },
      });
    } else {
      return NextResponse.json({ error: "Invalid action" }, { status: 400 });
    }

    return NextResponse.json({ success: true });
  } catch (e) {
    console.error("CMS publish/discard error:", e);
    return NextResponse.json({ error: "Failed to process CMS action" }, { status: 500 });
  }
}
