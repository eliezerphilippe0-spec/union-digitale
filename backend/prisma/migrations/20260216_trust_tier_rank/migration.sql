-- Add trustTierRank for explicit ordering
ALTER TABLE "Store" ADD COLUMN "trustTierRank" INTEGER NOT NULL DEFAULT 3;

UPDATE "Store" SET "trustTierRank" = CASE "trustTier"
  WHEN 'ELITE' THEN 5
  WHEN 'TRUSTED' THEN 4
  WHEN 'STANDARD' THEN 3
  WHEN 'WATCH' THEN 2
  WHEN 'RESTRICTED' THEN 1
  ELSE 3
END;
