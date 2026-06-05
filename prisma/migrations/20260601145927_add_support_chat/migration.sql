-- CreateEnum
CREATE TYPE "SupportChatStatus" AS ENUM ('OPEN', 'CLOSED');

-- CreateTable
CREATE TABLE "support_chat" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "status" "SupportChatStatus" NOT NULL DEFAULT 'OPEN',
    "subject" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "support_chat_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "support_message" (
    "id" TEXT NOT NULL,
    "chatId" TEXT NOT NULL,
    "senderId" TEXT NOT NULL,
    "content" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "support_message_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "support_chat_userId_idx" ON "support_chat"("userId");

-- CreateIndex
CREATE INDEX "support_chat_status_idx" ON "support_chat"("status");

-- CreateIndex
CREATE INDEX "support_message_chatId_idx" ON "support_message"("chatId");

-- CreateIndex
CREATE INDEX "support_message_senderId_idx" ON "support_message"("senderId");

-- AddForeignKey
ALTER TABLE "support_chat" ADD CONSTRAINT "support_chat_userId_fkey" FOREIGN KEY ("userId") REFERENCES "user"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "support_message" ADD CONSTRAINT "support_message_chatId_fkey" FOREIGN KEY ("chatId") REFERENCES "support_chat"("id") ON DELETE CASCADE ON UPDATE CASCADE;
