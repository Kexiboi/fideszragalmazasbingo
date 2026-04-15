-- DropUnique: egy user több kártyát is tarthat
ALTER TABLE "BingoCard" DROP CONSTRAINT IF EXISTS "BingoCard_userId_key";

-- BingoCard: név + kedvenc
ALTER TABLE "BingoCard" ADD COLUMN "title" TEXT;
ALTER TABLE "BingoCard" ADD COLUMN "isFavorite" BOOLEAN NOT NULL DEFAULT false;

-- User: melyik kártya van kiválasztva
ALTER TABLE "User" ADD COLUMN "activeBingoCardId" TEXT;

ALTER TABLE "User" ADD CONSTRAINT "User_activeBingoCardId_fkey" FOREIGN KEY ("activeBingoCardId") REFERENCES "BingoCard"("id") ON DELETE SET NULL ON UPDATE CASCADE;

CREATE UNIQUE INDEX "User_activeBingoCardId_key" ON "User"("activeBingoCardId");

-- Meglévő egy kártya → legyen az aktív
UPDATE "User" u
SET "activeBingoCardId" = c.id
FROM "BingoCard" c
WHERE c."userId" = u.id
  AND u."activeBingoCardId" IS NULL;

CREATE INDEX "BingoCard_userId_isFavorite_updatedAt_idx" ON "BingoCard"("userId", "isFavorite", "updatedAt");
CREATE INDEX "BingoCard_userId_createdAt_idx" ON "BingoCard"("userId", "createdAt");
