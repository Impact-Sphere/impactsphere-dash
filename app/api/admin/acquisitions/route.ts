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

  const acquisitions = await prisma.serviceAcquisition.findMany({
    include: {
      service: {
        select: {
          name: true,
          category: true,
          provider: { select: { name: true, email: true } },
        },
      },
      package: {
        select: { name: true, price: true },
      },
      project: {
        select: {
          title: true,
          ngo: {
            select: {
              name: true,
              email: true,
              ngoInfo: { select: { ngoName: true } },
            },
          },
        },
      },
      chat: {
        select: { id: true },
      },
    },
    orderBy: { createdAt: "desc" },
  });

  return NextResponse.json(acquisitions);
}
