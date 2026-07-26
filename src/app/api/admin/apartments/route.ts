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
    const apartments = await prisma.apartment.findMany({
      include: { project: true },
      orderBy: { createdAt: "desc" },
    });
    return NextResponse.json(apartments);
  } catch (e) {
    console.error("GET apartments error:", e);
    return NextResponse.json({ error: "Failed to fetch apartments" }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const body = await request.json();
    
    // Check if apartment reference already exists
    const existingRef = await prisma.apartment.findUnique({
      where: { reference: body.reference }
    });
    if (existingRef) {
      return NextResponse.json({ error: "Reference code already exists" }, { status: 400 });
    }

    // Check if slug already exists
    const existingSlug = await prisma.apartment.findUnique({
      where: { slug: body.slug }
    });
    if (existingSlug) {
      return NextResponse.json({ error: "Slug already exists" }, { status: 400 });
    }

    const apartment = await prisma.apartment.create({
      data: {
        projectId: body.projectId,
        reference: body.reference,
        title: body.title,
        slug: body.slug,
        description: body.description,
        price: parseFloat(body.price),
        currency: body.currency || "TND",
        surface: parseFloat(body.surface),
        rooms: parseInt(body.rooms),
        bedrooms: parseInt(body.bedrooms),
        bathrooms: parseInt(body.bathrooms),
        floor: parseInt(body.floor),
        orientation: body.orientation,
        balcony: !!body.balcony,
        parking: !!body.parking,
        status: body.status || "AVAILABLE",
        featured: !!body.featured,
        gallery: body.gallery || [],
        floorPlanUrl: body.floorPlanUrl || null,
        virtualTourUrl: body.virtualTourUrl || null,
      },
    });

    // Trigger RAG indexing immediately
    try {
      const { indexApartment } = await import("@/lib/rag/pipeline");
      await indexApartment(apartment.id);
    } catch (ragErr) {
      console.error("Immediate RAG indexing failed for new apartment:", ragErr);
    }

    // Write audit log
    await prisma.auditLog.create({
      data: {
        userId: (session.user as any).id,
        action: "CREATE",
        entity: "Apartment",
        entityId: apartment.id,
        diff: JSON.parse(JSON.stringify(apartment))
      }
    });

    return NextResponse.json(apartment);
  } catch (e) {
    console.error("Failed to create apartment:", e);
    return NextResponse.json({ error: "Failed to create apartment" }, { status: 500 });
  }
}
