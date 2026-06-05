import "dotenv/config";
import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "@prisma/client";
import { hashPassword } from "better-auth/crypto";
import { Pool } from "pg";

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});

const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

const NGOS = [
  {
    name: "Green Earth Alliance",
    email: "ngo1@demo.local",
    password: "demoongpass",
    ngoName: "Green Earth Alliance",
    taxId: "NGO-001-2024",
    contact: "contact@greenearth.demo | +1 555-0101",
    goals:
      "Reforest 10,000 hectares of degraded land across the Amazon basin by 2030. Empower indigenous communities with sustainable livelihoods and environmental monitoring tools.",
    challenges:
      "Limited funding for long-term maintenance, illegal logging activities in buffer zones, and climate variability affecting sapling survival rates.",
    legalRepName: "Maria Silva",
    verificationTier: "FORMAL_REGISTRATION" as const,
    statutesUrl: "https://example.com/greenearth-statutes.pdf",
    activityReportUrl: "https://example.com/greenearth-report-2024.pdf",
  },
  {
    name: "Code for Kids",
    email: "ngo2@demo.local",
    password: "demongopass",
    ngoName: "Code for Kids Foundation",
    taxId: "NGO-002-2024",
    contact: "hello@codeforkids.demo | +1 555-0102",
    goals:
      "Bring computer science education to 500 rural schools in developing nations. Provide hardware, curriculum, and trained educators.",
    challenges:
      "Unreliable electricity in remote areas, lack of local tech talent for sustained programs, and high shipping costs for equipment.",
    legalRepName: "James Chen",
    verificationTier: "FORMAL_REGISTRATION" as const,
    statutesUrl: "https://example.com/cfk-statutes.pdf",
    activityReportUrl: "https://example.com/cfk-report-2024.pdf",
  },
  {
    name: "HealthReach",
    email: "ngo3@demo.local",
    password: "demongopass",
    ngoName: "HealthReach International",
    taxId: "NGO-003-2024",
    contact: "info@healthreach.demo | +1 555-0103",
    goals:
      "Deploy mobile medical clinics to serve 200,000 people in underserved regions. Focus on maternal health, vaccinations, and disease prevention.",
    challenges:
      "Supply chain disruptions for vaccines, difficulty retaining trained medical staff in remote postings, and infrastructure gaps.",
    legalRepName: "Dr. Aisha Patel",
    verificationTier: "FORMAL_REGISTRATION" as const,
    statutesUrl: "https://example.com/healthreach-statutes.pdf",
    activityReportUrl: "https://example.com/healthreach-report-2024.pdf",
  },
];

const COMPANIES = [
  {
    name: "TechCorp Global",
    email: "company1@demo.local",
    password: "democompanypass",
    companyName: "TechCorp Global",
    taxId: "CORP-001-2024",
    contact: "csr@techcorp.demo | +1 555-0201",
    causes:
      "Education equity, climate tech innovation, digital accessibility for disabled communities, and STEM scholarships for underrepresented groups.",
    representativeName: "Sarah Johnson",
    representativePosition: "CSR Director",
  },
  {
    name: "Summit Ventures",
    email: "company2@demo.local",
    password: "democompanypass",
    companyName: "Summit Ventures",
    taxId: "CORP-002-2024",
    contact: "impact@summit.demo | +1 555-0202",
    causes:
      "Clean energy transition, sustainable agriculture, ocean conservation, and affordable housing initiatives.",
    representativeName: "Michael Torres",
    representativePosition: "Impact Investment Lead",
  },
];

