/*
  Warnings:

  - A unique constraint covering the columns `[stripePaymentIntentId]` on the table `donation` will be added. If there are existing duplicate values, this will fail.

*/
-- CreateEnum (idempotent)
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'DonationStatus') THEN
        CREATE TYPE "DonationStatus" AS ENUM ('PENDING', 'SUCCEEDED', 'FAILED');
    END IF;
END
$$;

-- AlterTable
ALTER TABLE "company_info"
ADD COLUMN IF NOT EXISTS "businessDescription" TEXT,
ADD COLUMN IF NOT EXISTS "contactEmail" TEXT,
ADD COLUMN IF NOT EXISTS "country" TEXT,
ADD COLUMN IF NOT EXISTS "declarationConfirmed" BOOLEAN,
ADD COLUMN IF NOT EXISTS "industryType" TEXT,
ADD COLUMN IF NOT EXISTS "phoneNumber" TEXT,
ADD COLUMN IF NOT EXISTS "registeredAddress" TEXT,
ADD COLUMN IF NOT EXISTS "registrationNumber" TEXT,
ADD COLUMN IF NOT EXISTS "representativeFullName" TEXT,
ADD COLUMN IF NOT EXISTS "representativeIdDocumentUrl" TEXT,
ADD COLUMN IF NOT EXISTS "representativeIdNumber" TEXT,
ADD COLUMN IF NOT EXISTS "representativeIdType" TEXT,
ADD COLUMN IF NOT EXISTS "representativeJobTitle" TEXT,
ADD COLUMN IF NOT EXISTS "taxVatNumber" TEXT,
ADD COLUMN IF NOT EXISTS "website" TEXT,
ADD COLUMN IF NOT EXISTS "yearFounded" INTEGER,
ALTER COLUMN "taxIdentificationNumber" DROP NOT NULL,
ALTER COLUMN "contactInfo" DROP NOT NULL,
ALTER COLUMN "causesSupported" DROP NOT NULL;

-- AlterTable
ALTER TABLE "donation"
ADD COLUMN IF NOT EXISTS "status" "DonationStatus" NOT NULL DEFAULT 'PENDING',
ADD COLUMN IF NOT EXISTS "stripePaymentIntentId" TEXT,
ADD COLUMN IF NOT EXISTS "updatedAt" TIMESTAMP(3);

-- AlterTable
ALTER TABLE "ngo_info"
ADD COLUMN IF NOT EXISTS "activitiesDescription" TEXT,
ADD COLUMN IF NOT EXISTS "activityProofLink" TEXT,
ADD COLUMN IF NOT EXISTS "cityRegion" TEXT,
ADD COLUMN IF NOT EXISTS "contactEmail" TEXT,
ADD COLUMN IF NOT EXISTS "country" TEXT,
ADD COLUMN IF NOT EXISTS "currentOrPastProjects" TEXT,
ADD COLUMN IF NOT EXISTS "declarationConfirmed" BOOLEAN,
ADD COLUMN IF NOT EXISTS "missionStatement" TEXT,
ADD COLUMN IF NOT EXISTS "ngoType" TEXT,
ADD COLUMN IF NOT EXISTS "phoneNumber" TEXT,
ADD COLUMN IF NOT EXISTS "registrationNumber" TEXT,
ADD COLUMN IF NOT EXISTS "representativeFullName" TEXT,
ADD COLUMN IF NOT EXISTS "representativeIdDocumentUrl" TEXT,
ADD COLUMN IF NOT EXISTS "representativeIdNumber" TEXT,
ADD COLUMN IF NOT EXISTS "representativeIdType" TEXT,
ADD COLUMN IF NOT EXISTS "representativeRole" TEXT,
ADD COLUMN IF NOT EXISTS "website" TEXT,
ADD COLUMN IF NOT EXISTS "yearFounded" INTEGER,
ALTER COLUMN "taxIdentificationNumber" DROP NOT NULL,
ALTER COLUMN "contactInfo" DROP NOT NULL,
ALTER COLUMN "mainGoals" DROP NOT NULL,
ALTER COLUMN "challenges" DROP NOT NULL;

-- CreateTable
CREATE TABLE IF NOT EXISTS "uploaded_file" (
    "id" TEXT NOT NULL,
    "url" TEXT NOT NULL,
    "fileName" TEXT NOT NULL,
    "mimeType" TEXT,
    "size" INTEGER,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "uploaded_file_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE IF NOT EXISTS "_NgoRegistrationDocs" (
    "A" TEXT NOT NULL,
    "B" TEXT NOT NULL,

    CONSTRAINT "_NgoRegistrationDocs_AB_pkey" PRIMARY KEY ("A","B")
);

-- CreateTable
CREATE TABLE IF NOT EXISTS "_NgoActivityProofs" (
    "A" TEXT NOT NULL,
    "B" TEXT NOT NULL,

    CONSTRAINT "_NgoActivityProofs_AB_pkey" PRIMARY KEY ("A","B")
);

-- CreateTable
CREATE TABLE IF NOT EXISTS "_CompanyRegistrationDocs" (
    "A" TEXT NOT NULL,
    "B" TEXT NOT NULL,

    CONSTRAINT "_CompanyRegistrationDocs_AB_pkey" PRIMARY KEY ("A","B")
);

