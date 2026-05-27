import { headers } from "next/headers";
import { NextResponse } from "next/server";
import { auth } from "@/app/lib/auth";
import { prisma } from "@/app/lib/db";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;

  const project = await prisma.project.findUnique({
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
      _count: { select: { donations: true } },
    },
  });

  if (!project) {
    return NextResponse.json({ error: "Project not found" }, { status: 404 });
  }

  // If project is not approved, only allow admin or the owner NGO to view it
  if (project.approvalStatus !== "APPROVED") {
    const session = await auth.api.getSession({
      headers: await headers(),
    });

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
