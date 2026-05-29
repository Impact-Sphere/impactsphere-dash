import { Prisma } from "@prisma/client";
import { headers } from "next/headers";
import { NextResponse } from "next/server";
import { auth } from "@/app/lib/auth";
import { prisma } from "@/app/lib/db";

export async function GET(request: Request) {
  const session = await auth.api.getSession({
    headers: await headers(),
  });

  const { searchParams } = new URL(request.url);
  const category = searchParams.get("category");
  const mine = searchParams.get("mine");
  const ngoId = searchParams.get("ngoId");
  const q = searchParams.get("q")?.trim();
  const recent = searchParams.get("recent");

  const isAdmin =
    session &&
    (
      await prisma.user.findUnique({
        where: { id: session.user.id },
        select: { userType: true },
      })
    )?.userType === "ADMIN";

  if (ngoId) {
    const projects = await prisma.project.findMany({
      where: {
        ngoId,
        status: "ACTIVE",
        ...(isAdmin ? {} : { approvalStatus: "APPROVED" }),
      },
      include: {
        ngo: { select: { name: true, image: true, ngoInfo: true } },
        projectDocuments: true,
        _count: { select: { donations: true } },
      },
      orderBy: { createdAt: "desc" },
    });
    return NextResponse.json(projects);
  }

  let projects = [];

  if (mine === "true" && session) {
    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: { userType: true },
    });

    if (user?.userType === "NGO") {
      projects = await prisma.project.findMany({
        where: { ngoId: session.user.id },
        include: {
          ngo: { select: { name: true, image: true, ngoInfo: true } },
          projectDocuments: true,
          _count: { select: { donations: true } },
        },
        orderBy: { createdAt: "desc" },
      });
    }

    else if (user?.userType === "ADMIN") {
      projects = await prisma.project.findMany({
        include: {
          ngo: { select: { name: true, image: true, ngoInfo: true } },
          projectDocuments: true,
          _count: { select: { donations: true } },
        },
        orderBy: { createdAt: "desc" },
      });
    }

    else if (user?.userType === "COMPANY") {
      const donations = await prisma.donation.findMany({
        where: { companyId: session.user.id },
        include: {
          project: {
            include: {
              ngo: { select: { name: true, image: true, ngoInfo: true } },
              projectDocuments: true,
              _count: { select: { donations: true } },
            },
          },
        },
        orderBy: { createdAt: "desc" },
      });
      const seen = new Set<string>();
      // const projects: (typeof donations)[number]["project"][] = [];

      for (const donation of donations) {
        const p = donation.project;
        if (!seen.has(p.id)) {
          seen.add(p.id);
          projects.push(p);
        }
      }
    }

    // fun
    projects = await Promise.all(projects.map(async (proj) => {return {...proj, isFavorited: session?.user && !!await prisma.favoriteProject.findUnique({where: {userId_projectId: {
      userId: session.user.id,
      projectId: proj.id,
    }}})}}));

    return NextResponse.json(projects);
  }

  // Full-text search overrides everything else on the discovery list
  if (q) {
    const approvalFilter = isAdmin
      ? Prisma.sql``
      : Prisma.sql`AND p."approvalStatus" = 'APPROVED'`;
    const categoryFilter =
      category && category !== "all"
        ? Prisma.sql`AND p.category = ${category}`
        : Prisma.sql``;

    const searchQuery = Prisma.sql`websearch_to_tsquery('english', ${q})`;

    const searchResults = await prisma.$queryRaw<{ id: string }[]>`
      SELECT p.id
      FROM project p
      LEFT JOIN "user" u ON p."ngoId" = u.id
      LEFT JOIN ngo_info n ON u.id = n."userId"
      WHERE p.status = 'ACTIVE'
        ${approvalFilter}
        ${categoryFilter}
        AND (
          p."searchVector" @@ ${searchQuery}
          OR to_tsvector('english', coalesce(n."ngoName", '')) @@ ${searchQuery}
        )
      ORDER BY ts_rank(p."searchVector", ${searchQuery}) DESC,
               p."createdAt" DESC
    `;

    const projectIds = searchResults.map((r) => r.id);
    if (projectIds.length === 0) return NextResponse.json([]);

    const projects = await prisma.project.findMany({
      where: { id: { in: projectIds } },
      include: {
        ngo: { select: { name: true, image: true, ngoInfo: true } },
        _count: { select: { donations: true } },
      },
    });

    const projectMap = new Map(projects.map((p) => [p.id, p]));
    const ordered = projectIds
      .map((id) => projectMap.get(id))
      .filter((p): p is NonNullable<typeof p> => p !== undefined);

    return NextResponse.json(ordered);
  }

  // Standard discovery list with optional recent filter
  const where: Prisma.ProjectWhereInput = {
    status: "ACTIVE",
    ...(isAdmin ? {} : { approvalStatus: "APPROVED" }),
    ...(category && category !== "all" ? { category } : {}),
  };

  if (recent === "true") {
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
    where.createdAt = { gte: thirtyDaysAgo };
  }

  projects = await prisma.project.findMany({
    where,
    include: {
      ngo: { select: { name: true, image: true, ngoInfo: true } },
      projectDocuments: true,
      _count: { select: { donations: true } },
    },
    orderBy: { createdAt: "desc" },
  });

  // fun
  projects = await Promise.all(projects.map(async (proj) => {return {...proj, isFavorited: session?.user && !!await prisma.favoriteProject.findUnique({where: {userId_projectId: {
    userId: session.user.id,
    projectId: proj.id,
  }}})}}));

  return NextResponse.json(projects);
}

export async function POST(request: Request) {
  const session = await auth.api.getSession({
    headers: await headers(),
  });

  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: { userType: true, approvalStatus: true },
  });

  if (user?.userType !== "NGO") {
    return NextResponse.json(
      { error: "Only NGOs can create projects" },
      { status: 403 },
    );
  }

  if (user.approvalStatus !== "APPROVED") {
    return NextResponse.json(
      {
        error:
          "Your account is pending approval. You cannot create projects yet.",
      },
      { status: 403 },
    );
  }

  const body = await request.json();
  const {
    title,
    description,
    category,
    image,
    targetBudget,
    projectDocuments,
  } = body;

  if (!title || !description || !category || !targetBudget) {
    return NextResponse.json(
      { error: "Missing required fields" },
      { status: 400 },
    );
  }

  const project = await prisma.project.create({
    data: {
      title,
      description,
      category,
      image: image || null,
      targetBudget: Number(targetBudget),
      approvalStatus: "PENDING",
      ngoId: session.user.id,
      projectDocuments: projectDocuments?.length
        ? { connect: projectDocuments.map((id: string) => ({ id })) }
        : undefined,
    },
  });

  return NextResponse.json(project, { status: 201 });
}
