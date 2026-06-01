import { headers } from "next/headers";
import { NextResponse } from "next/server";
import { auth } from "@/app/lib/auth";
import { prisma } from "@/app/lib/db";

export async function POST(request: Request) {
  try {
    const session = await auth.api.getSession({
      headers: await headers(),
    });

    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: { userType: true },
    });

    if (!user || user.userType === "ADMIN") {
      return NextResponse.json(
        { error: "Only NGOs and Companies can create support chats" },
        { status: 403 },
      );
    }

    const body = await request.json();
    const { subject } = body;

    // Check if user already has an open support chat
    const existing = await prisma.supportChat.findFirst({
      where: { userId: session.user.id, status: "OPEN" },
      include: { messages: { orderBy: { createdAt: "desc" }, take: 1 } },
    });

    if (existing) {
      return NextResponse.json(existing);
    }

    const chat = await prisma.supportChat.create({
      data: {
        userId: session.user.id,
        subject: typeof subject === "string" ? subject.trim() : null,
      },
      include: { messages: true },
    });

    return NextResponse.json(chat, { status: 201 });
  } catch (error) {
    console.error("Error creating support chat:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}

export async function GET() {
  try {
    const session = await auth.api.getSession({
      headers: await headers(),
    });

    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: { userType: true },
    });

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    let chats;

    if (user.userType === "ADMIN") {
      chats = await prisma.supportChat.findMany({
        where: { status: "OPEN" },
        include: {
          user: {
            select: { id: true, name: true, email: true, userType: true },
          },
          messages: { orderBy: { createdAt: "desc" }, take: 1 },
        },
        orderBy: { updatedAt: "desc" },
      });
    } else {
      chats = await prisma.supportChat.findMany({
        where: { userId: session.user.id },
        include: {
          messages: { orderBy: { createdAt: "desc" }, take: 1 },
        },
        orderBy: { updatedAt: "desc" },
      });
    }

    return NextResponse.json(chats);
  } catch (error) {
    console.error("Error fetching support chats:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}
