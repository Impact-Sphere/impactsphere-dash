import { Prisma } from "@prisma/client";
import { headers } from "next/headers";
import { NextResponse } from "next/server";
import { auth } from "@/app/lib/auth";
import { prisma } from "@/app/lib/db";

export async function PUT(request: Request) {
  const session = await auth.api.getSession({
    headers: await headers(),
  });

  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  await prisma.user.findUniqueOrThrow({
    where: { id: session.user.id },
    select: { userType: true, approvalStatus: true },
  });

  const body: { projectId: string } = await request.json();
  const { projectId } = body;

  if (!projectId) {
    return NextResponse.json(
      { error: "Missing required fields" },
      { status: 400 },
    );
  }

  const project = await prisma.project.findUnique({where: {id: projectId}});
  if (!project) {
    return NextResponse.json(
        { error: "Project not found" },
        { status: 404 },
    );
  }

  const newFavorite = {
    userId: session.user.id,
    projectId: projectId,
  };
  // insert or ignore
  await prisma.favoriteProject.upsert({
    where: {
        userId_projectId: newFavorite
    },
    update: {},
    create: newFavorite,
  });

  return NextResponse.json({msg: "Added to favorites"}, { status: 201 });
}



export async function DELETE(request: Request) {
  const session = await auth.api.getSession({
    headers: await headers(),
  });

  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  await prisma.user.findUniqueOrThrow({
    where: { id: session.user.id },
    select: { userType: true, approvalStatus: true },
  });

  const body: { projectId: string } = await request.json();
  const { projectId } = body;

  if (!projectId) {
    return NextResponse.json(
      { error: "Missing required fields" },
      { status: 400 },
    );
  }

  const project = await prisma.project.findUnique({where: {id: projectId}});
  if (!project) {
    return NextResponse.json(
        { error: "Project not found" },
        { status: 404 },
    );
  }

  await prisma.favoriteProject.deleteMany({
    where: {
        userId: session.user.id,
        projectId: projectId,
    }
  });

  return NextResponse.json({msg: "Removed from favorites"}, { status: 201 });
}



export async function GET(request: Request) {
    const session = await auth.api.getSession({
    headers: await headers(),
  });

  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  await prisma.user.findUniqueOrThrow({
    where: { id: session.user.id },
    select: { userType: true, approvalStatus: true },
  });

  const favorites = (await prisma.favoriteProject.findMany({
    where: {
        userId: session.user.id,
    },
    include: {
        project: true,
    }
  })).map(f => f.project)

  return NextResponse.json(favorites, { status: 200 });
}
