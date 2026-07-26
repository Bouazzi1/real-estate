import { NextRequest, NextResponse } from "next/server";
import { getStorageProvider } from "@/lib/providers/storage";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

export async function POST(request: NextRequest) {
  // Enforce admin/agent session authorization
  const session = await getServerSession(authOptions);
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const formData = await request.formData();
    const file = formData.get("file") as File;

    if (!file) {
      return NextResponse.json({ error: "No file provided" }, { status: 400 });
    }

    const buffer = Buffer.from(await file.arrayBuffer());
    const storageProvider = getStorageProvider();
    const fileUrl = await storageProvider.uploadFile(buffer, file.name, file.type);

    return NextResponse.json({ url: fileUrl });
  } catch (e) {
    console.error("Upload error:", e);
    return NextResponse.json({ error: "Failed to upload file" }, { status: 500 });
  }
}