const PROJECT_SEEDS = [
  {
    title: "Amazon Reforestation & Digital Mapping",
    category: "Environment",
    description:
      "Leveraging satellite AI to track growth in real-time while employing local communities for active restoration efforts across 5,000 hectares of degraded rainforest.",
    image:
      "https://images.unsplash.com/photo-1542601906990-b4d3fb778b09?w=800&auto=format&fit=crop&q=60",
    target: 1_600_000,
    current: 1_200_000,
    ngoIdx: 0,
  },
  {
    title: "Code For Tomorrow: Rural India",
    category: "Education",
    description:
      "Bringing STEM education and fiber connectivity to over 50 remote villages. Setting up computer labs and training local teachers.",
    image:
      "https://images.unsplash.com/photo-1509062522246-3755977927d7?w=800&auto=format&fit=crop&q=60",
    target: 100_000,
    current: 45_000,
    ngoIdx: 1,
  },
  {
    title: "Solar Powered Medical Hubs",
    category: "Healthcare",
    description:
      "Modular, solar-powered clinics providing 24/7 care in off-grid sub-Saharan Africa. Each hub serves 10,000 people.",
    image:
      "https://images.unsplash.com/photo-1576091160399-112ba8d25d1d?w=800&auto=format&fit=crop&q=60",
    target: 300_000,
    current: 267_000,
    ngoIdx: 2,
  },
  {
    title: "Open Source Impact Ledger",
    category: "Tech Equity",
    description:
      "Blockchain infrastructure for transparent donation tracking for global NGOs. Every dollar traceable from donor to beneficiary.",
    image:
      "https://images.unsplash.com/photo-1639762681485-074b7f938ba0?w=800&auto=format&fit=crop&q=60",
    target: 150_000,
    current: 18_000,
    ngoIdx: 1,
  },
  {
    title: "Clean Water for Rural Schools",
    category: "Education",
    description:
      "Installing rainwater harvesting and filtration systems in 200 rural schools. Reducing waterborne illness by 80%.",
    image:
      "https://www.wateraid.org/us/sites/g/files/jkxoof291/files/youtuber-jimmy-donaldson-aka-mrbeast-and-ben-azelart-during-a-visit-to-dyetse-village-malawi-where-a-new-well-has-been-installed-to-provide-clean-water-to-the-community-july-2025.jpg",
    target: 250_000,
    current: 95_000,
    ngoIdx: 1,
  },
  {
    title: "Wildlife Corridor Restoration",
    category: "Environment",
    description:
      "Creating connected wildlife corridors across fragmented habitats in Southeast Asia. Protecting endangered elephant and tiger populations.",
    image:
      "https://images.unsplash.com/photo-1504280390367-361c6d9f38f4?w=800&auto=format&fit=crop&q=60",
    target: 800_000,
    current: 320_000,
    ngoIdx: 0,
  },
  {
    title: "Disaster Relief Drone Network",
    category: "Disaster Relief",
    description:
      "Building a fleet of cargo drones to deliver medical supplies and food to disaster zones within 2 hours of an emergency.",
    image:
      "https://images.unsplash.com/photo-1589656966895-2f33e7653819?w=800&auto=format&fit=crop&q=60",
    target: 450_000,
    current: 180_000,
    ngoIdx: 2,
  },
  {
    title: "Mental Health for Refugees",
    category: "Healthcare",
    description:
      "Providing culturally-adapted trauma counseling and mental health services to 50,000 displaced persons in conflict zones.",
    image:
      "https://images.unsplash.com/photo-1573497019940-1c28c88b4f3e?w=800&auto=format&fit=crop&q=60",
    target: 380_000,
    current: 410_000,
    ngoIdx: 2,
  },
  {
    title: "AI Literacy for Farmers",
    category: "Tech Equity",
    description:
      "Teaching smallholder farmers to use AI-powered crop prediction and pest detection via low-bandwidth mobile apps.",
    image:
      "https://images.unsplash.com/photo-1625246333195-78d9c38ad449?w=800&auto=format&fit=crop&q=60",
    target: 120_000,
    current: 30_000,
    ngoIdx: 1,
  },
  {
    title: "Coral Reef Regeneration Lab",
    category: "Environment",
    description:
      "Building underwater nurseries to regrow coral reefs in the Caribbean. Using heat-resistant coral strains to combat bleaching.",
    image:
      "https://images.unsplash.com/photo-1546026423-cc4642628d2b?w=800&auto=format&fit=crop&q=60",
    target: 600_000,
    current: 540_000,
    ngoIdx: 0,
  },
  {
    title: "Girls STEM Scholarships",
    category: "Education",
    description:
      "Full-ride scholarships for 1,000 girls from underserved communities to pursue degrees in science, technology, engineering, and math.",
    image:
      "https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcS7Abfeb7a5nH90AfzOmXQoHX9Ckg3iV1xVig&s",
    target: 2_000_000,
    current: 890_000,
    ngoIdx: 1,
  },
  {
    title: "Earthquake-Resistant Housing",
    category: "Disaster Relief",
    description:
      "Constructing 500 earthquake-resistant homes using locally-sourced materials and community labor in high-risk seismic zones.",
    image:
      "https://images.unsplash.com/photo-1560518883-ce09059eeffa?w=800&auto=format&fit=crop&q=60",
    target: 750_000,
    current: 220_000,
    ngoIdx: 2,
  },
  {
    title: "Accessible Tech for Blind Students",
    category: "Tech Equity",
    description:
      "Developing and distributing open-source screen readers and tactile learning devices for visually impaired students across 30 countries.",
    image:
      "https://images.unsplash.com/photo-1589656966895-2f33e7653819?w=800&auto=format&fit=crop&q=60",
    target: 200_000,
    current: 155_000,
    ngoIdx: 1,
  },
  {
    title: "Community Gardens Network",
    category: "Environment",
    description:
      "Establishing 100 community gardens in food deserts. Teaching urban agriculture and providing fresh produce to 50,000 residents.",
    image:
      "https://images.unsplash.com/photo-1416879595882-3373a0480b5b?w=800&auto=format&fit=crop&q=60",
    target: 85_000,
    current: 72_000,
    ngoIdx: 0,
  },
  {
    title: "Mobile Maternity Clinics",
    category: "Healthcare",
    description:
      "Retrofitted buses providing prenatal care, safe delivery, and postnatal support in regions with no hospital access.",
    image:
      "https://images.unsplash.com/photo-1584515933487-779824d29309?w=800&auto=format&fit=crop&q=60",
    target: 420_000,
    current: 195_000,
    ngoIdx: 2,
  },
];

