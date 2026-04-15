-- CreateEnum
CREATE TYPE "BingoItemReviewStatus" AS ENUM ('PENDING', 'APPROVED');

-- AlterTable
ALTER TABLE "BingoItem" ADD COLUMN "reviewStatus" "BingoItemReviewStatus" NOT NULL DEFAULT 'APPROVED';
ALTER TABLE "BingoItem" ADD COLUMN "submittedByUserId" TEXT;

-- AddForeignKey
ALTER TABLE "BingoItem" ADD CONSTRAINT "BingoItem_submittedByUserId_fkey" FOREIGN KEY ("submittedByUserId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- CreateIndex
CREATE INDEX "BingoItem_active_reviewStatus_sortOrder_idx" ON "BingoItem"("active", "reviewStatus", "sortOrder");
CREATE INDEX "BingoItem_reviewStatus_createdAt_idx" ON "BingoItem"("reviewStatus", "createdAt");

-- Drop old index if exists (replace with composite)
DROP INDEX IF EXISTS "BingoItem_active_sortOrder_idx";
