import { headers } from "next/headers";
import { type NextRequest, NextResponse } from "next/server";
import { auth } from "@/app/lib/auth";
import { prisma } from "@/app/lib/db";

export async function GET(
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

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    const { id } = await params;

    const request_ = await prisma.companyMatchingRequest.findUnique({
      where: { id },
      include: {
        company: {
          select: {
            id: true,
            name: true,
            email: true,
            companyInfo: { select: { companyName: true } },
          },
        },
      },
    });

    if (!request_) {
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    }

    // Authorization
    if (user.userType !== "ADMIN" && request_.companyId !== session.user.id) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    // Fetch recommended projects
    let recommendedProjects: unknown[] = [];
    if (request_.recommendedProjectIds.length > 0) {
      recommendedProjects = await prisma.project.findMany({
        where: {
          id: { in: request_.recommendedProjectIds },
          status: "ACTIVE",
          approvalStatus: "APPROVED",
        },
        include: {
          ngo: { select: { name: true, image: true, ngoInfo: true } },
          _count: { select: { donations: true } },
        },
      });
    }

    return NextResponse.json({ ...request_, recommendedProjects });
  } catch (error) {
    console.error("Error fetching matching request:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}

export async function PUT(
  request: NextRequest,
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

    const body = await request.json();
    const { status, adminNotes, recommendedProjectIds } = body;

    const updateData: {
      status?: "PENDING" | "IN_REVIEW" | "MATCHED" | "DECLINED";
      adminNotes?: string;
      recommendedProjectIds?: string[];
    } = {};

    if (status && ["PENDING", "IN_REVIEW", "MATCHED", "DECLINED"].includes(status)) {
      updateData.status = status;
    }

    if (adminNotes !== undefined) {
      updateData.adminNotes = adminNotes;
    }

    if (recommendedProjectIds !== undefined) {
      updateData.recommendedProjectIds = recommendedProjectIds;
    }

    const updated = await prisma.companyMatchingRequest.update({
      where: { id },
      data: updateData,
    });

    return NextResponse.json(updated);
  } catch (error) {
    console.error("Error updating matching request:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}
