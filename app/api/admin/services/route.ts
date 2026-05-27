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
    return NextResponse.json(
      { error: admin.error },
      { status: admin.status },
    );
  }

  const services = await prisma.service.findMany({
    include: {
      provider: {
        select: { name: true, email: true },
      },
      packages: {
        orderBy: { price: "asc" },
      },
      _count: { select: { acquisitions: true, reviews: true } },
    },
    orderBy: { createdAt: "desc" },
  });

  return NextResponse.json(services);
}

export async function POST(request: Request) {
  const admin = await requireAdmin();
  if ("error" in admin) {
    return NextResponse.json(
      { error: admin.error },
      { status: admin.status },
    );
  }

  const body = await request.json();
  const {
    name,
    description,
    category,
    tags,
    image,
    portfolioImages,
    featured,
    providerId,
    packages,
  } = body;

  if (!name || !description || !category || !providerId || !packages || packages.length === 0) {
    return NextResponse.json(
      { error: "Missing required fields" },
      { status: 400 },
    );
  }

  const service = await prisma.service.create({
    data: {
      id: crypto.randomUUID(),
      name,
      description,
      category,
      tags: tags || [],
      image: image || null,
      portfolioImages: portfolioImages || [],
      featured: featured || false,
      providerId,
    },
  });

  for (const pkg of packages) {
    await prisma.servicePackage.create({
      data: {
        id: crypto.randomUUID(),
        serviceId: service.id,
        name: pkg.name,
        description: pkg.description,
        price: Number(pkg.price),
        deliveryDays: Number(pkg.deliveryDays),
        revisions: Number(pkg.revisions) || 1,
      },
    });
  }

  return NextResponse.json(service);
}

export async function PATCH(request: Request) {
  const admin = await requireAdmin();
  if ("error" in admin) {
    return NextResponse.json(
      { error: admin.error },
      { status: admin.status },
    );
  }

  const body = await request.json();
  const { id, ...updateData } = body;

  if (!id) {
    return NextResponse.json(
      { error: "Missing service ID" },
      { status: 400 },
    );
  }

  // Handle package updates separately
  const { packages, ...serviceData } = updateData;

  const service = await prisma.service.update({
    where: { id },
    data: serviceData,
  });

  if (packages && packages.length > 0) {
    // Delete existing packages and recreate
    await prisma.servicePackage.deleteMany({
      where: { serviceId: id },
    });

    for (const pkg of packages) {
      await prisma.servicePackage.create({
        data: {
          id: crypto.randomUUID(),
          serviceId: id,
          name: pkg.name,
          description: pkg.description,
          price: Number(pkg.price),
          deliveryDays: Number(pkg.deliveryDays),
          revisions: Number(pkg.revisions) || 1,
        },
      });
    }
  }

  return NextResponse.json(service);
}

export async function DELETE(request: Request) {
  const admin = await requireAdmin();
  if ("error" in admin) {
    return NextResponse.json(
      { error: admin.error },
      { status: admin.status },
    );
  }

  const { searchParams } = new URL(request.url);
  const id = searchParams.get("id");

  if (!id) {
    return NextResponse.json(
      { error: "Missing service ID" },
      { status: 400 },
    );
  }

  await prisma.service.delete({
    where: { id },
  });

  return NextResponse.json({ success: true });
}
