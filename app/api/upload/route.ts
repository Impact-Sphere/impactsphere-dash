import { writeFile } from "node:fs/promises";
import { join } from "node:path";
import { headers } from "next/headers";
import { NextResponse } from "next/server";
import { auth } from "@/app/lib/auth";
import { prisma } from "@/app/lib/db";

const MAX_FILE_SIZE = 10 * 1024 * 1024;

const ALLOWED_TYPES = [
  "image/jpeg",
  "image/png",
  "image/webp",
  "application/pdf",
  "application/msword",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  "text/plain",
  "video/mp4",
  "video/webm",
  "video/quicktime",
];

const MIME_EXTENSIONS: Record<string, string> = {
  "image/jpeg": "jpg",
  "image/png": "png",
  "image/webp": "webp",
  "application/pdf": "pdf",
  "application/msword": "doc",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document":
    "docx",
  "text/plain": "txt",
  "video/mp4": "mp4",
  "video/webm": "webm",
  "video/quicktime": "mov",
};

export async function POST(request: Request) {
  try {
    const session = await auth.api.getSession({
      headers: await headers(),
    });

    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const formData = await request.formData();
    const file = formData.get("file") as File | null;

    if (!file) {
      return NextResponse.json({ error: "No file provided" }, { status: 400 });
    }

    if (!ALLOWED_TYPES.includes(file.type)) {
      return NextResponse.json(
        {
          error:
            "Invalid file type. Allowed files are images, PDF, Office documents, text, and video.",
        },
        { status: 400 },
      );
    }

    if (file.size > MAX_FILE_SIZE) {
      return NextResponse.json(
        { error: "File too large. Max 10MB." },
        { status: 400 },
      );
    }

    const ext = MIME_EXTENSIONS[file.type] || "bin";
    const filename = `${crypto.randomUUID()}.${ext}`;
    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);

    const uploadDir = join(process.cwd(), "public", "uploads");
    const filepath = join(uploadDir, filename);
    await writeFile(filepath, buffer);

    const record = await prisma.uploadedFile.create({
      data: {
        url: `/uploads/${filename}`,
        fileName: file.name,
        mimeType: file.type,
        size: file.size,
      },
    });

    return NextResponse.json({ id: record.id, url: record.url });
  } catch {
    return NextResponse.json(
      { error: "Failed to upload file." },
      { status: 500 },
    );
  }
}
