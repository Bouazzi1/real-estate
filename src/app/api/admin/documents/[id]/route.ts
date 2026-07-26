import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { getStorageProvider } from "@/lib/providers/storage";
import { indexDocument } from "@/lib/rag/pipeline";

interface RouteProps {
  params: Promise<{
    id: string;
  }>;
}

export async function DELETE(request: NextRequest, { params }: RouteProps) {
  const session = await getServerSession(authOptions);
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const { id } = await params;

    // Find document first to retrieve its URL for storage deletion
    const document = await prisma.document.findUnique({
      where: { id },
    });

    if (!document) {
      return NextResponse.json({ error: "Document not found" }, { status: 404 });
    }

    // Delete the file from local or S3 storage
    const storageProvider = getStorageProvider();
    await storageProvider.deleteFile(document.fileUrl);

    // Delete the document record (cascading deletes will remove associated chunks)
    await prisma.document.delete({
      where: { id },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Failed to delete document:", error);
    return NextResponse.json({ error: "Failed to delete document" }, { status: 500 });
  }
}

export async function POST(request: NextRequest, { params }: RouteProps) {
  const session = await getServerSession(authOptions);
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const { id } = await params;
    const body = await request.json();

    if (body.action === "reindex") {
      const document = await prisma.document.findUnique({
        where: { id },
      });

      if (!document) {
        return NextResponse.json({ error: "Document not found" }, { status: 404 });
      }

      if (document.mimeType !== "application/pdf") {
        return NextResponse.json({ error: "Only PDF documents can be indexed for RAG" }, { status: 400 });
      }

      await indexDocument(document.id);

      const updatedDoc = await prisma.document.findUnique({
        where: { id },
        include: {
          apartment: {
            select: { id: true, title: true, reference: true },
          },
          project: {
            select: { id: true, name: true },
          },
        },
      });

      return NextResponse.json(updatedDoc);
    }

    return NextResponse.json({ error: "Invalid action" }, { status: 400 });
  } catch (error) {
    console.error("Failed to reindex document:", error);
    return NextResponse.json({ error: "Failed to reindex document" }, { status: 500 });
  }
}
