-- CreateTable
CREATE TABLE "messages" (
    "id" UUID NOT NULL,
    "senderProfileId" UUID NOT NULL,
    "recipientProfileId" UUID NOT NULL,
    "body" VARCHAR(2000) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "readAt" TIMESTAMP(3),

    CONSTRAINT "messages_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "messages_senderProfileId_recipientProfileId_createdAt_idx" ON "messages"("senderProfileId", "recipientProfileId", "createdAt");

-- CreateIndex
CREATE INDEX "messages_recipientProfileId_readAt_idx" ON "messages"("recipientProfileId", "readAt");

-- AddForeignKey
ALTER TABLE "messages" ADD CONSTRAINT "messages_senderProfileId_fkey" FOREIGN KEY ("senderProfileId") REFERENCES "profiles"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "messages" ADD CONSTRAINT "messages_recipientProfileId_fkey" FOREIGN KEY ("recipientProfileId") REFERENCES "profiles"("id") ON DELETE CASCADE ON UPDATE CASCADE;

