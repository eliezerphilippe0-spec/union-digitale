-- Trust tier enum
DO $$ BEGIN
  CREATE TYPE "TrustTier" AS ENUM ('ELITE','TRUSTED','STANDARD','WATCH','RESTRICTED');
EXCEPTION WHEN duplicate_object THEN null; END $$;

-- Store trust fields
ALTER TABLE "Store" ADD COLUMN IF NOT EXISTS "trustScore" INTEGER DEFAULT 100;
ALTER TABLE "Store" ADD COLUMN IF NOT EXISTS "trustTier" "TrustTier" DEFAULT 'STANDARD';
ALTER TABLE "Store" ADD COLUMN IF NOT EXISTS "trustUpdatedAt" TIMESTAMP;
ALTER TABLE "Store" ADD COLUMN IF NOT EXISTS "trustReasonSummary" JSONB;
ALTER TABLE "Store" ADD COLUMN IF NOT EXISTS "trustScoreStableDays" INTEGER DEFAULT 0;
ALTER TABLE "Store" ADD COLUMN IF NOT EXISTS "trustLastTierChangeAt" TIMESTAMP;
ALTER TABLE "Store" ADD COLUMN IF NOT EXISTS "listingBoostFactor" DOUBLE PRECISION DEFAULT 1.0;
ALTER TABLE "Store" ADD COLUMN IF NOT EXISTS "payoutDelayHours" INTEGER DEFAULT 72;

-- TrustEvent
CREATE TABLE IF NOT EXISTS "TrustEvent" (
  "id" TEXT PRIMARY KEY DEFAULT gen_random_uuid(),
  "storeId" TEXT NOT NULL,
  "prevScore" INTEGER NOT NULL,
  "nextScore" INTEGER NOT NULL,
  "prevTier" "TrustTier" NOT NULL,
  "nextTier" "TrustTier" NOT NULL,
  "details" JSONB NOT NULL,
  "createdAt" TIMESTAMP NOT NULL DEFAULT now(),
  CONSTRAINT "TrustEvent_storeId_fkey" FOREIGN KEY ("storeId") REFERENCES "Store"("id") ON DELETE CASCADE
);
CREATE INDEX IF NOT EXISTS "TrustEvent_storeId_createdAt_idx" ON "TrustEvent" ("storeId", "createdAt");
