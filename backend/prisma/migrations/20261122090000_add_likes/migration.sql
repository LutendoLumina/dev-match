-- CreateTable
CREATE TABLE "likes" (
    "id" UUID NOT NULL,
    "fromProfileId" UUID NOT NULL,
    "toProfileId" UUID NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "likes_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "likes_toProfileId_idx" ON "likes"("toProfileId");

-- CreateIndex
CREATE UNIQUE INDEX "likes_fromProfileId_toProfileId_key" ON "likes"("fromProfileId", "toProfileId");

-- AddForeignKey
ALTER TABLE "likes" ADD CONSTRAINT "likes_fromProfileId_fkey" FOREIGN KEY ("fromProfileId") REFERENCES "profiles"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "likes" ADD CONSTRAINT "likes_toProfileId_fkey" FOREIGN KEY ("toProfileId") REFERENCES "profiles"("id") ON DELETE CASCADE ON UPDATE CASCADE;

