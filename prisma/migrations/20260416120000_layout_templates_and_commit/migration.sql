-- AlterTable
ALTER TABLE "BingoCard" ADD COLUMN "layoutCommittedAt" TIMESTAMP(3);

-- CreateTable
CREATE TABLE "BingoLayoutTemplate" (
    "id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "reviewStatus" "BingoItemReviewStatus" NOT NULL DEFAULT 'PENDING',
    "submittedByUserId" TEXT,
    "proposedTexts" JSONB,
    "cellIds" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "activeInRandomDeal" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "BingoLayoutTemplate_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "BingoLayoutTemplate_reviewStatus_createdAt_idx" ON "BingoLayoutTemplate"("reviewStatus", "createdAt");

-- CreateIndex
CREATE INDEX "BingoLayoutTemplate_submittedByUserId_idx" ON "BingoLayoutTemplate"("submittedByUserId");

-- AddForeignKey
ALTER TABLE "BingoLayoutTemplate" ADD CONSTRAINT "BingoLayoutTemplate_submittedByUserId_fkey" FOREIGN KEY ("submittedByUserId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
