import { headers } from "next/headers";
import { NextResponse } from "next/server";
import { auth } from "@/app/lib/auth";
import { prisma } from "@/app/lib/db";

export async function GET() {
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
      { error: "Only NGOs can view acquired services" },
      { status: 403 },
    );
  }

  const acquisitions = await prisma.serviceAcquisition.findMany({
    where: {
      project: { ngoId: session.user.id },
    },
    include: {
      service: {
        select: {
          name: true,
          description: true,
          category: true,
          provider: { select: { name: true, email: true } },
        },
      },
      package: true,
      project: {
        select: { title: true, id: true },
      },
      chat: {
        select: { id: true },
      },
      review: {
        select: { id: true, rating: true, comment: true },
      },
    },
    orderBy: { createdAt: "desc" },
  });

  return NextResponse.json(acquisitions);
}
