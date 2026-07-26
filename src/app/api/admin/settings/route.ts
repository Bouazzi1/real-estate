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
    const settings = await prisma.siteSettings.findUnique({
      where: { id: "singleton" },
    });
    return NextResponse.json(settings);
  } catch (e) {
    console.error("GET SiteSettings error:", e);
    return NextResponse.json({ error: "Failed to fetch settings" }, { status: 500 });
  }
}

export async function PUT(request: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const body = await request.json();

    const updated = await prisma.siteSettings.upsert({
      where: { id: "singleton" },
      update: {
        logoUrl: body.logoUrl,
        primaryColor: body.primaryColor,
        secondaryColor: body.secondaryColor,
        fontFamily: body.fontFamily,
        agencyName: body.agencyName,
        contactEmail: body.contactEmail,
        contactPhone: body.contactPhone,
        socialLinks: body.socialLinks,
        seoTitle: body.seoTitle,
        seoDescription: body.seoDescription,
        ogImage: body.ogImage,
      },
      create: {
        id: "singleton",
        logoUrl: body.logoUrl,
        primaryColor: body.primaryColor || "#0f172a",
        secondaryColor: body.secondaryColor || "#3b82f6",
        fontFamily: body.fontFamily || "Inter",
        agencyName: body.agencyName || "Elysium Real Estate",
        contactEmail: body.contactEmail || "sales@elysiumrealestate.com",
        contactPhone: body.contactPhone || "+1 (555) 019-2834",
        socialLinks: body.socialLinks || {},
        seoTitle: body.seoTitle || "Elysium Residences | Premium Real Estate Sales",
        seoDescription: body.seoDescription || "Discover luxury apartments with premium finishes.",
      },
    });

    // Write audit log
    await prisma.auditLog.create({
      data: {
        userId: (session.user as any).id,
        action: "UPDATE_SETTINGS",
        entity: "SiteSettings",
        entityId: "singleton",
        diff: JSON.parse(JSON.stringify(updated)),
      },
    });

    return NextResponse.json(updated);
  } catch (e) {
    console.error("Failed to update site settings:", e);
    return NextResponse.json({ error: "Failed to save settings changes" }, { status: 500 });
  }
}
