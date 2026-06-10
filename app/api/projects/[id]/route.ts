import { headers } from "next/headers";
import { NextResponse } from "next/server";
import { auth } from "@/app/lib/auth";
import { prisma } from "@/app/lib/db";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;

  const proj = await prisma.project.findUnique({
    where: { id },
    include: {
      ngo: {
        select: {
          id: true,
          name: true,
          image: true,
          ngoInfo: true,
        },
      },
      donations: {
        where: { status: "SUCCEEDED" },
        include: {
          company: {
            select: {
              id: true,
              name: true,
              image: true,
              companyInfo: true,
            },
          },
        },
        orderBy: { createdAt: "desc" },
      },
      projectDocuments: true,
      _count: { select: { donations: true } },
      serviceAcquisitions: {
        include: {
          service: {
            select: {
              id: true,
              name: true,
              category: true,
              provider: { select: { name: true, email: true } },
            },
          },
          package: {
            select: {
              name: true,
              price: true,
              deliveryDays: true,
              revisions: true,
            },
          },
          chat: { select: { id: true } },
          review: { select: { id: true, rating: true, comment: true } },
        },
        orderBy: { createdAt: "desc" },
      },
    },
  });

  if (!proj) {
    return NextResponse.json({ error: "Project not found" }, { status: 404 });
  }

  const session = await auth.api.getSession({
    headers: await headers(),
  });

  const project = {
    ...proj,
    isFavorited:
      session?.user &&
      !!(await prisma.favoriteProject.findUnique({
        where: {
          userId_projectId: {
            userId: session.user.id,
            projectId: proj.id,
          },
        },
      })),
  };

  // If project is not approved, only allow admin or the owner NGO to view it
  if (project.approvalStatus !== "APPROVED") {
    const isOwner = session?.user?.id === project.ngoId;
    const isAdmin =
      session &&
      (
        await prisma.user.findUnique({
          where: { id: session.user.id },
          select: { userType: true },
        })
      )?.userType === "ADMIN";

    if (!isOwner && !isAdmin) {
      return NextResponse.json({ error: "Project not found" }, { status: 404 });
    }
  }

  return NextResponse.json(project);
}

export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
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

  if (user?.userType !== "NGO") {
    return NextResponse.json(
      { error: "Only NGOs can edit projects" },
      { status: 403 },
    );
  }

  const project = await prisma.project.findUnique({
    where: { id },
    select: { ngoId: true },
  });

  if (!project) {
    return NextResponse.json({ error: "Project not found" }, { status: 404 });
  }

  if (project.ngoId !== session.user.id) {
    return NextResponse.json(
      { error: "You can only edit your own projects" },
      { status: 403 },
    );
  }

  const body = await request.json();
  const { title, description, category, image, targetBudget, projectDocuments } =
    body;

  if (!title || !description || !category || !targetBudget) {
    return NextResponse.json(
      { error: "Missing required fields" },
      { status: 400 },
    );
  }

  const updated = await prisma.project.update({
    where: { id },
    data: {
      title,
      description,
      category,
      image: image || null,
      targetBudget: Number(targetBudget),
      projectDocuments: projectDocuments?.length
        ? { set: projectDocuments.map((id: string) => ({ id })) }
        : { set: [] },
    },
    include: {
      ngo: { select: { name: true, image: true, ngoInfo: true } },
      donations: {
        where: { status: "SUCCEEDED" },
        include: {
          company: {
            select: { id: true, name: true, image: true, companyInfo: true },
          },
        },
        orderBy: { createdAt: "desc" },
      },
      projectDocuments: true,
      _count: { select: { donations: true } },
      serviceAcquisitions: {
        include: {
          service: {
            select: {
              id: true,
              name: true,
              category: true,
              provider: { select: { name: true, email: true } },
            },
          },
          package: {
            select: {
              name: true,
              price: true,
              deliveryDays: true,
              revisions: true,
            },
          },
          chat: { select: { id: true } },
          review: { select: { id: true, rating: true, comment: true } },
        },
        orderBy: { createdAt: "desc" },
      },
    },
  });

  return NextResponse.json(updated);
}

export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
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

  if (user?.userType !== "NGO") {
    return NextResponse.json(
      { error: "Only NGOs can delete projects" },
      { status: 403 },
    );
  }

  const project = await prisma.project.findUnique({
    where: { id },
    select: { ngoId: true, currentAmount: true, serviceSpent: true },
  });

  if (!project) {
    return NextResponse.json({ error: "Project not found" }, { status: 404 });
  }

  if (project.ngoId !== session.user.id) {
    return NextResponse.json(
      { error: "You can only delete your own projects" },
      { status: 403 },
    );
  }

  // Prevent deletion if project has received donations or spent on services
  if (project.currentAmount > 0 || project.serviceSpent > 0) {
    return NextResponse.json(
      {
        error:
          "Cannot delete a project that has received donations or spent on services.",
      },
      { status: 403 },
    );
  }

  await prisma.project.delete({ where: { id } });

  return NextResponse.json({ success: true });
}
