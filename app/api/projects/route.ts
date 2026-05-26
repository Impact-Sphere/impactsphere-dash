import { headers } from "next/headers";
import { NextResponse } from "next/server";
import { auth } from "@/app/lib/auth";
import { prisma } from "@/app/lib/db";
import type { Project } from "@/app/types/project";

export async function GET(request: Request) {
  const session = await auth.api.getSession({
    headers: await headers(),
  });

  const { searchParams } = new URL(request.url);
  const category = searchParams.get("category");
  const mine = searchParams.get("mine");
  const ngoId = searchParams.get("ngoId");

  const isAdmin =
    session &&
    (await prisma.user.findUnique({
      where: { id: session.user.id },
      select: { userType: true },
    }))?.userType === "ADMIN";

  if (ngoId) {
    const projects = await prisma.project.findMany({
      where: {
        ngoId,
        status: "ACTIVE",
        ...(isAdmin ? {} : { approvalStatus: "APPROVED" }),
      },
      include: {
        ngo: { select: { name: true, image: true, ngoInfo: true } },
        _count: { select: { donations: true } },
      },
      orderBy: { createdAt: "desc" },
    });
    return NextResponse.json(projects);
  }

  if (mine === "true" && session) {
    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: { userType: true },
    });

    if (user?.userType === "NGO") {
      const projects = await prisma.project.findMany({
        where: { ngoId: session.user.id },
        include: {
          ngo: { select: { name: true, image: true, ngoInfo: true } },
          _count: { select: { donations: true } },
        },
        orderBy: { createdAt: "desc" },
      });
      return NextResponse.json(projects);
    }

    if (user?.userType === "ADMIN") {
      const projects = await prisma.project.findMany({
        include: {
          ngo: { select: { name: true, image: true, ngoInfo: true } },
          _count: { select: { donations: true } },
        },
        orderBy: { createdAt: "desc" },
      });
      return NextResponse.json(projects);
    }

    if (user?.userType === "COMPANY") {
      const donations = await prisma.donation.findMany({
        where: { companyId: session.user.id },
        include: {
          project: {
            include: {
              ngo: { select: { name: true, image: true, ngoInfo: true } },
              _count: { select: { donations: true } },
            },
          },
        },
        orderBy: { createdAt: "desc" },
      });
      const seen = new Set<string>();
      const projects = donations
        .map((d: any) => d.project as Project)
        .filter((p: Project) => {
          if (seen.has(p.id)) return false;
          seen.add(p.id);
          return true;
        });
      return NextResponse.json(projects);
    }

    return NextResponse.json([]);
  }

  const projects = await prisma.project.findMany({
    where: {
      status: "ACTIVE",
      ...(isAdmin ? {} : { approvalStatus: "APPROVED" }),
      ...(category && category !== "all" ? { category } : {}),
    },
    include: {
      ngo: { select: { name: true, image: true, ngoInfo: true } },
      _count: { select: { donations: true } },
    },
    orderBy: { createdAt: "desc" },
  });

  return NextResponse.json(projects);
}

export async function POST(request: Request) {
  const session = await auth.api.getSession({
    headers: await headers(),
  });

  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: { userType: true, approvalStatus: true },
  });

  if (user?.userType !== "NGO") {
    return NextResponse.json(
      { error: "Only NGOs can create projects" },
      { status: 403 },
    );
  }

  if (user.approvalStatus !== "APPROVED") {
    return NextResponse.json(
      { error: "Your account is pending approval. You cannot create projects yet." },
      { status: 403 },
    );
  }

  const body = await request.json();
  const { title, description, category, image, targetBudget } = body;

  if (!title || !description || !category || !targetBudget) {
    return NextResponse.json(
      { error: "Missing required fields" },
      { status: 400 },
    );
  }

  const project = await prisma.project.create({
    data: {
      title,
      description,
      category,
      image: image || null,
      targetBudget: Number(targetBudget),
      approvalStatus: "PENDING",
      ngoId: session.user.id,
    },
  });

  return NextResponse.json(project, { status: 201 });
}
