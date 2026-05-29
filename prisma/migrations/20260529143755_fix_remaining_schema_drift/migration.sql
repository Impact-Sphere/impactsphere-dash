/*
  Warnings:

  - The `verificationTier` column on the `ngo_info` table would be dropped and recreated. This will lead to data loss if there is data in the column.
  - Made the column `startDate` on table `service_acquisition` required. This step will fail if there are existing NULL values in that column.
  - Made the column `packageId` on table `service_acquisition` required. This step will fail if there are existing NULL values in that column.

*/
-- AlterTable
ALTER TABLE "ngo_info" DROP COLUMN "verificationTier",
ADD COLUMN     "verificationTier" "VerificationTier" NOT NULL DEFAULT 'PENDING_DOCUMENTS';

-- AlterTable
ALTER TABLE "service_acquisition" ALTER COLUMN "startDate" SET NOT NULL,
ALTER COLUMN "startDate" SET DEFAULT CURRENT_TIMESTAMP,
ALTER COLUMN "packageId" SET NOT NULL;

-- CreateIndex
CREATE INDEX "service_featured_idx" ON "service"("featured");

-- AddForeignKey
ALTER TABLE "service_acquisition" ADD CONSTRAINT "service_acquisition_packageId_fkey" FOREIGN KEY ("packageId") REFERENCES "service_package"("id") ON DELETE CASCADE ON UPDATE CASCADE;
