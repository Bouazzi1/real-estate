import { prisma } from "../prisma";
import { getLLMProvider } from "../providers/llm";
import * as pdfParseModule from "pdf-parse";
const pdfParse = ((pdfParseModule as any).default || pdfParseModule) as any;
import fs from "fs/promises";
import path from "path";
import crypto from "crypto";

// Extract raw text from a PDF Buffer
export async function extractTextFromPDF(buffer: Buffer): Promise<string> {
  try {
    const data = await pdfParse(buffer);
    return data.text || "";
  } catch (e) {
    console.error("Failed to parse PDF:", e);
    throw e;
  }
}

// Chunks text into ~500 tokens (approx. 2000 chars) with 50 tokens (approx. 200 chars) overlap
export function chunkText(text: string, chunkSize = 2000, overlap = 200): string[] {
  const cleanText = text.replace(/\s+/g, " ").trim();
  const chunks: string[] = [];
  
  if (cleanText.length <= chunkSize) {
    return [cleanText];
  }

  let index = 0;
  while (index < cleanText.length) {
    const chunk = cleanText.substring(index, index + chunkSize);
    chunks.push(chunk);
    index += chunkSize - overlap;
  }

  return chunks;
}

// Retrieve Buffer from local upload path or remote URL
async function getBufferFromUrl(fileUrl: string): Promise<Buffer> {
  if (fileUrl.startsWith("/uploads/")) {
    const filePath = path.join(process.cwd(), "public", fileUrl);
    return await fs.readFile(filePath);
  } else {
    const res = await fetch(fileUrl);
    if (!res.ok) throw new Error(`Failed to fetch remote document: ${res.statusText}`);
    const arrayBuffer = await res.arrayBuffer();
    return Buffer.from(arrayBuffer);
  }
}

import { formatPrice } from "../formatters";

// Serialize apartment details for indexing
export function serializeApartment(apt: any): string {
  const formattedPrice = formatPrice(apt.price);
  return [
    `Apartment Reference Code: ${apt.reference}.`,
    `Property Title: ${apt.title}.`,
    `Project Development: ${apt.project?.name || "Résidence WAFA"}.`,
    `Address: ${(apt.project?.location as any)?.address || ""}.`,
    `Price: ${formattedPrice} DT (${formattedPrice} Dinars Tunisiens).`,
    `Surface Area: ${apt.surface} m².`,
    `Floor Level: ${apt.floor}.`,
    `Orientation: Facing ${apt.orientation}.`,
    `Rooms Specifications: ${apt.rooms} total rooms, ${apt.bedrooms} bedrooms, ${apt.bathrooms} bathrooms.`,
    `Amenities: Balcony: ${apt.balcony ? "Yes" : "No"}, Private Parking Slot: ${apt.parking ? "Yes" : "No"}.`,
    `Current Availability Status: ${apt.status}.`,
    `Description: ${apt.description}`
  ].join(" ");
}

// Index an Apartment listing
export async function indexApartment(apartmentId: string): Promise<void> {
  const apt = await prisma.apartment.findUnique({
    where: { id: apartmentId },
    include: { project: true },
  });

  if (!apt) throw new Error("Apartment not found for indexing");

  const serialized = serializeApartment(apt);
  const chunks = chunkText(serialized, 2000, 200);

  const llm = getLLMProvider();

  // Remove existing chunks for this apartment that aren't attached to documents
  await prisma.$executeRawUnsafe(
    'DELETE FROM "DocumentChunk" WHERE "apartmentId" = $1 AND "documentId" IS NULL;',
    apartmentId
  );

  for (const chunk of chunks) {
    const embedding = await llm.generateEmbedding(chunk, "passage");
    const id = crypto.randomUUID();
    const metadata = {
      apartmentId,
      reference: apt.reference,
      type: "apartment_specs",
    };

    // Prisma doesn't natively support vector types, so insert via raw query
    await prisma.$executeRawUnsafe(
      `INSERT INTO "DocumentChunk" (id, "documentId", "apartmentId", content, embedding, metadata)
       VALUES ($1, $2, $3, $4, $5::vector, $6)`,
      id,
      null,
      apartmentId,
      chunk,
      `[${embedding.join(",")}]`,
      JSON.stringify(metadata)
    );
  }
}

// Index a Document file (PDF brochure/FAQ/Legal sheets)
export async function indexDocument(documentId: string): Promise<void> {
  const doc = await prisma.document.findUnique({
    where: { id: documentId },
    include: { apartment: true },
  });

  if (!doc) throw new Error("Document not found for indexing");

  // Skip images or unsupported types - only parse PDFs/Texts
  if (doc.mimeType !== "application/pdf") {
    console.log(`Skipping non-pdf document type: ${doc.mimeType}`);
    return;
  }

  const buffer = await getBufferFromUrl(doc.fileUrl);
  const text = await extractTextFromPDF(buffer);
  
  if (!text.trim()) {
    console.warn(`Extracted text from document ${doc.title} is empty`);
    return;
  }

  const chunks = chunkText(text, 2000, 200);
  const llm = getLLMProvider();

  // Delete previous chunks
  await prisma.documentChunk.deleteMany({
    where: { documentId },
  });

  for (const chunk of chunks) {
    const embedding = await llm.generateEmbedding(chunk, "passage");
    const id = crypto.randomUUID();
    const metadata = {
      documentId,
      apartmentId: doc.apartmentId,
      title: doc.title,
      type: doc.type,
    };

    await prisma.$executeRawUnsafe(
      `INSERT INTO "DocumentChunk" (id, "documentId", "apartmentId", content, embedding, metadata)
       VALUES ($1, $2, $3, $4, $5::vector, $6)`,
      id,
      documentId,
      doc.apartmentId,
      chunk,
      `[${embedding.join(",")}]`,
      JSON.stringify(metadata)
    );
  }

  // Update indexedAt timestamp
  await prisma.document.update({
    where: { id: documentId },
    data: { indexedAt: new Date() },
  });
}
