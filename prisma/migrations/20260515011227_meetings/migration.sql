-- CreateEnum
CREATE TYPE "MeetingRequestStatus" AS ENUM ('PENDING', 'APPROVED', 'REJECTED', 'SCHEDULED');

-- AlterTable
ALTER TABLE "project" ALTER COLUMN "approvalStatus" SET DEFAULT 'PENDING';

-- AlterTable
ALTER TABLE "user" ALTER COLUMN "approvalStatus" SET DEFAULT 'PENDING';

-- CreateTable
CREATE TABLE "meeting_time_slot" (
    "id" TEXT NOT NULL,
    "meetingId" TEXT NOT NULL,
    "start" TIMESTAMP(3) NOT NULL,
    "end" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "meeting_time_slot_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "meeting_request" (
    "id" TEXT NOT NULL,
    "projectId" TEXT NOT NULL,
    "companyId" TEXT NOT NULL,
    "requestedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "status" "MeetingRequestStatus" NOT NULL DEFAULT 'PENDING',
    "selectedTime" TIMESTAMP(3),
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "meeting_request_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "meeting_time_slot_meetingId_idx" ON "meeting_time_slot"("meetingId");

-- CreateIndex
CREATE INDEX "meeting_request_companyId_idx" ON "meeting_request"("companyId");

-- CreateIndex
CREATE INDEX "meeting_request_projectId_idx" ON "meeting_request"("projectId");

-- CreateIndex
CREATE INDEX "meeting_request_status_idx" ON "meeting_request"("status");

-- AddForeignKey
ALTER TABLE "meeting_time_slot" ADD CONSTRAINT "meeting_time_slot_meetingId_fkey" FOREIGN KEY ("meetingId") REFERENCES "meeting_request"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "meeting_request" ADD CONSTRAINT "meeting_request_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "project"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "meeting_request" ADD CONSTRAINT "meeting_request_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "user"("id") ON DELETE CASCADE ON UPDATE CASCADE;
