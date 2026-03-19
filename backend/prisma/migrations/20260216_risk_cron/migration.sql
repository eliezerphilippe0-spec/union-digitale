-- RiskEventType add AUTO_UNFREEZE
DO $$ BEGIN
  ALTER TYPE "RiskEventType" ADD VALUE IF NOT EXISTS 'AUTO_UNFREEZE';
EXCEPTION WHEN duplicate_object THEN null; END $$;

-- Store freezeExpiresAt
ALTER TABLE "Store" ADD COLUMN IF NOT EXISTS "freezeExpiresAt" TIMESTAMP;

-- JobLock table
CREATE TABLE IF NOT EXISTS "JobLock" (
  "key" TEXT PRIMARY KEY,
  "lockedBy" TEXT,
  "lockedAt" TIMESTAMP,
  "expiresAt" TIMESTAMP,
  "lastReport" JSONB
);