async function seedAdmin() {
  const email = process.env.ADMIN_EMAIL || "admin@impactsphere.local";
  const password = process.env.ADMIN_PASSWORD || "adminpassword123";
  const name = process.env.ADMIN_NAME || "Admin User";

  const existing = await prisma.user.findUnique({
    where: { email },
  });

  if (existing) {
    console.log(`Admin user ${email} already exists.`);
    if (existing.userType !== "ADMIN") {
      await prisma.user.update({
        where: { id: existing.id },
        data: { userType: "ADMIN" },
      });
      console.log("Promoted to ADMIN.");
    }
    return;
  }

  const hashedPassword = await hashPassword(password);
  const id = crypto.randomUUID();
  const now = new Date();

  await prisma.user.create({
    data: {
      id,
      email,
      name,
      emailVerified: true,
      userType: "ADMIN",
      approvalStatus: "APPROVED",
      createdAt: now,
      updatedAt: now,
    },
  });

  await prisma.account.create({
    data: {
      id: crypto.randomUUID(),
      userId: id,
      accountId: email,
      providerId: "credential",
      password: hashedPassword,
      createdAt: now,
      updatedAt: now,
    },
  });

  console.log(`Admin user created: ${email} / ${password}`);
}

async function seedNgos() {
  const created: string[] = [];
  for (const ngo of NGOS) {
    const existing = await prisma.user.findUnique({
      where: { email: ngo.email },
      include: { ngoInfo: { include: { registrationDocuments: true } } },
    });
    if (existing) {
      created.push(existing.id);
      console.log(`NGO ${ngo.email} already exists.`);

      // Ensure existing seed NGO has required onboarding fields
      const info = existing.ngoInfo;
      const needsRegDoc = !info?.registrationDocuments?.length;
      const needsIdUrl = !info?.representativeIdDocumentUrl;

      if (needsRegDoc || needsIdUrl) {
        let regDocId: string | undefined;
        if (needsRegDoc) {
          const regDoc = await prisma.uploadedFile.create({
            data: {
              id: crypto.randomUUID(),
              url: "https://example.com/demo-registration-doc.pdf",
              fileName: "demo-registration-doc.pdf",
              mimeType: "application/pdf",
              size: 1024,
            },
          });
          regDocId = regDoc.id;
        }

        await prisma.ngoInfo.update({
          where: { userId: existing.id },
          data: {
            ...(regDocId
              ? {
                  registrationDocuments: {
                    connect: { id: regDocId },
                  },
                }
              : {}),
            ...(needsIdUrl
              ? {
                  representativeIdDocumentUrl:
                    "https://example.com/demo-id-doc.pdf",
                }
              : {}),
          },
        });
        console.log(`  -> Fixed missing onboarding fields for ${ngo.email}`);
      }
      continue;
    }

    const id = crypto.randomUUID();
    const now = new Date();
    const hashedPassword = await hashPassword(ngo.password);

    // Create a dummy registration document so onboarding passes
    const regDoc = await prisma.uploadedFile.create({
      data: {
        id: crypto.randomUUID(),
        url: "https://example.com/demo-registration-doc.pdf",
        fileName: "demo-registration-doc.pdf",
        mimeType: "application/pdf",
        size: 1024,
      },
    });

    await prisma.user.create({
      data: {
        id,
        email: ngo.email,
        name: ngo.name,
        emailVerified: true,
        userType: "NGO",
        approvalStatus: "APPROVED",
        createdAt: now,
        updatedAt: now,
        ngoInfo: {
          create: {
            id: crypto.randomUUID(),
            ngoName: ngo.ngoName,
            country: "Unknown",
            cityRegion: "Unknown",
            ngoType: "other",
            yearFounded: 2000,
            missionStatement: ngo.goals,
            activitiesDescription: ngo.challenges,
            currentOrPastProjects: "Seed project data",
            contactEmail: ngo.email,
            phoneNumber: "",
            website: "",
            registrationNumber: "not applicable",
            registrationDocuments: { connect: { id: regDoc.id } },
            representativeFullName: "Seed Representative",
            representativeRole: "Director",
            representativeIdType: "Passport",
            representativeIdNumber: "seed-000",
            representativeIdDocumentUrl: "https://example.com/demo-id-doc.pdf",
            activityProofUrls: undefined,
            activityProofLink: "",
            declarationConfirmed: true,
            taxIdentificationNumber: ngo.taxId,
            contactInfo: ngo.contact,
            mainGoals: ngo.goals,
            challenges: ngo.challenges,
            legalRepName: ngo.legalRepName,
            verificationTier: ngo.verificationTier,
            statutesUrl: ngo.statutesUrl || null,
            activityReportUrl: ngo.activityReportUrl || null,
          },
        },
      },
    });

    await prisma.account.create({
      data: {
        id: crypto.randomUUID(),
        userId: id,
        accountId: ngo.email,
        providerId: "credential",
        password: hashedPassword,
        createdAt: now,
        updatedAt: now,
      },
    });

    created.push(id);
    console.log(`NGO created: ${ngo.email} / ${ngo.password}`);
  }
  return created;
}

