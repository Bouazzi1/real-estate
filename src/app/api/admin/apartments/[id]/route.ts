import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

interface RouteProps {
  params: Promise<{
    id: string;
  }>;
}

export async function PUT(
  request: NextRequest,
  { params }: RouteProps
) {
  const session = await getServerSession(authOptions);
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;

  try {
    const body = await request.json();

    // Check if reference conflicts with another apartment
    if (body.reference) {
      const conflict = await prisma.apartment.findFirst({
        where: {
          reference: body.reference,
          NOT: { id },
        },
      });
      if (conflict) {
        return NextResponse.json({ error: "Reference code already in use" }, { status: 400 });
      }
    }

    // Check if slug conflicts with another apartment
    if (body.slug) {
      const conflict = await prisma.apartment.findFirst({
        where: {
          slug: body.slug,
          NOT: { id },
        },
      });
      if (conflict) {
        return NextResponse.json({ error: "Slug already in use" }, { status: 400 });
      }
    }

    const original = await prisma.apartment.findUnique({ where: { id } });
    if (!original) {
      return NextResponse.json({ error: "Apartment not found" }, { status: 404 });
    }

    const updated = await prisma.apartment.update({
      where: { id },
      data: {
        projectId: body.projectId,
        reference: body.reference,
        title: body.title,
        slug: body.slug,
        description: body.description,
        price: body.price !== undefined ? parseFloat(body.price) : undefined,
        currency: body.currency,
        surface: body.surface !== undefined ? parseFloat(body.surface) : undefined,
        rooms: body.rooms !== undefined ? parseInt(body.rooms) : undefined,
        bedrooms: body.bedrooms !== undefined ? parseInt(body.bedrooms) : undefined,
        bathrooms: body.bathrooms !== undefined ? parseInt(body.bathrooms) : undefined,
        floor: body.floor !== undefined ? parseInt(body.floor) : undefined,
        orientation: body.orientation,
        balcony: body.balcony !== undefined ? !!body.balcony : undefined,
        parking: body.parking !== undefined ? !!body.parking : undefined,
        status: body.status,
        featured: body.featured !== undefined ? !!body.featured : undefined,
        gallery: body.gallery,
        floorPlanUrl: body.floorPlanUrl,
        virtualTourUrl: body.virtualTourUrl,
        videoUrl: body.videoUrl !== undefined ? body.videoUrl : undefined,
      },
    });

    // Trigger RAG re-indexing immediately
    try {
      const { indexApartment } = await import("@/lib/rag/pipeline");
      await indexApartment(id);
    } catch (ragErr) {
      console.error("Immediate RAG re-indexing failed for updated apartment:", ragErr);
    }

    // Write audit log
    await prisma.auditLog.create({
      data: {
        userId: (session.user as any).id,
        action: "UPDATE",
        entity: "Apartment",
        entityId: id,
        diff: {
          before: original,
          after: updated,
        },
      },
    });

    return NextResponse.json(updated);
  } catch (e) {
    console.error("Failed to update apartment:", e);
    return NextResponse.json({ error: "Failed to update apartment" }, { status: 500 });
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: RouteProps
) {
  const session = await getServerSession(authOptions);
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;

  try {
    const original = await prisma.apartment.findUnique({ where: { id } });
    if (!original) {
      return NextResponse.json({ error: "Apartment not found" }, { status: 404 });
    }

    await prisma.apartment.delete({ where: { id } });

    // Write audit log
    await prisma.auditLog.create({
      data: {
        userId: (session.user as any).id,
        action: "DELETE",
        entity: "Apartment",
        entityId: id,
        diff: JSON.parse(JSON.stringify(original)),
      },
    });

    return NextResponse.json({ success: true });
  } catch (e) {
    console.error("Failed to delete apartment:", e);
    return NextResponse.json({ error: "Failed to delete apartment" }, { status: 500 });
  }
}