-- CreateTable
CREATE TABLE IF NOT EXISTS "_ProjectDocuments" (
    "A" TEXT NOT NULL,
    "B" TEXT NOT NULL,

    CONSTRAINT "_ProjectDocuments_AB_pkey" PRIMARY KEY ("A","B")
);

-- CreateIndex
CREATE INDEX IF NOT EXISTS "_NgoRegistrationDocs_B_index" ON "_NgoRegistrationDocs"("B");

-- CreateIndex
CREATE INDEX IF NOT EXISTS "_NgoActivityProofs_B_index" ON "_NgoActivityProofs"("B");

-- CreateIndex
CREATE INDEX IF NOT EXISTS "_CompanyRegistrationDocs_B_index" ON "_CompanyRegistrationDocs"("B");

-- CreateIndex
CREATE INDEX IF NOT EXISTS "_ProjectDocuments_B_index" ON "_ProjectDocuments"("B");

-- CreateIndex
CREATE UNIQUE INDEX IF NOT EXISTS "donation_stripePaymentIntentId_key" ON "donation"("stripePaymentIntentId");

-- AddForeignKey (idempotent)
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = '_NgoRegistrationDocs') THEN
        IF NOT EXISTS (SELECT 1 FROM information_schema.table_constraints WHERE constraint_name = '_NgoRegistrationDocs_A_fkey' AND table_name = '_NgoRegistrationDocs') THEN
            ALTER TABLE "_NgoRegistrationDocs" ADD CONSTRAINT "_NgoRegistrationDocs_A_fkey" FOREIGN KEY ("A") REFERENCES "ngo_info"("id") ON DELETE CASCADE ON UPDATE CASCADE;
        END IF;
        IF NOT EXISTS (SELECT 1 FROM information_schema.table_constraints WHERE constraint_name = '_NgoRegistrationDocs_B_fkey' AND table_name = '_NgoRegistrationDocs') THEN
            ALTER TABLE "_NgoRegistrationDocs" ADD CONSTRAINT "_NgoRegistrationDocs_B_fkey" FOREIGN KEY ("B") REFERENCES "uploaded_file"("id") ON DELETE CASCADE ON UPDATE CASCADE;
        END IF;
    END IF;
END
$$;

DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = '_NgoActivityProofs') THEN
        IF NOT EXISTS (SELECT 1 FROM information_schema.table_constraints WHERE constraint_name = '_NgoActivityProofs_A_fkey' AND table_name = '_NgoActivityProofs') THEN
            ALTER TABLE "_NgoActivityProofs" ADD CONSTRAINT "_NgoActivityProofs_A_fkey" FOREIGN KEY ("A") REFERENCES "ngo_info"("id") ON DELETE CASCADE ON UPDATE CASCADE;
        END IF;
        IF NOT EXISTS (SELECT 1 FROM information_schema.table_constraints WHERE constraint_name = '_NgoActivityProofs_B_fkey' AND table_name = '_NgoActivityProofs') THEN
            ALTER TABLE "_NgoActivityProofs" ADD CONSTRAINT "_NgoActivityProofs_B_fkey" FOREIGN KEY ("B") REFERENCES "uploaded_file"("id") ON DELETE CASCADE ON UPDATE CASCADE;
        END IF;
    END IF;
END
$$;

DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = '_CompanyRegistrationDocs') THEN
        IF NOT EXISTS (SELECT 1 FROM information_schema.table_constraints WHERE constraint_name = '_CompanyRegistrationDocs_A_fkey' AND table_name = '_CompanyRegistrationDocs') THEN
            ALTER TABLE "_CompanyRegistrationDocs" ADD CONSTRAINT "_CompanyRegistrationDocs_A_fkey" FOREIGN KEY ("A") REFERENCES "company_info"("id") ON DELETE CASCADE ON UPDATE CASCADE;
        END IF;
        IF NOT EXISTS (SELECT 1 FROM information_schema.table_constraints WHERE constraint_name = '_CompanyRegistrationDocs_B_fkey' AND table_name = '_CompanyRegistrationDocs') THEN
            ALTER TABLE "_CompanyRegistrationDocs" ADD CONSTRAINT "_CompanyRegistrationDocs_B_fkey" FOREIGN KEY ("B") REFERENCES "uploaded_file"("id") ON DELETE CASCADE ON UPDATE CASCADE;
        END IF;
    END IF;
END
$$;

DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = '_ProjectDocuments') THEN
        IF NOT EXISTS (SELECT 1 FROM information_schema.table_constraints WHERE constraint_name = '_ProjectDocuments_A_fkey' AND table_name = '_ProjectDocuments') THEN
            ALTER TABLE "_ProjectDocuments" ADD CONSTRAINT "_ProjectDocuments_A_fkey" FOREIGN KEY ("A") REFERENCES "project"("id") ON DELETE CASCADE ON UPDATE CASCADE;
        END IF;
        IF NOT EXISTS (SELECT 1 FROM information_schema.table_constraints WHERE constraint_name = '_ProjectDocuments_B_fkey' AND table_name = '_ProjectDocuments') THEN
            ALTER TABLE "_ProjectDocuments" ADD CONSTRAINT "_ProjectDocuments_B_fkey" FOREIGN KEY ("B") REFERENCES "uploaded_file"("id") ON DELETE CASCADE ON UPDATE CASCADE;
        END IF;
    END IF;
END
$$;
