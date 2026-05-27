-- Fix service table drift
ALTER TABLE "service" 
ADD COLUMN IF NOT EXISTS "tags" TEXT[] DEFAULT ARRAY[]::TEXT[],
ADD COLUMN IF NOT EXISTS "portfolioImages" TEXT[] DEFAULT ARRAY[]::TEXT[],
ADD COLUMN IF NOT EXISTS "featured" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN IF NOT EXISTS "rating" DOUBLE PRECISION NOT NULL DEFAULT 0,
ADD COLUMN IF NOT EXISTS "reviewCount" INTEGER NOT NULL DEFAULT 0;

-- Drop old incompatible columns from service
ALTER TABLE "service" DROP COLUMN IF EXISTS "price";
ALTER TABLE "service" DROP COLUMN IF EXISTS "durationType";
ALTER TABLE "service" DROP COLUMN IF EXISTS "durationMonths";

-- Create service_package if missing
CREATE TABLE IF NOT EXISTS "service_package" (
    "id" TEXT NOT NULL,
    "serviceId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "price" INTEGER NOT NULL,
    "deliveryDays" INTEGER NOT NULL,
    "revisions" INTEGER NOT NULL DEFAULT 1,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "service_package_pkey" PRIMARY KEY ("id")
);

CREATE INDEX IF NOT EXISTS "service_package_serviceId_idx" ON "service_package"("serviceId");
ALTER TABLE "service_package" DROP CONSTRAINT IF EXISTS "service_package_serviceId_fkey";
ALTER TABLE "service_package" ADD CONSTRAINT "service_package_serviceId_fkey" FOREIGN KEY ("serviceId") REFERENCES "service"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- Fix service_acquisition drift
ALTER TABLE "service_acquisition" 
ADD COLUMN IF NOT EXISTS "packageId" TEXT,
ADD COLUMN IF NOT EXISTS "deliveredAt" TIMESTAMP(3),
ADD COLUMN IF NOT EXISTS "completedAt" TIMESTAMP(3),
ADD COLUMN IF NOT EXISTS "revisionsUsed" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN IF NOT EXISTS "deliveryMessage" TEXT;

-- Drop old incompatible columns
ALTER TABLE "service_acquisition" DROP COLUMN IF EXISTS "totalCost";

-- Update status enum to match current schema (safer to use text if enum mismatch)
-- Create service_review if missing
CREATE TABLE IF NOT EXISTS "service_review" (
    "id" TEXT NOT NULL,
    "serviceId" TEXT NOT NULL,
    "acquisitionId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "rating" INTEGER NOT NULL,
    "comment" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "service_review_pkey" PRIMARY KEY ("id"),
    CONSTRAINT "service_review_acquisitionId_key" UNIQUE ("acquisitionId")
);

CREATE INDEX IF NOT EXISTS "service_review_serviceId_idx" ON "service_review"("serviceId");
CREATE INDEX IF NOT EXISTS "service_review_userId_idx" ON "service_review"("userId");
ALTER TABLE "service_review" DROP CONSTRAINT IF EXISTS "service_review_serviceId_fkey";
ALTER TABLE "service_review" DROP CONSTRAINT IF EXISTS "service_review_acquisitionId_fkey";
ALTER TABLE "service_review" ADD CONSTRAINT "service_review_serviceId_fkey" FOREIGN KEY ("serviceId") REFERENCES "service"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "service_review" ADD CONSTRAINT "service_review_acquisitionId_fkey" FOREIGN KEY ("acquisitionId") REFERENCES "service_acquisition"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- Fix chat relation name drift
ALTER TABLE "chat" DROP CONSTRAINT IF EXISTS "chat_serviceAcquisitionId_fkey";
ALTER TABLE "chat" ADD CONSTRAINT "chat_serviceAcquisitionId_fkey" FOREIGN KEY ("serviceAcquisitionId") REFERENCES "service_acquisition"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- Fix ServiceAcquisitionStatus enum to match schema
-- Rename old enum column to text, drop old enum, create new enum, convert back
ALTER TABLE "service_acquisition" ALTER COLUMN "status" TYPE TEXT;
DROP TYPE IF EXISTS "ServiceAcquisitionStatus" CASCADE;
CREATE TYPE "ServiceAcquisitionStatus" AS ENUM ('ACTIVE', 'DELIVERED', 'REVISION_REQUESTED', 'COMPLETED', 'CANCELLED');
ALTER TABLE "service_acquisition" ALTER COLUMN "status" TYPE "ServiceAcquisitionStatus" USING "status"::"ServiceAcquisitionStatus";

-- Drop old unused ServiceDurationType enum
DROP TYPE IF EXISTS "ServiceDurationType" CASCADE;

-- Fix service_acquisition status default
ALTER TABLE "service_acquisition" ALTER COLUMN "status" SET DEFAULT 'ACTIVE';
