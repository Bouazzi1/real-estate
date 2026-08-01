import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const document = await prisma.document.findUnique({
      where: { id },
    });

    if (!document) {
      return NextResponse.json({ error: "Document not found" }, { status: 404 });
    }

    const { fileUrl, mimeType, title } = document;

    // Handle Data URIs (Base64)
    if (fileUrl.startsWith("data:")) {
      const commaIndex = fileUrl.indexOf(",");
      const base64Data = commaIndex !== -1 ? fileUrl.slice(commaIndex + 1) : fileUrl;
      const buffer = Buffer.from(base64Data, "base64");

      const headers = new Headers();
      headers.set("Content-Type", mimeType || "application/pdf");
      headers.set("Content-Disposition", `inline; filename="${encodeURIComponent(title)}.pdf"`);
      headers.set("Cache-Control", "public, max-age=3600");

      return new Response(buffer, { headers });
    }

    // Handle relative or remote URLs
    return NextResponse.redirect(fileUrl);
  } catch (error) {
    console.error("Error serving document:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