async function seedCompanies() {
  const created: string[] = [];
  for (const corp of COMPANIES) {
    const existing = await prisma.user.findUnique({
      where: { email: corp.email },
      include: { companyInfo: { include: { registrationDocuments: true } } },
    });
    if (existing) {
      created.push(existing.id);
      console.log(`Company ${corp.email} already exists.`);

      // Ensure existing seed company has required onboarding fields
      const info = existing.companyInfo;
      const needsRegDoc = !info?.registrationDocuments?.length;
      const needsIdUrl = !info?.representativeIdDocumentUrl;

      if (needsRegDoc || needsIdUrl) {
        let regDocId: string | undefined;
        if (needsRegDoc) {
          const regDoc = await prisma.uploadedFile.create({
            data: {
              id: crypto.randomUUID(),
              url: "https://example.com/demo-registration-doc.pdf",
              fileName: "demo-registration-doc.pdf",
              mimeType: "application/pdf",
              size: 1024,
            },
          });
          regDocId = regDoc.id;
        }

        await prisma.companyInfo.update({
          where: { userId: existing.id },
          data: {
            ...(regDocId
              ? {
                  registrationDocuments: {
                    connect: { id: regDocId },
                  },
                }
              : {}),
            ...(needsIdUrl
              ? {
                  representativeIdDocumentUrl:
                    "https://example.com/demo-id-doc.pdf",
                }
              : {}),
          },
        });
        console.log(`  -> Fixed missing onboarding fields for ${corp.email}`);
      }
      continue;
    }

    const id = crypto.randomUUID();
    const now = new Date();
    const hashedPassword = await hashPassword(corp.password);

    // Create a dummy registration document so onboarding passes
    const regDoc = await prisma.uploadedFile.create({
      data: {
        id: crypto.randomUUID(),
        url: "https://example.com/demo-registration-doc.pdf",
        fileName: "demo-registration-doc.pdf",
        mimeType: "application/pdf",
        size: 1024,
      },
    });

    await prisma.user.create({
      data: {
        id,
        email: corp.email,
        name: corp.name,
        emailVerified: true,
        userType: "COMPANY",
        approvalStatus: "APPROVED",
        createdAt: now,
        updatedAt: now,
        companyInfo: {
          create: {
            id: crypto.randomUUID(),
            companyName: corp.companyName,
            country: "Unknown",
            industryType: "Other",
            businessDescription: "Seed company profile",
            yearFounded: 2000,
            registrationNumber: "seed-registration",
            taxVatNumber: "",
            registrationDocuments: { connect: { id: regDoc.id } },
            contactEmail: corp.email,
            website: "",
            phoneNumber: "",
            registeredAddress: "Seed Address",
            representativeFullName: "Seed Representative",
            representativeJobTitle: "CEO",
            representativeIdType: "Passport",
            representativeIdNumber: "seed-000",
            representativeIdDocumentUrl: "https://example.com/demo-id-doc.pdf",
            declarationConfirmed: true,
            taxIdentificationNumber: corp.taxId,
            contactInfo: corp.contact,
            causesSupported: corp.causes,
            representativeName: corp.representativeName,
            representativePosition: corp.representativePosition,
          },
        },
      },
    });

    await prisma.account.create({
      data: {
        id: crypto.randomUUID(),
        userId: id,
        accountId: corp.email,
        providerId: "credential",
        password: hashedPassword,
        createdAt: now,
        updatedAt: now,
      },
    });

    created.push(id);
    console.log(`Company created: ${corp.email} / ${corp.password}`);
  }
  return created;
}

