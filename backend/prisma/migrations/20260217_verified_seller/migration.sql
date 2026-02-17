-- Add verified seller fields to Store
ALTER TABLE "Store" ADD COLUMN IF NOT EXISTS "isVerifiedSeller" BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE "Store" ADD COLUMN IF NOT EXISTS "verifiedByUid" TEXT;
ALTER TABLE "Store" ADD COLUMN IF NOT EXISTS "verifiedByEmail" TEXT;
