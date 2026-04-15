-- AlterTable
ALTER TABLE "BingoCard" ADD COLUMN "shareToken" TEXT;

-- CreateIndex
CREATE UNIQUE INDEX "BingoCard_shareToken_key" ON "BingoCard"("shareToken");
