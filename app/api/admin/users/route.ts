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

  if(user?.userType !== "ADMIN"){
    return NextResponse.json({error: "FORBIDDEN", status: 403})
  }

  return { userId: session.user.id };
}

export async function GET() {
  const admin = await requireAdmin();
  if ("error" in admin) {
    return NextResponse.json({ error: admin.error }, { status: admin.status });
  }

  const users = await prisma.user.findMany({
    where: {
      userType: { in: ["NGO", "COMPANY"] },
      approvalStatus: {
        in: ["PENDING", "MORE_INFO_REQUESTED", "MEETING_REQUESTED", "REJECTED"],
      },
    },
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
    orderBy: { createdAt: "desc" },
  });

  return NextResponse.json(users);
}

export async function POST(request: Request) {
  const admin = await requireAdmin();
  if ("error" in admin) {
    return NextResponse.json({ error: admin.error }, { status: admin.status });
  }

  const body = await request.json();
  const { userId, action, adminNotes } = body;

  if (
    !userId ||
    !["approve", "reject", "request_more_info", "request_meeting"].includes(
      action,
    )
  ) {
    return NextResponse.json({ error: "Invalid request" }, { status: 400 });
  }

  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { userType: true, approvalStatus: true },
  });

  if (!user || user.userType === "ADMIN") {
    return NextResponse.json({ error: "User not found" }, { status: 404 });
  }

  let newStatus:
    | "PENDING"
    | "MORE_INFO_REQUESTED"
    | "MEETING_REQUESTED"
    | "APPROVED"
    | "REJECTED";
  switch (action) {
    case "approve":
      newStatus = "APPROVED";
      break;
    case "reject":
      newStatus = "REJECTED";
      break;
    case "request_more_info":
      newStatus = "MORE_INFO_REQUESTED";
      break;
    case "request_meeting":
      newStatus = "MEETING_REQUESTED";
      break;
    default:
      newStatus = "PENDING";
  }

  await prisma.user.update({
    where: { id: userId },
    data: {
      approvalStatus: newStatus,
      ...(adminNotes !== undefined && { adminNotes }),
    },
  });

  return NextResponse.json({ success: true, status: newStatus });
}
