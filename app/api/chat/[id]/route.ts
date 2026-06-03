import { headers } from "next/headers";
import { NextResponse } from "next/server";
import { auth } from "@/app/lib/auth";
import { prisma } from "@/app/lib/db";

async function canAccessChat(chatId: string, userId: string) {
  const chat = await prisma.chat.findUnique({
    where: { id: chatId },
    include: {
      serviceAcquisition: {
        include: {
          service: { select: { providerId: true } },
          project: { select: { ngoId: true } },
        },
      },
    },
  });

  if (!chat) return false;

  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { userType: true },
  });
  if (user?.userType === "ADMIN") return true;

  const isProjectOwner = chat.serviceAcquisition.project.ngoId === userId;
  const isServiceProvider =
    chat.serviceAcquisition.service.providerId === userId;

  return isProjectOwner || isServiceProvider;
}

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const session = await auth.api.getSession({
    headers: await headers(),
  });

  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;

  const hasAccess = await canAccessChat(id, session.user.id);
  if (!hasAccess) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const messages = await prisma.message.findMany({
    where: { chatId: id },
    orderBy: { createdAt: "asc" },
  });

  return NextResponse.json(messages);
}

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const session = await auth.api.getSession({
    headers: await headers(),
  });

  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;

  const chat = await prisma.chat.findUnique({
    where: { id },
    include: {
      serviceAcquisition: {
        include: {
          service: { select: { providerId: true } },
          project: { select: { ngoId: true } },
        },
      },
    },
  });

  if (!chat) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  const isProjectOwner =
    chat.serviceAcquisition.project.ngoId === session.user.id;
  const isServiceProvider =
    chat.serviceAcquisition.service.providerId === session.user.id;

  if (!isProjectOwner && !isServiceProvider) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const body = await request.json();
  const { content } = body;

  if (!content || content.trim().length === 0) {
    return NextResponse.json({ error: "Content is required" }, { status: 400 });
  }

  const message = await prisma.message.create({
    data: {
      id: crypto.randomUUID(),
      chatId: id,
      senderId: session.user.id,
      content: content.trim(),
    },
  });

  // Update chat updatedAt
  await prisma.chat.update({
    where: { id },
    data: { updatedAt: new Date() },
  });

  return NextResponse.json(message);
}
