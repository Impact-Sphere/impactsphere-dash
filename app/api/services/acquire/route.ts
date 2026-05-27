import { headers } from "next/headers";
import { NextResponse } from "next/server";
import { auth } from "@/app/lib/auth";
import { prisma } from "@/app/lib/db";

export async function POST(request: Request) {
  const session = await auth.api.getSession({
    headers: await headers(),
  });

  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await request.json();
  const { projectId, serviceId, packageId } = body;

  if (!projectId || !serviceId || !packageId) {
    return NextResponse.json(
      { error: "Missing projectId, serviceId, or packageId" },
      { status: 400 },
    );
  }

  // Verify the user owns the project
  const project = await prisma.project.findUnique({
    where: { id: projectId },
    include: { ngo: true },
  });

  if (!project || project.ngoId !== session.user.id) {
    return NextResponse.json(
      { error: "Unauthorized" },
      { status: 403 },
    );
  }

  const service = await prisma.service.findUnique({
    where: { id: serviceId },
    include: { packages: true },
  });

  if (!service || !service.active) {
    return NextResponse.json(
      { error: "Service not found" },
      { status: 404 },
    );
  }

  const pkg = service.packages.find((p) => p.id === packageId);
  if (!pkg) {
    return NextResponse.json(
      { error: "Package not found" },
      { status: 404 },
    );
  }

  // Check if project has enough funds
  if (project.currentAmount < pkg.price) {
    return NextResponse.json(
      { error: "Insufficient funds" },
      { status: 400 },
    );
  }

  // Check if already acquired
  const existing = await prisma.serviceAcquisition.findFirst({
    where: {
      projectId,
      serviceId,
      status: "ACTIVE",
    },
  });

  if (existing) {
    return NextResponse.json(
      { error: "Service already acquired for this project" },
      { status: 400 },
    );
  }

  const acquisition = await prisma.serviceAcquisition.create({
    data: {
      id: crypto.randomUUID(),
      projectId,
      serviceId,
      packageId,
      status: "ACTIVE",
      startDate: new Date(),
    },
  });

  // Deduct funds from project
  await prisma.project.update({
    where: { id: projectId },
    data: {
      currentAmount: { decrement: pkg.price },
    },
  });

  // Create chat
  await prisma.chat.create({
    data: {
      id: crypto.randomUUID(),
      serviceAcquisitionId: acquisition.id,
    },
  });

  return NextResponse.json({ success: true, acquisition });
}
