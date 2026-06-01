import { headers } from "next/headers";
import { NextResponse } from "next/server";
import { auth } from "@/app/lib/auth";
import { prisma } from "@/app/lib/db";

const isValidIdArray = (arr: unknown): arr is string[] => {
  return (
    Array.isArray(arr) &&
    arr.every((id) => typeof id === "string" && id.length > 0)
  );
};

export async function GET() {
  try {
    const session = await auth.api.getSession({
      headers: await headers(),
    });

    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      include: {
        ngoInfo: {
          include: {
            registrationDocuments: true,
            activityProofUrls: true,
          },
        },
        companyInfo: {
          include: {
            registrationDocuments: true,
          },
        },
      },
    });

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    let needsOnboarding = false;

    if (!user.userType) {
      needsOnboarding = true;
    } else if (user.userType === "COMPANY") {
      const info = user.companyInfo;

      if (
        !info ||
        !info.companyName ||
        !info.country ||
        !info.industryType ||
        !info.businessDescription ||
        !info.contactEmail ||
        !info.registrationNumber ||
        !info.registrationDocuments?.length ||
        !info.representativeFullName ||
        !info.representativeIdType ||
        !info.representativeIdNumber ||
        !info.representativeIdDocumentUrl ||
        !info.declarationConfirmed
      ) {
        needsOnboarding = true;
      }
    } else if (user.userType === "NGO") {
      const info = user.ngoInfo;

      if (
        !info ||
        !info.ngoName ||
        !info.country ||
        !info.cityRegion ||
        !info.ngoType ||
        !info.missionStatement ||
        !info.activitiesDescription ||
        !info.currentOrPastProjects ||
        !info.contactEmail ||
        !info.registrationDocuments?.length ||
        !info.representativeFullName ||
        !info.representativeRole ||
        !info.representativeIdType ||
        !info.representativeIdNumber ||
        !info.representativeIdDocumentUrl ||
        !info.declarationConfirmed
      ) {
        needsOnboarding = true;
      }
    }

    return NextResponse.json({ needsOnboarding });
  } catch (error) {
    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : "Internal server error",
      },
      { status: 500 },
    );
  }
}

