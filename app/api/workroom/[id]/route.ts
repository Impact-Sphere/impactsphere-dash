import { headers } from "next/headers";
import { NextResponse } from "next/server";
import { auth } from "@/app/lib/auth";
import { prisma } from "@/app/lib/db";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const session = await auth.api.getSession({
    headers: await headers(),
  });

  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;

  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: { userType: true },
  });
  const isAdmin = user?.userType === "ADMIN";

  const chat = await prisma.chat.findUnique({
    where: { id },
    include: {
      serviceAcquisition: {
        include: {
          service: {
            select: { id: true, name: true, description: true, category: true, providerId: true, provider: { select: { name: true, email: true } } },
          },
          project: {
            select: { id: true, title: true, ngoId: true, ngo: { select: { name: true, email: true, ngoInfo: { select: { ngoName: true } } } } },
          },
          package: {
            select: { name: true, price: true, deliveryDays: true, revisions: true },
          },
          review: {
            select: { id: true, rating: true, comment: true },
          },
        },
      },
    },
  });

  if (!chat) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  const isProjectOwner = chat.serviceAcquisition.project.ngoId === session.user.id;
  const isServiceProvider = chat.serviceAcquisition.service.providerId === session.user.id;

  if (!isAdmin && !isProjectOwner && !isServiceProvider) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  return NextResponse.json(chat);
}
