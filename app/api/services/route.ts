import { NextResponse } from "next/server";
import { prisma } from "@/app/lib/db";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const category = searchParams.get("category");
  const tag = searchParams.get("tag");
  const search = searchParams.get("search");

  const services = await prisma.service.findMany({
    where: {
      active: true,
      ...(category && category !== "all" ? { category } : {}),
      ...(tag ? { tags: { has: tag } } : {}),
      ...(search
        ? {
            OR: [
              { name: { contains: search, mode: "insensitive" } },
              { description: { contains: search, mode: "insensitive" } },
              { tags: { has: search } },
            ],
          }
        : {}),
    },
    include: {
      provider: {
        select: { name: true, email: true, providerBio: true },
      },
      packages: {
        orderBy: { price: "asc" },
      },
      reviews: {
        select: { rating: true },
      },
      _count: { select: { reviews: true } },
    },
    orderBy: [{ featured: "desc" }, { rating: "desc" }, { createdAt: "desc" }],
  });

  return NextResponse.json(services);
}
