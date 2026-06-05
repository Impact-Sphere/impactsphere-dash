-- CreateTable
CREATE TABLE "verification_meeting_time_slot" (
    "id" TEXT NOT NULL,
    "meetingId" TEXT NOT NULL,
    "start" TIMESTAMP(3) NOT NULL,
    "end" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "verification_meeting_time_slot_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "verification_meeting_request" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "adminId" TEXT NOT NULL,
    "status" "MeetingRequestStatus" NOT NULL DEFAULT 'PENDING',
    "selectedTime" TIMESTAMP(3),
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "verification_meeting_request_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "verification_meeting_time_slot_meetingId_idx" ON "verification_meeting_time_slot"("meetingId");

-- CreateIndex
CREATE INDEX "verification_meeting_request_userId_idx" ON "verification_meeting_request"("userId");

-- CreateIndex
CREATE INDEX "verification_meeting_request_adminId_idx" ON "verification_meeting_request"("adminId");

-- CreateIndex
CREATE INDEX "verification_meeting_request_status_idx" ON "verification_meeting_request"("status");

-- AddForeignKey
ALTER TABLE "verification_meeting_time_slot" ADD CONSTRAINT "verification_meeting_time_slot_meetingId_fkey" FOREIGN KEY ("meetingId") REFERENCES "verification_meeting_request"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "verification_meeting_request" ADD CONSTRAINT "verification_meeting_request_userId_fkey" FOREIGN KEY ("userId") REFERENCES "user"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "verification_meeting_request" ADD CONSTRAINT "verification_meeting_request_adminId_fkey" FOREIGN KEY ("adminId") REFERENCES "user"("id") ON DELETE CASCADE ON UPDATE CASCADE;
