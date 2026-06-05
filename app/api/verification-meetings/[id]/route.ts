import { headers } from "next/headers";
import { type NextRequest, NextResponse } from "next/server";
import { auth } from "@/app/lib/auth";
import { prisma } from "@/app/lib/db";

const VALID_STATUSES = [
  "PENDING",
  "APPROVED",
  "REJECTED",
  "SCHEDULED",
] as const;

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { id } = await params;

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

    const meeting = await prisma.verificationMeetingRequest.findUnique({
      where: { id },
    });

    if (!meeting) {
      return NextResponse.json(
        { error: "Meeting request not found" },
        { status: 404 },
      );
    }

    const isAdmin = user.userType === "ADMIN";
    const isTargetUser = meeting.userId === session.user.id;

    if (!isAdmin && !isTargetUser) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { status, selectedTime, notes } = (await request.json()) as {
      status?: string;
      selectedTime?: string;
      notes?: string;
    };

    const trimmedNotes = typeof notes === "string" ? notes.trim() : notes;

    const updateData: Partial<{
      status: (typeof VALID_STATUSES)[number];
      selectedTime: Date;
      notes: string | null;
    }> = {};

    // Admin can update status and notes
    if (isAdmin) {
      if (
        status &&
        VALID_STATUSES.includes(status as (typeof VALID_STATUSES)[number])
      ) {
        updateData.status = status as (typeof VALID_STATUSES)[number];
      }
      if (notes !== undefined) {
        updateData.notes = trimmedNotes;
      }
    }

    // Target user can select a time slot (schedules the meeting)
    if (isTargetUser && selectedTime) {
      updateData.selectedTime = new Date(selectedTime);
      updateData.status = "SCHEDULED";
    }

    if (Object.keys(updateData).length > 0) {
      await prisma.verificationMeetingRequest.update({
        where: { id },
        data: updateData,
      });
    }

    const updated = await prisma.verificationMeetingRequest.findUnique({
      where: { id },
      include: {
        proposedTimes: true,
        user: { select: { id: true, name: true, email: true } },
        admin: { select: { id: true, name: true } },
      },
    });

    return NextResponse.json(updated);
  } catch (error) {
    console.error("Error updating verification meeting:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}

export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { id } = await params;

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

    await prisma.verificationMeetingTimeSlot.deleteMany({
      where: { meetingId: id },
    });

    await prisma.verificationMeetingRequest.delete({
      where: { id },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error deleting verification meeting:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}
