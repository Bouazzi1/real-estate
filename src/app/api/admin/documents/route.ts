import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { indexDocument } from "@/lib/rag/pipeline";

export async function GET(request: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const documents = await prisma.document.findMany({
      include: {
        apartment: {
          select: {
            id: true,
            title: true,
            reference: true,
          },
        },
        project: {
          select: {
            id: true,
            name: true,
          },
        },
      },
      orderBy: {
        createdAt: "desc",
      },
    });

    return NextResponse.json(documents);
  } catch (error) {
    console.error("Failed to fetch documents:", error);
    return NextResponse.json({ error: "Failed to fetch documents" }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const body = await request.json();
    const { title, type, fileUrl, mimeType, sizeBytes, apartmentId, projectId } = body;

    if (!title || !type || !fileUrl || !mimeType || !sizeBytes) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }

    const document = await prisma.document.create({
      data: {
        title,
        type,
        fileUrl,
        mimeType,
        sizeBytes: parseInt(sizeBytes),
        apartmentId: apartmentId || null,
        projectId: projectId || null,
      },
      include: {
        apartment: {
          select: {
            id: true,
            title: true,
            reference: true,
          },
        },
        project: {
          select: {
            id: true,
            name: true,
          },
        },
      },
    });

    // If PDF, run vector RAG ingestion
    if (mimeType === "application/pdf") {
      try {
        await indexDocument(document.id);
      } catch (err) {
        console.error(`RAG indexing failed for document ${document.id}:`, err);
        return NextResponse.json(
          {
            document,
            warning: "Document created but RAG vector indexing failed. Trigger indexing again manually.",
          },
          { status: 201 }
        );
      }
    }

    return NextResponse.json(document, { status: 201 });
  } catch (error) {
    console.error("Failed to create document:", error);
    return NextResponse.json({ error: "Failed to create document" }, { status: 500 });
  }
}
