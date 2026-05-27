import { headers } from "next/headers";
import { NextResponse } from "next/server";
import { auth } from "@/app/lib/auth";
import { prisma } from "@/app/lib/db";

export async function POST(
  request: Request,
  { params }: { params: Promise<{ acquisitionId: string }> },
) {
  const session = await auth.api.getSession({
    headers: await headers(),
  });

  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { acquisitionId } = await params;
  const body = await request.json();
  const { action, message } = body;

  const acquisition = await prisma.serviceAcquisition.findUnique({
    where: { id: acquisitionId },
    include: {
      service: { select: { providerId: true, name: true } },
      project: { select: { ngoId: true, title: true, currentAmount: true } },
      package: true,
      chat: true,
    },
  });

  if (!acquisition) {
    return NextResponse.json(
      { error: "Acquisition not found" },
      { status: 404 },
    );
  }

  const isProvider = acquisition.service.providerId === session.user.id;
  const isNgo = acquisition.project.ngoId === session.user.id;

  if (!isProvider && !isNgo) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  // Provider delivers work
  if (action === "deliver") {
    if (!isProvider) {
      return NextResponse.json(
        { error: "Only provider can deliver" },
        { status: 403 },
      );
    }
    if (
      acquisition.status !== "ACTIVE" &&
      acquisition.status !== "REVISION_REQUESTED"
    ) {
      return NextResponse.json(
        { error: "Cannot deliver in current status" },
        { status: 400 },
      );
    }
    if (acquisition.project.currentAmount < acquisition.package.price) {
      return NextResponse.json(
        { error: "Insufficient donated funds for delivery" },
        { status: 400 },
      );
    }

    await prisma.serviceAcquisition.update({
      where: { id: acquisitionId },
      data: {
        status: "DELIVERED",
        deliveredAt: new Date(),
        deliveryMessage: message || null,
      },
    });

    // Send system message in chat
    if (acquisition.chat) {
      await prisma.message.create({
        data: {
          id: crypto.randomUUID(),
          chatId: acquisition.chat.id,
          senderId: session.user.id,
          content: `📦 **Delivery submitted!** ${message ? `\n\n${message}` : ""}\n\nThe NGO will review and either accept or request a revision.`,
        },
      });
    }

    return NextResponse.json({ success: true, status: "DELIVERED" });
  }

  // NGO accepts delivery
  if (action === "accept") {
    if (!isNgo) {
      return NextResponse.json(
        { error: "Only NGO can accept" },
        { status: 403 },
      );
    }
    if (acquisition.status !== "DELIVERED") {
      return NextResponse.json(
        { error: "Can only accept delivered work" },
        { status: 400 },
      );
    }

    await prisma.serviceAcquisition.update({
      where: { id: acquisitionId },
      data: {
        status: "COMPLETED",
        completedAt: new Date(),
      },
    });

    if (acquisition.chat) {
      await prisma.message.create({
        data: {
          id: crypto.randomUUID(),
          chatId: acquisition.chat.id,
          senderId: session.user.id,
          content:
            "✅ **Delivery accepted!** Thank you for the great work. You can now leave a review.",
        },
      });
    }

    return NextResponse.json({ success: true, status: "COMPLETED" });
  }

  // NGO requests revision
  if (action === "revision") {
    if (!isNgo) {
      return NextResponse.json(
        { error: "Only NGO can request revision" },
        { status: 403 },
      );
    }
    if (acquisition.status !== "DELIVERED") {
      return NextResponse.json(
        { error: "Can only request revision on delivered work" },
        { status: 400 },
      );
    }

    const maxRevisions = acquisition.package.revisions;
    if (acquisition.revisionsUsed >= maxRevisions) {
      return NextResponse.json(
        {
          error: `No revisions remaining (${maxRevisions} included in your package)`,
        },
        { status: 400 },
      );
    }

    await prisma.serviceAcquisition.update({
      where: { id: acquisitionId },
      data: {
        status: "REVISION_REQUESTED",
        revisionsUsed: { increment: 1 },
      },
    });

    if (acquisition.chat) {
      await prisma.message.create({
        data: {
          id: crypto.randomUUID(),
          chatId: acquisition.chat.id,
          senderId: session.user.id,
          content: `🔄 **Revision requested** (${acquisition.revisionsUsed + 1}/${maxRevisions} used)\n\n${message || "Please revise the delivery."}`,
        },
      });
    }

    return NextResponse.json({ success: true, status: "REVISION_REQUESTED" });
  }

  return NextResponse.json({ error: "Invalid action" }, { status: 400 });
}
