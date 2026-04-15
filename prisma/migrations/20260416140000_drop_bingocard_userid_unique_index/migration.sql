-- A korábbi multi_bingo migráció DROP CONSTRAINT-t használt, de az eredeti egyediség
-- CREATE UNIQUE INDEX volt — az nem tűnt el, ezért csak 1 BingoCard/user maradhatott.
DROP INDEX IF EXISTS "BingoCard_userId_key";
