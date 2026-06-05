import { mkdir, unlink, writeFile } from "node:fs/promises";
import { join } from "node:path";
import {
  DeleteObjectCommand,
  PutObjectCommand,
  S3Client,
} from "@aws-sdk/client-s3";

export interface StorageProvider {
  upload(key: string, buffer: Buffer, contentType: string): Promise<string>;
  delete(key: string): Promise<void>;
}

class LocalStorageProvider implements StorageProvider {
  async upload(key: string, buffer: Buffer): Promise<string> {
    const uploadDir = join(process.cwd(), "public", "uploads");
    await mkdir(uploadDir, { recursive: true });
    const filepath = join(uploadDir, key);
    await writeFile(filepath, buffer);
    return `/uploads/${key}`;
  }

  async delete(key: string): Promise<void> {
    const filepath = join(process.cwd(), "public", "uploads", key);
    try {
      await unlink(filepath);
    } catch {
      // ignore if file doesn't exist
    }
  }
}

function getS3PublicUrl(key: string): string {
  const publicUrl = process.env.STORAGE_PUBLIC_URL?.replace(/\/$/, "");
  if (publicUrl) {
    return `${publicUrl}/${key}`;
  }

  const endpoint = process.env.STORAGE_S3_ENDPOINT?.replace(/\/$/, "");
  const bucket = process.env.STORAGE_S3_BUCKET;
  if (!endpoint || !bucket) {
    throw new Error(
      "Missing STORAGE_S3_ENDPOINT or STORAGE_S3_BUCKET for S3 URL construction",
    );
  }

  const forcePathStyle = process.env.STORAGE_S3_FORCE_PATH_STYLE !== "false";
  if (forcePathStyle) {
    return `${endpoint}/${bucket}/${key}`;
  }

  const url = new URL(endpoint);
  url.hostname = `${bucket}.${url.hostname}`;
  return `${url.toString().replace(/\/$/, "")}/${key}`;
}

class S3StorageProvider implements StorageProvider {
  private client: S3Client;
  private bucket: string;

  constructor() {
    const endpoint = process.env.STORAGE_S3_ENDPOINT;
    const region = process.env.STORAGE_S3_REGION || "us-east-1";
    const accessKeyId = process.env.STORAGE_S3_ACCESS_KEY_ID;
    const secretAccessKey = process.env.STORAGE_S3_SECRET_ACCESS_KEY;
    const bucket = process.env.STORAGE_S3_BUCKET;

    if (!endpoint || !accessKeyId || !secretAccessKey || !bucket) {
      throw new Error(
        "Missing required S3 storage environment variables. " +
          "Expected: STORAGE_S3_ENDPOINT, STORAGE_S3_ACCESS_KEY_ID, STORAGE_S3_SECRET_ACCESS_KEY, STORAGE_S3_BUCKET",
      );
    }

    this.client = new S3Client({
      endpoint,
      region,
      credentials: { accessKeyId, secretAccessKey },
      forcePathStyle: process.env.STORAGE_S3_FORCE_PATH_STYLE !== "false",
    });
    this.bucket = bucket;
  }

  async upload(
    key: string,
    buffer: Buffer,
    contentType: string,
  ): Promise<string> {
    await this.client.send(
      new PutObjectCommand({
        Bucket: this.bucket,
        Key: key,
        Body: buffer,
        ContentType: contentType,
      }),
    );
    return getS3PublicUrl(key);
  }

  async delete(key: string): Promise<void> {
    await this.client.send(
      new DeleteObjectCommand({
        Bucket: this.bucket,
        Key: key,
      }),
    );
  }
}

export function getStorage(): StorageProvider {
  const driver = process.env.STORAGE_DRIVER || "local";

  switch (driver) {
    case "s3":
      return new S3StorageProvider();
    default:
      return new LocalStorageProvider();
  }
}
