-- CreateEnum
CREATE TYPE "ApprovalStatus" AS ENUM ('PENDING', 'APPROVED', 'REJECTED');

-- Add approvalStatus to user with default APPROVED for existing rows
ALTER TABLE "user" ADD COLUMN "approvalStatus" "ApprovalStatus" NOT NULL DEFAULT 'APPROVED';

-- Add approvalStatus to project with default APPROVED for existing rows
ALTER TABLE "project" ADD COLUMN "approvalStatus" "ApprovalStatus" NOT NULL DEFAULT 'APPROVED';
