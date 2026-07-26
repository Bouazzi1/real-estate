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
    const projects = await prisma.project.findMany({
      orderBy: { createdAt: "desc" },
    });
    return NextResponse.json(projects);
  } catch (e) {
    console.error("GET projects error:", e);
    return NextResponse.json({ error: "Failed to fetch projects" }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const body = await request.json();

    const existingSlug = await prisma.project.findUnique({
      where: { slug: body.slug },
    });
    if (existingSlug) {
      return NextResponse.json({ error: "Project slug already exists" }, { status: 400 });
    }

    const project = await prisma.project.create({
      data: {
        name: body.name,
        slug: body.slug,
        description: body.description,
        location: body.location || { lat: 0, lng: 0, address: "" },
        coverImage: body.coverImage,
        gallery: body.gallery || [],
        status: body.status || "ACTIVE",
      },
    });

    // Write audit log
    await prisma.auditLog.create({
      data: {
        userId: (session.user as any).id,
        action: "CREATE",
        entity: "Project",
        entityId: project.id,
        diff: JSON.parse(JSON.stringify(project)),
      },
    });

    return NextResponse.json(project);
  } catch (e) {
    console.error("Failed to create project:", e);
    return NextResponse.json({ error: "Failed to create project" }, { status: 500 });
  }
}
