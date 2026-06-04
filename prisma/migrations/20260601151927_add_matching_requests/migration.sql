-- CreateEnum
CREATE TYPE "MatchingRequestStatus" AS ENUM ('PENDING', 'IN_REVIEW', 'MATCHED', 'DECLINED');

-- CreateTable
CREATE TABLE "company_matching_request" (
    "id" TEXT NOT NULL,
    "companyId" TEXT NOT NULL,
    "causeAreas" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "description" TEXT,
    "budgetRange" TEXT,
    "location" TEXT,
    "timeline" TEXT,
    "status" "MatchingRequestStatus" NOT NULL DEFAULT 'PENDING',
    "adminNotes" TEXT,
    "recommendedProjectIds" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "company_matching_request_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "company_matching_request_companyId_idx" ON "company_matching_request"("companyId");

-- CreateIndex
CREATE INDEX "company_matching_request_status_idx" ON "company_matching_request"("status");

-- AddForeignKey
ALTER TABLE "company_matching_request" ADD CONSTRAINT "company_matching_request_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "user"("id") ON DELETE CASCADE ON UPDATE CASCADE;
