import fs from "fs/promises";
import path from "path";
import { S3Client, PutObjectCommand, DeleteObjectCommand } from "@aws-sdk/client-s3";

export interface StorageProvider {
  uploadFile(file: Buffer, filename: string, mimeType: string): Promise<string>;
  deleteFile(fileUrl: string): Promise<void>;
}

export class LocalStorageProvider implements StorageProvider {
  async uploadFile(file: Buffer, filename: string, mimeType: string): Promise<string> {
    try {
      const uploadDir = path.join(process.cwd(), "public", "uploads");
      await fs.mkdir(uploadDir, { recursive: true });

      const safeFilename = filename || "image.png";
      const fileExt = path.extname(safeFilename) || ".png";
      const baseName = path.basename(safeFilename, fileExt).replace(/[^a-zA-Z0-9_-]/g, "-") || "file";
      const uniqueFilename = `${baseName}-${Date.now()}${fileExt}`;
      const filePath = path.join(uploadDir, uniqueFilename);

      await fs.writeFile(filePath, file);
      return `/uploads/${uniqueFilename}`;
    } catch (err: any) {
      console.warn("LocalStorageProvider local write failed (serverless/read-only env):", err?.message);

      // If read-only filesystem (EROFS error code or Vercel serverless environment), fallback to Base64 Data URL
      if (
        err?.code === "EROFS" ||
        err?.code === "EACCES" ||
        err?.message?.includes("read-only") ||
        process.env.VERCEL ||
        process.env.NEXT_PUBLIC_VERCEL_ENV
      ) {
        const type = mimeType || "image/png";
        const base64 = file.toString("base64");
        return `data:${type};base64,${base64}`;
      }

      throw new Error(`Erreur d'écriture sur le disque local: ${err?.message || err}`);
    }
  }

  async deleteFile(fileUrl: string): Promise<void> {
    if (!fileUrl.startsWith("/uploads/")) return;
    const relativePath = fileUrl.replace("/uploads/", "");
    const filePath = path.join(process.cwd(), "public", "uploads", relativePath);
    try {
      await fs.unlink(filePath);
    } catch (e) {
      console.warn(`Failed to delete local file: ${filePath}`, e);
    }
  }
}

export class S3StorageProvider implements StorageProvider {
  private client: S3Client;
  private bucket: string;

  constructor() {
    this.bucket = process.env.S3_BUCKET || "";
    this.client = new S3Client({
      region: process.env.S3_REGION || "us-east-1",
      credentials: {
        accessKeyId: process.env.S3_ACCESS_KEY_ID || "",
        secretAccessKey: process.env.S3_SECRET_ACCESS_KEY || "",
      },
      endpoint: process.env.S3_ENDPOINT || undefined,
      forcePathStyle: !!process.env.S3_ENDPOINT,
    });
  }

  async uploadFile(file: Buffer, filename: string, mimeType: string): Promise<string> {
    const fileExt = path.extname(filename);
    const baseName = path.basename(filename, fileExt).replace(/[^a-zA-Z0-9]/g, "-");
    const uniqueFilename = `${baseName}-${Date.now()}${fileExt}`;

    await this.client.send(
      new PutObjectCommand({
        Bucket: this.bucket,
        Key: uniqueFilename,
        Body: file,
        ContentType: mimeType,
      })
    );

    if (process.env.S3_ENDPOINT) {
      // Cloudflare R2 or custom endpoint (remove duplicate slash if endpoint has a trailing one)
      const baseEndpoint = process.env.S3_ENDPOINT.replace(/\/$/, "");
      return `${baseEndpoint}/${this.bucket}/${uniqueFilename}`;
    }
    return `https://${this.bucket}.s3.${process.env.S3_REGION || "us-east-1"}.amazonaws.com/${uniqueFilename}`;
  }

  async deleteFile(fileUrl: string): Promise<void> {
    try {
      const url = new URL(fileUrl);
      const key = url.pathname.split("/").pop();
      if (!key) return;

      await this.client.send(
        new DeleteObjectCommand({
          Bucket: this.bucket,
          Key: key,
        })
      );
    } catch (e) {
      console.warn(`Failed to delete S3 file: ${fileUrl}`, e);
    }
  }
}

export function getStorageProvider(): StorageProvider {
  if (process.env.STORAGE_PROVIDER === "s3") {
    return new S3StorageProvider();
  }
  return new LocalStorageProvider();
}
