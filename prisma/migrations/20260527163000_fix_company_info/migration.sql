-- Add missing columns to company_info
ALTER TABLE "company_info" 
ADD COLUMN IF NOT EXISTS "representativeName" TEXT,
ADD COLUMN IF NOT EXISTS "representativePosition" TEXT;

-- Add missing columns to project (if not already there)
ALTER TABLE "project" 
ADD COLUMN IF NOT EXISTS "serviceSpent" INTEGER NOT NULL DEFAULT 0;
