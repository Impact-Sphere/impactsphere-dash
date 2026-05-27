import { headers } from "next/headers";
import { NextResponse } from "next/server";
import { auth } from "@/app/lib/auth";
import { prisma } from "@/app/lib/db";

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const session = await auth.api.getSession({
    headers: await headers(),
  });

  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;
  const body = await request.json();
  const { amount } = body;

  if (!amount || Number(amount) <= 0) {
    return NextResponse.json(
      { error: "Invalid donation amount" },
      { status: 400 },
    );
  }

  const project = await prisma.project.findUnique({
    where: { id },
  });

  if (!project) {
    return NextResponse.json({ error: "Project not found" }, { status: 404 });
  }

  if (project.status !== "ACTIVE") {
    return NextResponse.json(
      { error: "Project is not active" },
      { status: 400 },
    );
  }

  if (project.approvalStatus !== "APPROVED") {
    return NextResponse.json(
      { error: "Project is not approved for donations" },
      { status: 400 },
    );
  }

  const donationAmount = Number(amount);

  await prisma.donation.create({
    data: {
      amount: donationAmount,
      projectId: id,
      companyId: session.user.id,
    },
  });

  await prisma.project.update({
    where: { id },
    data: {
      currentAmount: { increment: donationAmount },
    },
  });

  const updatedProject = await prisma.project.findUnique({
    where: { id },
    select: { currentAmount: true, targetBudget: true },
  });

  if (
    updatedProject &&
    updatedProject.currentAmount >= updatedProject.targetBudget
  ) {
    await prisma.project.update({
      where: { id },
      data: { status: "COMPLETED" },
    });
  }

  return NextResponse.json({ success: true });
}
