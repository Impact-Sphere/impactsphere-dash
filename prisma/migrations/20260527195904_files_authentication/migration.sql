/*
  Warnings:

  - A unique constraint covering the columns `[stripePaymentIntentId]` on the table `donation` will be added. If there are existing duplicate values, this will fail.

*/
-- CreateEnum
CREATE TYPE "DonationStatus" AS ENUM ('PENDING', 'SUCCEEDED', 'FAILED');

-- AlterTable
ALTER TABLE "company_info" ADD COLUMN     "businessDescription" TEXT,
ADD COLUMN     "contactEmail" TEXT,
ADD COLUMN     "country" TEXT,
ADD COLUMN     "declarationConfirmed" BOOLEAN,
ADD COLUMN     "industryType" TEXT,
ADD COLUMN     "phoneNumber" TEXT,
ADD COLUMN     "registeredAddress" TEXT,
ADD COLUMN     "registrationNumber" TEXT,
ADD COLUMN     "representativeFullName" TEXT,
ADD COLUMN     "representativeIdDocumentUrl" TEXT,
ADD COLUMN     "representativeIdNumber" TEXT,
ADD COLUMN     "representativeIdType" TEXT,
ADD COLUMN     "representativeJobTitle" TEXT,
ADD COLUMN     "taxVatNumber" TEXT,
ADD COLUMN     "website" TEXT,
ADD COLUMN     "yearFounded" INTEGER,
ALTER COLUMN "taxIdentificationNumber" DROP NOT NULL,
ALTER COLUMN "contactInfo" DROP NOT NULL,
ALTER COLUMN "causesSupported" DROP NOT NULL;

-- AlterTable
ALTER TABLE "donation" ADD COLUMN     "status" "DonationStatus" NOT NULL DEFAULT 'PENDING',
ADD COLUMN     "stripePaymentIntentId" TEXT,
ADD COLUMN     "updatedAt" TIMESTAMP(3);

-- AlterTable
ALTER TABLE "ngo_info" ADD COLUMN     "activitiesDescription" TEXT,
ADD COLUMN     "activityProofLink" TEXT,
ADD COLUMN     "cityRegion" TEXT,
ADD COLUMN     "contactEmail" TEXT,
ADD COLUMN     "country" TEXT,
ADD COLUMN     "currentOrPastProjects" TEXT,
ADD COLUMN     "declarationConfirmed" BOOLEAN,
ADD COLUMN     "missionStatement" TEXT,
ADD COLUMN     "ngoType" TEXT,
ADD COLUMN     "phoneNumber" TEXT,
ADD COLUMN     "registrationNumber" TEXT,
ADD COLUMN     "representativeFullName" TEXT,
ADD COLUMN     "representativeIdDocumentUrl" TEXT,
ADD COLUMN     "representativeIdNumber" TEXT,
ADD COLUMN     "representativeIdType" TEXT,
ADD COLUMN     "representativeRole" TEXT,
ADD COLUMN     "website" TEXT,
ADD COLUMN     "yearFounded" INTEGER,
ALTER COLUMN "taxIdentificationNumber" DROP NOT NULL,
ALTER COLUMN "contactInfo" DROP NOT NULL,
ALTER COLUMN "mainGoals" DROP NOT NULL,
ALTER COLUMN "challenges" DROP NOT NULL;

-- CreateTable
CREATE TABLE "uploaded_file" (
    "id" TEXT NOT NULL,
    "url" TEXT NOT NULL,
    "fileName" TEXT NOT NULL,
    "mimeType" TEXT,
    "size" INTEGER,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "uploaded_file_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "_NgoRegistrationDocs" (
    "A" TEXT NOT NULL,
    "B" TEXT NOT NULL,

    CONSTRAINT "_NgoRegistrationDocs_AB_pkey" PRIMARY KEY ("A","B")
);

-- CreateTable
CREATE TABLE "_NgoActivityProofs" (
    "A" TEXT NOT NULL,
    "B" TEXT NOT NULL,

    CONSTRAINT "_NgoActivityProofs_AB_pkey" PRIMARY KEY ("A","B")
);

-- CreateTable
CREATE TABLE "_CompanyRegistrationDocs" (
    "A" TEXT NOT NULL,
    "B" TEXT NOT NULL,

    CONSTRAINT "_CompanyRegistrationDocs_AB_pkey" PRIMARY KEY ("A","B")
);

-- CreateTable
CREATE TABLE "_ProjectDocuments" (
    "A" TEXT NOT NULL,
    "B" TEXT NOT NULL,

    CONSTRAINT "_ProjectDocuments_AB_pkey" PRIMARY KEY ("A","B")
);

-- CreateIndex
CREATE INDEX "_NgoRegistrationDocs_B_index" ON "_NgoRegistrationDocs"("B");

-- CreateIndex
CREATE INDEX "_NgoActivityProofs_B_index" ON "_NgoActivityProofs"("B");

-- CreateIndex
CREATE INDEX "_CompanyRegistrationDocs_B_index" ON "_CompanyRegistrationDocs"("B");

-- CreateIndex
CREATE INDEX "_ProjectDocuments_B_index" ON "_ProjectDocuments"("B");

-- CreateIndex
CREATE UNIQUE INDEX "donation_stripePaymentIntentId_key" ON "donation"("stripePaymentIntentId");

-- AddForeignKey
ALTER TABLE "_NgoRegistrationDocs" ADD CONSTRAINT "_NgoRegistrationDocs_A_fkey" FOREIGN KEY ("A") REFERENCES "ngo_info"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_NgoRegistrationDocs" ADD CONSTRAINT "_NgoRegistrationDocs_B_fkey" FOREIGN KEY ("B") REFERENCES "uploaded_file"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_NgoActivityProofs" ADD CONSTRAINT "_NgoActivityProofs_A_fkey" FOREIGN KEY ("A") REFERENCES "ngo_info"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_NgoActivityProofs" ADD CONSTRAINT "_NgoActivityProofs_B_fkey" FOREIGN KEY ("B") REFERENCES "uploaded_file"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_CompanyRegistrationDocs" ADD CONSTRAINT "_CompanyRegistrationDocs_A_fkey" FOREIGN KEY ("A") REFERENCES "company_info"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_CompanyRegistrationDocs" ADD CONSTRAINT "_CompanyRegistrationDocs_B_fkey" FOREIGN KEY ("B") REFERENCES "uploaded_file"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_ProjectDocuments" ADD CONSTRAINT "_ProjectDocuments_A_fkey" FOREIGN KEY ("A") REFERENCES "project"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_ProjectDocuments" ADD CONSTRAINT "_ProjectDocuments_B_fkey" FOREIGN KEY ("B") REFERENCES "uploaded_file"("id") ON DELETE CASCADE ON UPDATE CASCADE;
