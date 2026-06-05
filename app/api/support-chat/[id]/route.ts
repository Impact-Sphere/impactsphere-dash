import { headers } from "next/headers";
import { type NextRequest, NextResponse } from "next/server";
import { auth } from "@/app/lib/auth";
import { prisma } from "@/app/lib/db";

export async function PUT(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
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

    if (user?.userType !== "ADMIN") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const { id } = await params;

    const chat = await prisma.supportChat.findUnique({
      where: { id },
    });

    if (!chat) {
      return NextResponse.json({ error: "Chat not found" }, { status: 404 });
    }

    const updated = await prisma.supportChat.update({
      where: { id },
      data: { status: "CLOSED" },
    });

    return NextResponse.json(updated);
  } catch (error) {
    console.error("Error closing support chat:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}
