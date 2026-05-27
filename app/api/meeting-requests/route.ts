import type { Prisma } from "@prisma/client";
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
type MeetingRequestStatus = (typeof VALID_STATUSES)[number];

export async function POST(request: NextRequest) {
  try {
    const session = await auth.api.getSession({
      headers: await headers(),
    });

    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const requestBody = (await request.json()) as {
      projectId?: string;
      proposedTimes?: { start: string; end: string }[];
      notes?: string;
    };
    const { projectId, proposedTimes, notes } = requestBody;

    if (!projectId || !Array.isArray(proposedTimes)) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 },
      );
    }

    const project = await prisma.project.findUnique({
      where: { id: projectId },
      include: { ngo: { include: { ngoInfo: true } } },
    });

    if (!project) {
      return NextResponse.json({ error: "Project not found" }, { status: 404 });
    }

    const meetingRequest = await prisma.meetingRequest.create({
      data: {
        projectId,
        companyId: session.user.id,
        notes: typeof notes === "string" ? notes.trim() : notes,

        proposedTimes: {
          create: proposedTimes.map((slot: { start: string; end: string }) => ({
            start: new Date(slot.start),
            end: new Date(slot.end),
          })),
        },
      },
      include: {
        project: {
          include: {
            ngo: { include: { ngoInfo: true } },
          },
        },
        company: {
          include: { companyInfo: true },
        },
        proposedTimes: true,
      },
    });

    return NextResponse.json(meetingRequest);
  } catch (error) {
    console.error("Error creating meeting request:", error);
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
      include: {
        ngoInfo: true,
        companyInfo: true,
      },
    });

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    const { searchParams } = new URL(request.url);
    const status = searchParams.get("status") as MeetingRequestStatus | null;

    const where: Prisma.MeetingRequestWhereInput = {};

    if (user.userType === "COMPANY") {
      where.companyId = user.id;
    } else if (user.userType === "NGO") {
      where.project = {
        ngoId: user.id,
      };
    } else if (user.userType === "ADMIN") {
    }

    if (status && VALID_STATUSES.includes(status)) {
      where.status = status;
    }

    const meetingRequests = await prisma.meetingRequest.findMany({
      where,
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
      orderBy: { createdAt: "desc" },
    });

    return NextResponse.json(meetingRequests);
  } catch (error) {
    console.error("Error fetching meeting requests:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}
