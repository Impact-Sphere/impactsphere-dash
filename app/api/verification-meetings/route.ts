import { headers } from "next/headers";
import { type NextRequest, NextResponse } from "next/server";
import { auth } from "@/app/lib/auth";
import { prisma } from "@/app/lib/db";

export async function POST(request: NextRequest) {
  try {
    const session = await auth.api.getSession({
      headers: await headers(),
    });

    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const admin = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: { userType: true },
    });

    if (admin?.userType !== "ADMIN") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const body = (await request.json()) as {
      userId?: string;
      proposedTimes?: { start: string; end: string }[];
      notes?: string;
    };
    const { userId, proposedTimes, notes } = body;

    if (
      !userId ||
      !Array.isArray(proposedTimes) ||
      proposedTimes.length === 0
    ) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 },
      );
    }

    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { id: true, userType: true },
    });

    if (!user || user.userType === "ADMIN") {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    // Update user status
    await prisma.user.update({
      where: { id: userId },
      data: { approvalStatus: "MEETING_REQUESTED" },
    });

    // Delete any existing pending verification meeting for this user
    await prisma.verificationMeetingRequest.deleteMany({
      where: { userId, status: { in: ["PENDING", "APPROVED"] } },
    });

    // Create new verification meeting request
    const meeting = await prisma.verificationMeetingRequest.create({
      data: {
        userId,
        adminId: session.user.id,
        notes: typeof notes === "string" ? notes.trim() : notes,
        proposedTimes: {
          create: proposedTimes.map((slot: { start: string; end: string }) => ({
            start: new Date(slot.start),
            end: new Date(slot.end),
          })),
        },
      },
      include: {
        proposedTimes: true,
        user: { select: { id: true, name: true, email: true } },
        admin: { select: { id: true, name: true } },
      },
    });

    return NextResponse.json(meeting);
  } catch (error) {
    console.error("Error creating verification meeting:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}

export async function GET(request: NextRequest) {
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

    const { searchParams } = new URL(request.url);
    const targetUserId = searchParams.get("userId");

    const where: { userId?: string; adminId?: string } = {};

    if (user.userType === "ADMIN") {
      if (targetUserId) {
        where.userId = targetUserId;
      } else {
        where.adminId = session.user.id;
      }
    } else {
      where.userId = session.user.id;
    }

    const meetings = await prisma.verificationMeetingRequest.findMany({
      where,
      include: {
        proposedTimes: true,
        user: { select: { id: true, name: true, email: true } },
        admin: { select: { id: true, name: true } },
      },
      orderBy: { createdAt: "desc" },
    });

    return NextResponse.json(meetings);
  } catch (error) {
    console.error("Error fetching verification meetings:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}