async function seedProjects(ngoIds: string[]) {
  const now = new Date();

  for (const p of PROJECT_SEEDS) {
    const existing = await prisma.project.findFirst({
      where: { title: p.title },
    });
    if (existing) {
      console.log(`Project "${p.title}" already exists. Skipping.`);
      continue;
    }

    const ngoId = ngoIds[p.ngoIdx];
    const status = p.current >= p.target ? "COMPLETED" : "ACTIVE";

    await prisma.project.create({
      data: {
        id: crypto.randomUUID(),
        title: p.title,
        description: p.description,
        category: p.category,
        image: p.image,
        targetBudget: p.target,
        currentAmount: p.current,
        status,
        approvalStatus: "APPROVED",
        createdAt: now,
        updatedAt: now,
        ngoId,
      },
    });

    console.log(`Project created: ${p.title} (${status})`);
  }
}

async function seedDonations(_projectIds: string[], companyIds: string[]) {
  const projects = await prisma.project.findMany({
    include: { donations: true },
  });
  const now = new Date();

  for (const project of projects) {
    if (project.currentAmount <= 0) continue;
    if (project.donations.length > 0) {
      console.log(
        `Project "${project.title}" already has donations. Skipping.`,
      );
      continue;
    }

    const companyId = companyIds[Math.floor(Math.random() * companyIds.length)];
    const amount = Math.min(
      project.currentAmount,
      Math.max(5000, Math.floor(project.currentAmount * 0.4)),
    );

    await prisma.donation.create({
      data: {
        id: crypto.randomUUID(),
        amount,
        projectId: project.id,
        companyId,
        createdAt: now,
      },
    });

    console.log(`Donation created: $${amount} -> ${project.title}`);
  }
}

