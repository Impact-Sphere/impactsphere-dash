import { Prisma } from "@prisma/client";
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

  let needsOnboarding = false;

  if (!user.userType) {
    needsOnboarding = true;
  } else if (user.userType === "COMPANY" && user.companyInfo) {
    if (!user.companyInfo.companyName || !user.companyInfo.taxIdentificationNumber || !user.companyInfo.contactInfo || !user.companyInfo.causesSupported) {
      needsOnboarding = true;
    }
  } else if (user.userType === "NGO" && user.ngoInfo) {
    if (!user.ngoInfo.ngoName || !user.ngoInfo.taxIdentificationNumber || !user.ngoInfo.contactInfo || !user.ngoInfo.mainGoals || !user.ngoInfo.challenges) {
      needsOnboarding = true;
    }
  }

  return NextResponse.json({ needsOnboarding });
}

export async function POST(request: Request) {
  const session = await auth.api.getSession({
    headers: await headers(),
  });

  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await request.json();
  const {
    userType,
    organizationName,
    taxIdentificationNumber,
    contactInfo,
    causesSupported,
    mainGoals,
    challenges,
  } = body;

  if (!["NGO", "COMPANY"].includes(userType)) {
    return NextResponse.json(
      { error: "Invalid user type. Must be NGO or COMPANY." },
      { status: 400 },
    );
  }

  await prisma.$transaction(async (tx: Prisma.TransactionClient) => {
    await tx.user.update({
      where: { id: session.user.id },
      data: { userType, approvalStatus: "PENDING" },
    });

    if (userType === "COMPANY") {
      await tx.companyInfo.create({
        data: {
          id: crypto.randomUUID(),
          userId: session.user.id,
          companyName: organizationName || "",
          taxIdentificationNumber: taxIdentificationNumber || "",
          contactInfo: contactInfo || "",
          causesSupported: causesSupported || "",
        },
      });
    } else if (userType === "NGO") {
      await tx.ngoInfo.create({
        data: {
          id: crypto.randomUUID(),
          userId: session.user.id,
          ngoName: organizationName || "",
          taxIdentificationNumber: taxIdentificationNumber || "",
          contactInfo: contactInfo || "",
          mainGoals: mainGoals || "",
          challenges: challenges || "",
        },
      });
    }
  });

  return NextResponse.json({ success: true });
}
