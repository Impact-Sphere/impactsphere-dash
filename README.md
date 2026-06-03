# ImpactSphere

ImpactSphere is a Next.js web platform that connects NGOs with companies for funding and partnerships. NGOs can publish impact projects and seek donations, while companies can browse initiatives, filter by category, and sponsor projects aligned with their CSR goals. An admin dashboard handles account and project approvals.

**Live Site:** [https://dash.impactsphere.org](https://dash.impactsphere.org)

## Tech Stack

- **Framework**: [Next.js 16](https://nextjs.org) (App Router)
- **Language**: TypeScript
- **Styling**: Tailwind CSS v4
- **Database**: PostgreSQL + [Prisma ORM](https://prisma.io)
- **Authentication**: [Better Auth](https://better-auth.com) (email & password)
- **Linting / Formatting**: [Biome](https://biomejs.dev)

## Features

- **User Roles**
  - **NGO** — create and manage impact projects, receive donations
  - **Company** — browse projects, donate to initiatives, view sponsored projects
  - **Admin** — review and approve/reject pending accounts and projects

- **Account Approval Workflow**
  - New NGO/Company accounts go through an admin approval process
  - Users can track their account status: Pending, Approved, or Rejected
  - Pending/Rejected users are shown a status page with relevant actions

- **Project Management**
  - NGOs create projects with title, description, category, image, and target budget
  - Projects require admin approval before appearing publicly
  - Projects show funding progress (current amount / target budget)

- **Discovery & Search**
  - Browse all approved projects
  - Filter by category: Environment, Education, Healthcare, Tech Equity, Disaster Relief
  - View project details and NGO profiles

- **Donations**
  - Companies can donate to approved NGO projects
  - Donation tracking visible on project pages

- **Profiles**
  - Public profile pages for NGOs and Companies
  - Private profile dashboard with editable organization details
  - Project status badges (Pending / Rejected) visible on "My Projects"

## Project Structure

```
├── app/
│   ├── api/                  # API routes (Next.js Route Handlers)
│   │   ├── admin/            # Admin endpoints (users, projects approval)
│   │   ├── auth/             # Better Auth handler
│   │   ├── onboarding/       # Account type selection & org details
│   │   ├── profile/          # Profile CRUD
│   │   ├── projects/         # Projects CRUD + donations
│   │   └── upload/           # Image upload endpoint
│   ├── components/           # Reusable UI components
│   ├── discover/             # Project discovery page
│   ├── onboarding/           # New user onboarding flow
│   ├── pending-approval/     # Account status page (Pending/Approved/Rejected)
│   ├── profile/              # Profile page + public profile view
│   ├── projects/             # Project detail + new project form
│   ├── admin/                # Admin dashboard
│   ├── lib/                  # Utilities, auth, DB client
│   └── types/                # TypeScript types
├── prisma/
│   ├── schema.prisma         # Database schema
│   └── seed.ts               # Demo data seed script
└── next.config.ts            # Next.js configuration
```

## Getting Started

### Prerequisites

- Node.js 20+
- PostgreSQL database running locally or via Docker

### 1. Install dependencies

```bash
npm install
```

### 2. Configure environment variables

Copy `.env.example` to `.env` and fill in your values:

```bash
cp .env.example .env
```

| Variable | Description |
|----------|-------------|
| `DATABASE_URL` | PostgreSQL connection string |
| `BETTER_AUTH_SECRET` | 32+ character random string for auth token signing |
| `BETTER_AUTH_URL` | Base URL of the app (e.g. `http://localhost:3000`) |
| `NEXT_PUBLIC_BETTER_AUTH_URL` | Same as above, exposed to the browser |

Optional seed variables:
- `ADMIN_EMAIL` — defaults to `admin@impactsphere.local`
- `ADMIN_PASSWORD` — defaults to `adminpassword123`
- `ADMIN_NAME` — defaults to `Admin User`

### 3. Set up the database

```bash
# Push the Prisma schema to your database
npx prisma db push

# Generate the Prisma Client
npx prisma generate
```

### 4. Seed demo data

```bash
npm run db:seed
```

This creates demo accounts and projects (see [Demo Accounts](#demo-accounts)).

### 5. Run the dev server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

## Available Scripts

| Script | Description |
|--------|-------------|
| `npm run dev` | Start the development server |
| `npm run build` | Build for production |
| `npm run start` | Start the production server |
| `npm run lint` | Run Biome linter |
| `npm run format` | Auto-fix linting and formatting issues |
| `npm run format:check` | Check formatting without fixing |
| `npm run db:seed` | Seed the database with demo data |

## Demo Accounts

After running `npm run db:seed`, the following accounts are available:

### Admin
| Email | Password |
|-------|----------|
| `admin@impactsphere.local` | `adminpassword123` |

### NGOs
| Email | Password |
|-------|----------|
| `ngo1@demo.local` | `demongopass` |
| `ngo2@demo.local` | `demongopass` |
| `ngo3@demo.local` | `demongopass` |

### Companies
| Email | Password |
|-------|----------|
| `company1@demo.local` | `democompanypass` |
| `company2@demo.local` | `democompanypass` |

## Database Schema Overview

Key models:

- **User** — base user with `userType` (NGO / COMPANY / ADMIN) and `approvalStatus` (PENDING / APPROVED / REJECTED)
- **NgoInfo** — extended profile for NGOs (name, tax ID, goals, challenges)
- **CompanyInfo** — extended profile for companies (name, tax ID, causes supported)
- **Project** — NGO projects with funding targets, categories, and approval status
- **Donation** — company donations linked to projects

See `prisma/schema.prisma` for the full schema.

## User Flows

### NGO / Company Registration

1. Register with email and password
2. Complete onboarding (select NGO or Company, fill organization details)
3. Account status is set to **Pending**
4. User is redirected to the **Pending Approval** status page
5. Admin reviews and approves/rejects the account
6. Approved users gain full platform access; rejected users see the rejection status and can browse projects read-only

### Project Creation (NGO)

1. Approved NGO navigates to "Create Project"
2. Fills project details (title, description, category, image, target budget)
3. Project is created with **Pending** approval status
4. Admin reviews and approves/rejects the project
5. Approved projects appear in discovery; rejected projects show a "Rejected" badge in the NGO's "My Projects"

### Company Donation

1. Approved Company browses projects on the discovery page
2. Opens a project detail page
3. Clicks "Donate" and enters an amount
4. Donation is recorded and project funding progress updates

## License

This project is private and not open source.