const SERVICES = [
  {
    name: "Social Media Management",
    description:
      "Full social media strategy and management including content planning, posting, engagement, and analytics reporting across all major platforms.",
    category: "Social Media",
    tags: ["social media", "content", "management", "strategy"],
    packages: [
      {
        name: "Basic",
        description: "1 platform, 8 posts/month, basic analytics",
        price: 1200,
        deliveryDays: 30,
        revisions: 1,
      },
      {
        name: "Standard",
        description: "3 platforms, 20 posts/month, full analytics, engagement",
        price: 2500,
        deliveryDays: 30,
        revisions: 2,
      },
      {
        name: "Premium",
        description:
          "All platforms, unlimited posts, full analytics, engagement, monthly strategy call",
        price: 4000,
        deliveryDays: 30,
        revisions: 3,
      },
    ],
  },
  {
    name: "Content Production",
    description:
      "Professional photo and video content creation for campaigns, events, and ongoing storytelling.",
    category: "Social Media",
    tags: ["content", "video", "photo", "production"],
    packages: [
      {
        name: "Basic",
        description: "10 photos, basic editing",
        price: 800,
        deliveryDays: 7,
        revisions: 1,
      },
      {
        name: "Standard",
        description: "20 photos + 2 short videos, pro editing",
        price: 1800,
        deliveryDays: 10,
        revisions: 2,
      },
      {
        name: "Premium",
        description: "40 photos + 5 videos, pro editing, motion graphics",
        price: 3500,
        deliveryDays: 14,
        revisions: 3,
      },
    ],
  },
  {
    name: "Event Organization",
    description:
      "End-to-end event planning and execution including venue sourcing, logistics, vendor coordination, and on-site support.",
    category: "Events",
    tags: ["events", "planning", "logistics", "coordination"],
    packages: [
      {
        name: "Basic",
        description: "Small event up to 50 people, venue + basic logistics",
        price: 2500,
        deliveryDays: 14,
        revisions: 1,
      },
      {
        name: "Standard",
        description:
          "Medium event up to 200 people, full logistics, catering coordination",
        price: 5000,
        deliveryDays: 21,
        revisions: 2,
      },
      {
        name: "Premium",
        description:
          "Large event 500+ people, full production, AV, entertainment, VIP management",
        price: 10000,
        deliveryDays: 30,
        revisions: 3,
      },
    ],
  },
  {
    name: "Communication Strategy",
    description:
      "Develop a comprehensive communication plan including messaging framework, target audience analysis, and channel strategy.",
    category: "Communication",
    tags: ["strategy", "communication", "planning", "messaging"],
    packages: [
      {
        name: "Basic",
        description: "1-page strategy doc, 1 channel recommendation",
        price: 1500,
        deliveryDays: 7,
        revisions: 1,
      },
      {
        name: "Standard",
        description: "Full strategy doc, 3 channels, content calendar template",
        price: 3500,
        deliveryDays: 14,
        revisions: 2,
      },
      {
        name: "Premium",
        description:
          "Complete strategy, all channels, 3-month content calendar, KPI framework",
        price: 6000,
        deliveryDays: 21,
        revisions: 3,
      },
    ],
  },
  {
    name: "External Relations & Partnerships",
    description:
      "Identify and establish partnerships with corporations, media outlets, and influencers.",
    category: "Partnerships",
    tags: ["partnerships", "relations", "outreach", "networking"],
    packages: [
      {
        name: "Basic",
        description: "5 partner prospects, initial outreach templates",
        price: 2000,
        deliveryDays: 14,
        revisions: 1,
      },
      {
        name: "Standard",
        description: "15 prospects, personalized outreach, 2 intro meetings",
        price: 4000,
        deliveryDays: 21,
        revisions: 2,
      },
      {
        name: "Premium",
        description:
          "30 prospects, full campaign, 5 meetings, partnership agreements",
        price: 7500,
        deliveryDays: 30,
        revisions: 3,
      },
    ],
  },
  {
    name: "Merchandise Design & Production",
    description:
      "Design and produce branded merchandise including t-shirts, tote bags, stickers, and promotional materials.",
    category: "Events",
    tags: ["merchandise", "design", "branding", "production"],
    packages: [
      {
        name: "Basic",
        description: "1 item design, 50 units production",
        price: 1000,
        deliveryDays: 14,
        revisions: 1,
      },
      {
        name: "Standard",
        description: "3 item designs, 200 units, packaging",
        price: 2500,
        deliveryDays: 21,
        revisions: 2,
      },
      {
        name: "Premium",
        description: "5 item designs, 500 units, premium packaging, shipping",
        price: 5000,
        deliveryDays: 30,
        revisions: 3,
      },
    ],
  },
];

