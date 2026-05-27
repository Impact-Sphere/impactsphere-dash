/*
  Warnings:

  - A unique constraint covering the columns `[stripePaymentIntentId]` on the table `donation` will be added. If there are existing duplicate values, this will fail.

*/
-- CreateEnum
CREATE TYPE "DonationStatus" AS ENUM ('PENDING', 'SUCCEEDED', 'FAILED');

-- CreateEnum
CREATE TYPE "MeetingStatus" AS ENUM ('NOT_REQUESTED', 'PENDING', 'COMPLETED');

-- CreateEnum
CREATE TYPE "ServiceDurationType" AS ENUM ('ONE_OFF', 'RECURRING');

-- CreateEnum
CREATE TYPE "ServiceAcquisitionStatus" AS ENUM ('PENDING', 'ACTIVE', 'COMPLETED', 'CANCELLED');

-- AlterTable
ALTER TABLE "donation" ADD COLUMN     "status" "DonationStatus" NOT NULL DEFAULT 'PENDING',
ADD COLUMN     "stripePaymentIntentId" TEXT,
ADD COLUMN     "updatedAt" TIMESTAMP(3);

-- AlterTable
ALTER TABLE "user" ADD COLUMN     "adminNotes" TEXT,
ADD COLUMN     "meetingStatus" "MeetingStatus" NOT NULL DEFAULT 'NOT_REQUESTED';

-- CreateTable
CREATE TABLE "service" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "category" TEXT NOT NULL,
    "price" INTEGER NOT NULL,
    "durationType" "ServiceDurationType" NOT NULL,
    "durationMonths" INTEGER,
    "image" TEXT,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "providerId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "service_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "service_acquisition" (
    "id" TEXT NOT NULL,
    "projectId" TEXT NOT NULL,
    "serviceId" TEXT NOT NULL,
    "status" "ServiceAcquisitionStatus" NOT NULL DEFAULT 'PENDING',
    "startDate" TIMESTAMP(3),
    "endDate" TIMESTAMP(3),
    "totalCost" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "service_acquisition_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "chat" (
    "id" TEXT NOT NULL,
    "serviceAcquisitionId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "chat_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "message" (
    "id" TEXT NOT NULL,
    "chatId" TEXT NOT NULL,
    "senderId" TEXT NOT NULL,
    "content" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "message_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "service_category_idx" ON "service"("category");

-- CreateIndex
CREATE INDEX "service_providerId_idx" ON "service"("providerId");

-- CreateIndex
CREATE INDEX "service_active_idx" ON "service"("active");

-- CreateIndex
CREATE INDEX "service_acquisition_projectId_idx" ON "service_acquisition"("projectId");

-- CreateIndex
CREATE INDEX "service_acquisition_serviceId_idx" ON "service_acquisition"("serviceId");

-- CreateIndex
CREATE INDEX "service_acquisition_status_idx" ON "service_acquisition"("status");

-- CreateIndex
CREATE UNIQUE INDEX "chat_serviceAcquisitionId_key" ON "chat"("serviceAcquisitionId");

-- CreateIndex
CREATE INDEX "message_chatId_idx" ON "message"("chatId");

-- CreateIndex
CREATE INDEX "message_senderId_idx" ON "message"("senderId");

-- CreateIndex
CREATE UNIQUE INDEX "donation_stripePaymentIntentId_key" ON "donation"("stripePaymentIntentId");

-- AddForeignKey
ALTER TABLE "service" ADD CONSTRAINT "service_providerId_fkey" FOREIGN KEY ("providerId") REFERENCES "user"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "service_acquisition" ADD CONSTRAINT "service_acquisition_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "project"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "service_acquisition" ADD CONSTRAINT "service_acquisition_serviceId_fkey" FOREIGN KEY ("serviceId") REFERENCES "service"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "chat" ADD CONSTRAINT "chat_serviceAcquisitionId_fkey" FOREIGN KEY ("serviceAcquisitionId") REFERENCES "service_acquisition"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "message" ADD CONSTRAINT "message_chatId_fkey" FOREIGN KEY ("chatId") REFERENCES "chat"("id") ON DELETE CASCADE ON UPDATE CASCADE;
