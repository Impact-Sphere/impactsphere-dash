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

  const chats = await prisma.chat.findMany({
    where: {
      OR: [
        {
          serviceAcquisition: {
            project: { ngoId: session.user.id },
          },
        },
        {
          serviceAcquisition: {
            service: { providerId: session.user.id },
          },
        },
      ],
    },
    include: {
      serviceAcquisition: {
        include: {
          service: {
            select: { name: true, providerId: true },
          },
          project: {
            select: { title: true, ngoId: true },
          },
          package: {
            select: { name: true, price: true, revisions: true },
          },
        },
      },
      messages: {
        orderBy: { createdAt: "desc" },
        take: 1,
      },
    },
    orderBy: { updatedAt: "desc" },
  });

  return NextResponse.json(chats);
}
