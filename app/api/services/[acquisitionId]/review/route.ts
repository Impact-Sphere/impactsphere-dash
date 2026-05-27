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
  const { rating, comment } = body;

  if (!rating || rating < 1 || rating > 5) {
    return NextResponse.json({ error: "Rating must be 1-5" }, { status: 400 });
  }

  const acquisition = await prisma.serviceAcquisition.findUnique({
    where: { id: acquisitionId },
    include: {
      project: { select: { ngoId: true } },
      service: true,
      review: true,
    },
  });

  if (!acquisition) {
    return NextResponse.json({ error: "Acquisition not found" }, { status: 404 });
  }

  if (acquisition.project.ngoId !== session.user.id) {
    return NextResponse.json({ error: "Only the NGO can leave a review" }, { status: 403 });
  }

  if (acquisition.status !== "COMPLETED") {
    return NextResponse.json({ error: "Can only review completed services" }, { status: 400 });
  }

  if (acquisition.review) {
    return NextResponse.json({ error: "Review already submitted" }, { status: 400 });
  }

  await prisma.serviceReview.create({
    data: {
      id: crypto.randomUUID(),
      serviceId: acquisition.serviceId,
      acquisitionId: acquisitionId,
      userId: session.user.id,
      rating: Number(rating),
      comment: comment || null,
    },
  });

  // Update service rating
  const allReviews = await prisma.serviceReview.findMany({
    where: { serviceId: acquisition.serviceId },
    select: { rating: true },
  });

  const avgRating = allReviews.reduce((sum, r) => sum + r.rating, 0) / allReviews.length;

  await prisma.service.update({
    where: { id: acquisition.serviceId },
    data: {
      rating: avgRating,
      reviewCount: allReviews.length,
    },
  });

  return NextResponse.json({ success: true });
}
