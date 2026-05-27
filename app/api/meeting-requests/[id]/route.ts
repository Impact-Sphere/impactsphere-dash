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
      include: {
        ngoInfo: true,
        companyInfo: true,
      },
    });

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    const { status, selectedTime, notes, proposedTimes } = await request.json();

    const trimmedNotes = typeof notes === "string" ? notes.trim() : notes;

    const meetingRequest = await prisma.meetingRequest.findUnique({
      where: { id },
      include: { project: true },
    });

    if (!meetingRequest) {
      return NextResponse.json(
        { error: "Meeting request not found" },
        { status: 404 },
      );
    }

    const canUpdateAsNgoOrAdmin =
      user.userType === "ADMIN" ||
      (user.userType === "NGO" && meetingRequest.project.ngoId === user.id);

    const canUpdateAsCompany =
      user.userType === "COMPANY" && meetingRequest.companyId === user.id;

    if (!canUpdateAsNgoOrAdmin && !canUpdateAsCompany) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    if (
      status &&
      !VALID_STATUSES.includes(status as (typeof VALID_STATUSES)[number])
    ) {
      return NextResponse.json({ error: "Invalid status" }, { status: 400 });
    }

    const updateData: Partial<{
      status: (typeof VALID_STATUSES)[number];
      selectedTime: Date;
      notes: string | null;
    }> = {};

    if (canUpdateAsNgoOrAdmin) {
      if (status) updateData.status = status;

      if (selectedTime) {
        updateData.selectedTime = new Date(selectedTime);
      }

      if (notes !== undefined) {
        updateData.notes = trimmedNotes;
      }
    }

    if (canUpdateAsCompany) {
      if (proposedTimes !== undefined) {
        await prisma.meetingTimeSlot.deleteMany({
          where: { meetingId: id },
        });

        await prisma.meetingTimeSlot.createMany({
          data: (proposedTimes || []).map(
            (slot: { start: string; end: string }) => ({
              meetingId: id,
              start: new Date(slot.start),
              end: new Date(slot.end),
            }),
          ),
        });
      }

      if (notes !== undefined) {
        updateData.notes = trimmedNotes;
      }
    }

    if (Object.keys(updateData).length > 0) {
      await prisma.meetingRequest.update({
        where: { id },
        data: updateData,
      });
    }

    const updatedRequest = await prisma.meetingRequest.findUnique({
      where: { id },
      include: {
        project: {
          include: {
            ngo: {
              include: { ngoInfo: true },
            },
          },
        },
        company: {
          include: { companyInfo: true },
        },
        proposedTimes: true,
      },
    });

    return NextResponse.json(updatedRequest);
  } catch (error) {
    console.error("Error updating meeting request:", error);

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

    const meetingRequest = await prisma.meetingRequest.findUnique({
      where: { id },
    });

    if (!meetingRequest) {
      return NextResponse.json(
        { error: "Meeting request not found" },
        { status: 404 },
      );
    }

    const canDelete = session.user.id === meetingRequest.companyId;

    if (!canDelete) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    await prisma.meetingTimeSlot.deleteMany({
      where: { meetingId: id },
    });

    await prisma.meetingRequest.delete({
      where: { id },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error(error);

    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}
