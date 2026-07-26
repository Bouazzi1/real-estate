import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

// A robust CSV line parser that handles quotes and commas correctly
function parseCSVLine(text: string): string[] {
  const result: string[] = [];
  let current = "";
  let inQuotes = false;

  for (let i = 0; i < text.length; i++) {
    const char = text[i];

    if (char === '"') {
      inQuotes = !inQuotes;
    } else if (char === "," && !inQuotes) {
      result.push(current.trim());
      current = "";
    } else {
      current += char;
    }
  }
  result.push(current.trim());
  return result.map(val => val.replace(/^"|"$/g, "")); // remove wrapping quotes
}

export async function POST(request: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const formData = await request.formData();
    const file = formData.get("file") as File;
    const projectId = formData.get("projectId") as string;

    if (!file || !projectId) {
      return NextResponse.json({ error: "File and Project ID are required" }, { status: 400 });
    }

    // Verify project exists
    const project = await prisma.project.findUnique({ where: { id: projectId } });
    if (!project) {
      return NextResponse.json({ error: "Target project not found" }, { status: 404 });
    }

    const csvText = await file.text();
    const lines = csvText.split(/\r?\n/).filter(line => line.trim() !== "");

    if (lines.length < 2) {
      return NextResponse.json({ error: "CSV file is empty or missing data" }, { status: 400 });
    }

    // Parse header
    const headers = parseCSVLine(lines[0]).map(h => h.toLowerCase());
    const dataLines = lines.slice(1);
    
    let importedCount = 0;
    let skippedCount = 0;
    const errors: string[] = [];

    for (let i = 0; i < dataLines.length; i++) {
      const line = dataLines[i];
      const values = parseCSVLine(line);

      if (values.length < headers.length) {
        skippedCount++;
        errors.push(`Row ${i + 2}: Incomplete column count`);
        continue;
      }

      // Map values
      const rowData: Record<string, string> = {};
      headers.forEach((header, index) => {
        rowData[header] = values[index];
      });

      const reference = rowData.reference || rowData.ref;
      const title = rowData.title;
      const priceVal = parseFloat(rowData.price || "0");
      const surfaceVal = parseFloat(rowData.surface || "0");

      if (!reference || !title || isNaN(priceVal) || isNaN(surfaceVal)) {
        skippedCount++;
        errors.push(`Row ${i + 2}: Missing required fields (reference, title, price, or surface)`);
        continue;
      }

      // Generate a slug if not present
      const slug = rowData.slug || `${title.toLowerCase().replace(/[^a-z0-9]+/g, "-")}-${reference.toLowerCase()}`;

      try {
        // Check for duplicates
        const existing = await prisma.apartment.findFirst({
          where: {
            OR: [
              { reference },
              { slug }
            ]
          }
        });

        if (existing) {
          skippedCount++;
          errors.push(`Row ${i + 2}: Duplicate reference (${reference}) or slug (${slug})`);
          continue;
        }

        // Insert listing
        await prisma.apartment.create({
          data: {
            projectId,
            reference,
            title,
            slug,
            description: rowData.description || `Luxury apartment listing ${reference}.`,
            price: priceVal,
            surface: surfaceVal,
            rooms: parseInt(rowData.rooms || "1"),
            bedrooms: parseInt(rowData.bedrooms || "1"),
            bathrooms: parseInt(rowData.bathrooms || "1"),
            floor: parseInt(rowData.floor || "0"),
            orientation: rowData.orientation || "North",
            balcony: rowData.balcony?.toLowerCase() === "true" || rowData.balcony === "1",
            parking: rowData.parking?.toLowerCase() === "true" || rowData.parking === "1",
            featured: rowData.featured?.toLowerCase() === "true" || rowData.featured === "1",
            status: "AVAILABLE",
            gallery: rowData.gallery ? rowData.gallery.split(";").map(url => url.trim()) : [],
            floorPlanUrl: rowData.floorplanurl || null,
          }
        });

        importedCount++;
      } catch (err: any) {
        skippedCount++;
        errors.push(`Row ${i + 2}: Database error - ${err.message || err}`);
      }
    }

    // Write audit log
    await prisma.auditLog.create({
      data: {
        userId: (session.user as any).id,
        action: "IMPORT",
        entity: "Apartment",
        entityId: projectId,
        diff: {
          importedCount,
          skippedCount,
          errors,
        }
      }
    });

    return NextResponse.json({
      success: true,
      importedCount,
      skippedCount,
      errors
    });

  } catch (e: any) {
    console.error("CSV Import error:", e);
    return NextResponse.json({ error: e.message || "Failed to parse CSV" }, { status: 500 });
  }
}
