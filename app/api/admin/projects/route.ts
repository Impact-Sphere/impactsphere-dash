import { headers } from "next/headers";
import { NextResponse } from "next/server";
import { auth } from "@/app/lib/auth";
import { prisma } from "@/app/lib/db";

async function requireAdmin() {
  const session = await auth.api.getSession({
    headers: await headers(),
  });

  if (!session) {
    return { error: "Unauthorized", status: 401 };
  }

  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: { userType: true },
  });

  if (user?.userType !== "ADMIN") {
    return { error: "Forbidden", status: 403 };
  }

  return { userId: session.user.id };
}

export async function GET() {
  const admin = await requireAdmin();
  if ("error" in admin) {
    return NextResponse.json({ error: admin.error }, { status: admin.status });
  }

  const projects = await prisma.project.findMany({
    where: {
      approvalStatus: "PENDING",
    },
    include: {
      ngo: {
        select: {
          name: true,
          image: true,
          ngoInfo: true,
        },
      },
      projectDocuments: true,
      _count: { select: { donations: true } },
    },
    orderBy: { createdAt: "desc" },
  });

  return NextResponse.json(projects);
}

export async function POST(request: Request) {
  const admin = await requireAdmin();
  if ("error" in admin) {
    return NextResponse.json({ error: admin.error }, { status: admin.status });
  }

  const body = await request.json();
  const { projectId, action } = body;

  if (!projectId || !["approve", "reject"].includes(action)) {
    return NextResponse.json({ error: "Invalid request" }, { status: 400 });
  }

  const project = await prisma.project.findUnique({
    where: { id: projectId },
    select: { approvalStatus: true },
  });

  if (!project) {
    return NextResponse.json({ error: "Project not found" }, { status: 404 });
  }

  const newStatus = action === "approve" ? "APPROVED" : "REJECTED";

  await prisma.project.update({
    where: { id: projectId },
    data: { approvalStatus: newStatus },
  });

  return NextResponse.json({ success: true, status: newStatus });
}