export async function POST(request: Request) {
  try {
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
      country,
      cityRegion,
      ngoType,
      industryType,
      yearFounded,
      missionStatement,
      activitiesDescription,
      currentOrPastProjects,
      businessDescription,
      contactEmail,
      phoneNumber,
      website,
      registeredAddress,
      registrationNumber,
      taxVatNumber,
      registrationDocuments,
      representativeFullName,
      representativeRole,
      representativeJobTitle,
      representativeIdType,
      representativeIdNumber,
      idDocumentUrl,
      activityProofUrls,
      activityProofLink,
      declarationConfirmed,
    } = body;

    if (!["NGO", "COMPANY"].includes(userType)) {
      return NextResponse.json(
        { error: "Invalid user type. Must be NGO or COMPANY." },
        { status: 400 },
      );
    }

    const regDocs = registrationDocuments;
    const proofDocs = activityProofUrls;

    if (!organizationName || !country || !contactEmail || !registrationNumber) {
      return NextResponse.json(
        { error: "Missing required registration fields." },
        { status: 400 },
      );
    }

    if (regDocs.length === 0) {
      return NextResponse.json(
        { error: "At least one registration document is required." },
        { status: 400 },
      );
    }

    if (regDocs.length > 5) {
      return NextResponse.json(
        { error: "Maximum 5 registration documents allowed." },
        { status: 400 },
      );
    }

    if (website && typeof website !== "string") {
      return NextResponse.json(
        { error: "Invalid website URL." },
        { status: 400 },
      );
    }

    if (
      !representativeFullName ||
      !representativeIdType ||
      !representativeIdNumber ||
      !idDocumentUrl
    ) {
      return NextResponse.json(
        { error: "Representative identity and ID document are required." },
        { status: 400 },
      );
    }

    if (!declarationConfirmed) {
      return NextResponse.json(
        {
          error:
            "You must confirm that you are authorized to represent this organization.",
        },
        { status: 400 },
      );
    }

    await prisma.user.update({
      where: { id: session.user.id },
      data: {
        userType,
        approvalStatus: "PENDING",
      },
    });

    // ---------------- COMPANY ----------------
    if (userType === "COMPANY") {
      await prisma.companyInfo.upsert({
        where: { userId: session.user.id },
        create: {
          id: crypto.randomUUID(),
          userId: session.user.id,
          companyName: organizationName,
          country,
          industryType,
          businessDescription,
          yearFounded: yearFounded ? Number(yearFounded) : null,
          registrationNumber,
          taxVatNumber,
          contactEmail,
          website,
          phoneNumber,
          registeredAddress,

          representativeFullName,
          representativeJobTitle,
          representativeIdType,
          representativeIdNumber,
          representativeIdDocumentUrl: idDocumentUrl,

          declarationConfirmed: Boolean(declarationConfirmed),
          taxIdentificationNumber: taxVatNumber || null,
          contactInfo: contactEmail,
          causesSupported: "",

          registrationDocuments: {
            connect: regDocs.map((id: string) => ({ id })),
          },
        },
        update: {
          companyName: organizationName,
          country,
          industryType,
          businessDescription,
          yearFounded: yearFounded ? Number(yearFounded) : null,
          registrationNumber,
          taxVatNumber,
          contactEmail,
          website,
          phoneNumber,
          registeredAddress,

          representativeFullName,
          representativeJobTitle,
          representativeIdType,
          representativeIdNumber,
          representativeIdDocumentUrl: idDocumentUrl,

          declarationConfirmed: Boolean(declarationConfirmed),
          taxIdentificationNumber: taxVatNumber || null,
          contactInfo: contactEmail,

          registrationDocuments: {
            set: regDocs.map((id: string) => ({ id })),
          },
        },
      });
    }

    // ---------------- NGO ----------------
    if (userType === "NGO") {
      if (
        !missionStatement ||
        !activitiesDescription ||
        !currentOrPastProjects
      ) {
        return NextResponse.json(
          {
            error: "NGO mission, activities, and project history are required.",
          },
          { status: 400 },
        );
      }

      await prisma.ngoInfo.upsert({
        where: { userId: session.user.id },
        create: {
          id: crypto.randomUUID(),
          userId: session.user.id,
          ngoName: organizationName,
          country,
          cityRegion,
          ngoType,
          yearFounded: yearFounded ? Number(yearFounded) : null,
          missionStatement,
          activitiesDescription,
          currentOrPastProjects,
          contactEmail,
          phoneNumber,
          website,
          registrationNumber,

          representativeFullName,
          representativeRole,
          representativeIdType,
          representativeIdNumber,
          representativeIdDocumentUrl: idDocumentUrl,

          activityProofLink: activityProofLink || "",
          declarationConfirmed: Boolean(declarationConfirmed),
          taxIdentificationNumber: "",
          contactInfo: contactEmail,
          mainGoals: missionStatement,
          challenges: activitiesDescription,

          registrationDocuments: {
            connect: regDocs.map((id: string) => ({ id })),
          },

          activityProofUrls: {
            connect: isValidIdArray(proofDocs)
              ? proofDocs.map((id) => ({ id }))
              : [],
          },
        },
        update: {
          ngoName: organizationName,
          country,
          cityRegion,
          ngoType,
          yearFounded: yearFounded ? Number(yearFounded) : null,
          missionStatement,
          activitiesDescription,
          currentOrPastProjects,
          contactEmail,
          phoneNumber,
          website,
          registrationNumber,

          representativeFullName,
          representativeRole,
          representativeIdType,
          representativeIdNumber,
          representativeIdDocumentUrl: idDocumentUrl,

          activityProofLink: activityProofLink || "",
          declarationConfirmed: Boolean(declarationConfirmed),
          contactInfo: contactEmail,
          mainGoals: missionStatement,
          challenges: activitiesDescription,

          registrationDocuments: {
            set: regDocs.map((id: string) => ({ id })),
          },

          activityProofUrls: {
            set: isValidIdArray(proofDocs)
              ? proofDocs.map((id) => ({ id }))
              : [],
          },
        },
      });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : "Internal server error",
      },
      { status: 500 },
    );
  }
}
