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

    if (user?.userType !== "COMPANY") {
      return NextResponse.json(
        { error: "Only companies can submit matching requests" },
        { status: 403 },
      );
    }

    const body = await request.json();
    const { causeAreas, description, budgetRange, location, timeline } = body;

    if (!Array.isArray(causeAreas) || causeAreas.length === 0) {
      return NextResponse.json(
        { error: "At least one cause area is required" },
        { status: 400 },
      );
    }

    const request_ = await prisma.companyMatchingRequest.create({
      data: {
        companyId: session.user.id,
        causeAreas,
        description: description || null,
        budgetRange: budgetRange || null,
        location: location || null,
        timeline: timeline || null,
      },
    });

    return NextResponse.json(request_, { status: 201 });
  } catch (error) {
    console.error("Error creating matching request:", error);
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

    let requests;

    if (user.userType === "ADMIN") {
      requests = await prisma.companyMatchingRequest.findMany({
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
        orderBy: { createdAt: "desc" },
      });
    } else if (user.userType === "COMPANY") {
      requests = await prisma.companyMatchingRequest.findMany({
        where: { companyId: session.user.id },
        orderBy: { createdAt: "desc" },
      });
    } else {
      return NextResponse.json([]);
    }

    return NextResponse.json(requests);
  } catch (error) {
    console.error("Error fetching matching requests:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}
