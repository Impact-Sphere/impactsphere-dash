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
    include: {
      ngoInfo: true,
      companyInfo: true,
    },
  });

  if (!user) {
    return NextResponse.json({ error: "User not found" }, { status: 404 });
  }

  return NextResponse.json(user);
}

export async function PUT(request: Request) {
  const session = await auth.api.getSession({
    headers: await headers(),
  });

  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await request.json();
  const {
    name,
    image,
    preferredCurrency,
    organizationName,
    taxIdentificationNumber,
    contactInfo,
    causesSupported,
    mainGoals,
    challenges,
  } = body;

  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    include: { ngoInfo: true, companyInfo: true },
  });

  if (!user) {
    return NextResponse.json({ error: "User not found" }, { status: 404 });
  }

  await prisma.user.update({
    where: { id: session.user.id },
    data: {
      ...(name !== undefined && { name }),
      ...(image !== undefined && { image }),
      ...(preferredCurrency !== undefined && { preferredCurrency }),
    },
  });

  if (user.userType === "COMPANY" && user.companyInfo) {
    await prisma.companyInfo.update({
      where: { userId: session.user.id },
      data: {
        ...(organizationName !== undefined && {
          companyName: organizationName,
        }),
        ...(taxIdentificationNumber !== undefined && {
          taxIdentificationNumber,
        }),
        ...(contactInfo !== undefined && { contactInfo }),
        ...(causesSupported !== undefined && { causesSupported }),
      },
    });
  } else if (user.userType === "NGO" && user.ngoInfo) {
    await prisma.ngoInfo.update({
      where: { userId: session.user.id },
      data: {
        ...(organizationName !== undefined && { ngoName: organizationName }),
        ...(taxIdentificationNumber !== undefined && {
          taxIdentificationNumber,
        }),
        ...(contactInfo !== undefined && { contactInfo }),
        ...(mainGoals !== undefined && { mainGoals }),
        ...(challenges !== undefined && { challenges }),
      },
    });
  }

  return NextResponse.json({ success: true });
}
