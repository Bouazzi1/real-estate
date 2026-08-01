import { prisma } from "../prisma";
import { getLLMProvider } from "../providers/llm";
import fs from "fs/promises";
import path from "path";
import crypto from "crypto";
import { formatPrice } from "../formatters";

// Extract raw text from a PDF Buffer
export async function extractTextFromPDF(buffer: Buffer): Promise<string> {
  try {
    const pdfParse = require("pdf-parse");
    const data = await pdfParse(buffer);
    if (data && data.text && data.text.trim()) {
      return data.text;
    }
  } catch (e) {
    console.warn("pdf-parse extraction warning, trying raw stream extractor:", e);
  }

  try {
    const raw = buffer.toString("utf-8");
    const textMatches: string[] = [];
    const tjRegex = /\(([^)]+)\)\s*TJ?/gi;
    let match;
    while ((match = tjRegex.exec(raw)) !== null) {
      if (match[1] && match[1].length > 1) {
        textMatches.push(match[1]);
      }
    }
    return textMatches.join(" ");
  } catch (err) {
    console.error("PDF raw text extraction failed:", err);
    return "";
  }
}

// Semantic & Structure-Aware Chunker: Splits by Markdown sections, paragraphs, and sentence boundaries
export function chunkText(text: string, maxChunkSize = 1800, overlap = 200): string[] {
  const cleanText = text.replace(/\r\n/g, "\n").trim();
  if (!cleanText) return [];

  // Split by structural blocks (Headers #, ##, ###, double newlines)
  const rawBlocks = cleanText.split(/(?=\n#{1,4}\s|\n\n)/g);
  const chunks: string[] = [];
  let currentChunk = "";

  for (const block of rawBlocks) {
    const trimmedBlock = block.trim();
    if (!trimmedBlock) continue;

    if ((currentChunk + "\n\n" + trimmedBlock).length <= maxChunkSize) {
      currentChunk = currentChunk ? `${currentChunk}\n\n${trimmedBlock}` : trimmedBlock;
    } else {
      if (currentChunk) {
        chunks.push(currentChunk);
        const overlapText = currentChunk.slice(-overlap);
        currentChunk = `${overlapText}\n\n${trimmedBlock}`.slice(0, maxChunkSize);
      } else {
        // Block is larger than maxChunkSize, split by sentence boundaries
        const sentences = trimmedBlock.split(/(?<=[.!?])\s+/);
        let sentenceChunk = "";
        for (const sentence of sentences) {
          if ((sentenceChunk + " " + sentence).length <= maxChunkSize) {
            sentenceChunk = sentenceChunk ? `${sentenceChunk} ${sentence}` : sentence;
          } else {
            if (sentenceChunk) chunks.push(sentenceChunk);
            sentenceChunk = sentence;
          }
        }
        if (sentenceChunk) currentChunk = sentenceChunk;
      }
    }
  }

  if (currentChunk.trim()) {
    chunks.push(currentChunk.trim());
  }

  return chunks.length > 0 ? chunks : [cleanText];
}

// Retrieve Buffer from Data URI, local upload path, or remote URL
async function getBufferFromUrl(fileUrl: string): Promise<Buffer> {
  if (fileUrl.startsWith("data:")) {
    // Extract base64 payload from Data URI (e.g. data:application/pdf;base64,JVBERi0xLj...)
    const commaIndex = fileUrl.indexOf(",");
    const base64Data = commaIndex !== -1 ? fileUrl.slice(commaIndex + 1) : fileUrl;
    return Buffer.from(base64Data, "base64");
  } else if (fileUrl.startsWith("/uploads/")) {
    const filePath = path.join(process.cwd(), "public", fileUrl);
    try {
      return await fs.readFile(filePath);
    } catch (err) {
      const host = process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : "http://localhost:3000";
      const res = await fetch(`${host}${fileUrl}`);
      if (!res.ok) throw new Error(`Failed to fetch document from server: ${res.statusText}`);
      const arrayBuffer = await res.arrayBuffer();
      return Buffer.from(arrayBuffer);
    }
  } else {
    const res = await fetch(fileUrl);
    if (!res.ok) throw new Error(`Failed to fetch remote document: ${res.statusText}`);
    const arrayBuffer = await res.arrayBuffer();
    return Buffer.from(arrayBuffer);
  }
}

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
    try {
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
    } catch (e) {
      console.warn("Failed to create embedding chunk for apartment:", apartmentId, e);
    }
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

  try {
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
      try {
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
      } catch (chunkErr) {
        console.warn(`Failed to store vector chunk for document ${documentId}:`, chunkErr);
      }
    }

    // Update indexedAt timestamp
    await prisma.document.update({
      where: { id: documentId },
      data: { indexedAt: new Date() },
    });
  } catch (err) {
    console.error(`Failed to index document ${documentId}:`, err);
  }
}
