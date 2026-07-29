import { NextRequest, NextResponse } from "next/server";
import { getStorageProvider } from "@/lib/providers/storage";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

export async function POST(request: NextRequest) {
  // Enforce admin/agent session authorization
  const session = await getServerSession(authOptions);
  if (!session) {
    return NextResponse.json({ error: "Session expirée ou non autorisée. Veuillez vous reconnecter à l'espace Admin." }, { status: 401 });
  }

  try {
    const formData = await request.formData();
    const file = formData.get("file") as any;

    if (!file) {
      return NextResponse.json({ error: "Aucun fichier sélectionné" }, { status: 400 });
    }

    let buffer: Buffer;
    if (typeof file.arrayBuffer === "function") {
      const arrayBuffer = await file.arrayBuffer();
      buffer = Buffer.from(arrayBuffer);
    } else if (Buffer.isBuffer(file)) {
      buffer = file;
    } else if (typeof file === "string") {
      buffer = Buffer.from(file);
    } else {
      return NextResponse.json({ error: "Format de fichier invalide ou non supporté" }, { status: 400 });
    }

    const filename = file.name || "upload.png";
    const mimeType = file.type || "image/png";

    const storageProvider = getStorageProvider();
    const fileUrl = await storageProvider.uploadFile(buffer, filename, mimeType);

    return NextResponse.json({ url: fileUrl });
  } catch (e: any) {
    console.error("Upload route error:", e);
    return NextResponse.json({ error: e?.message || "Erreur lors du téléversement du fichier" }, { status: 500 });
  }
}