async function seedServices() {
  const admin = await prisma.user.findFirst({
    where: { userType: "ADMIN" },
  });

  if (!admin) {
    console.log("No admin user found. Skipping services seed.");
    return;
  }

  for (const svc of SERVICES) {
    const existing = await prisma.service.findFirst({
      where: { name: svc.name },
    });

    if (existing) {
      console.log(`Service "${svc.name}" already exists. Skipping.`);
      continue;
    }

    const service = await prisma.service.create({
      data: {
        id: crypto.randomUUID(),
        name: svc.name,
        description: svc.description,
        category: svc.category,
        tags: svc.tags,
        providerId: admin.id,
        active: true,
        featured: Math.random() > 0.5,
      },
    });

    for (const pkg of svc.packages) {
      await prisma.servicePackage.create({
        data: {
          id: crypto.randomUUID(),
          serviceId: service.id,
          name: pkg.name,
          description: pkg.description,
          price: pkg.price,
          deliveryDays: pkg.deliveryDays,
          revisions: pkg.revisions,
        },
      });
    }

    console.log(
      `Service created: ${svc.name} with ${svc.packages.length} packages`,
    );
  }

  // Create a test acquisition for demo purposes
  const testService = await prisma.service.findFirst({
    where: { name: "Social Media Management" },
  });
  const testNgo = await prisma.user.findFirst({
    where: { email: "ngo1@demo.local" },
  });
  const testProject = await prisma.project.findFirst({
    where: { ngoId: testNgo?.id },
  });

  if (testService && testNgo && testProject && admin) {
    const existingAcq = await prisma.serviceAcquisition.findFirst({
      where: { projectId: testProject.id, serviceId: testService.id },
    });

    if (!existingAcq) {
      const standardPkg = await prisma.servicePackage.findFirst({
        where: { serviceId: testService.id, name: "Standard" },
      });

      if (standardPkg) {
        const acquisition = await prisma.serviceAcquisition.create({
          data: {
            id: crypto.randomUUID(),
            projectId: testProject.id,
            serviceId: testService.id,
            packageId: standardPkg.id,
            status: "ACTIVE",
            startDate: new Date(),
          },
        });

        await prisma.chat.create({
          data: {
            id: crypto.randomUUID(),
            serviceAcquisitionId: acquisition.id,
          },
        });

        console.log(
          `Test acquisition created: ${testService.name} for ${testProject.title}`,
        );
      }
    }
  }
}

async function main() {
  await seedAdmin();
  const ngoIds = await seedNgos();
  const companyIds = await seedCompanies();
  await seedProjects(ngoIds);
  await seedDonations([], companyIds);
  await seedServices();

  console.log("\n=== DEMO ACCOUNTS ===");
  console.log("NGOs:");
  for (const ngo of NGOS) {
    console.log(`  ${ngo.email} / ${ngo.password}`);
  }
  console.log("Companies:");
  for (const corp of COMPANIES) {
    console.log(`  ${corp.email} / ${corp.password}`);
  }

  await prisma.$disconnect();
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
