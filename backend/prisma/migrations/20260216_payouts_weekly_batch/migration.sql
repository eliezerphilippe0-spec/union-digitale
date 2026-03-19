-- Add KYC + risk flags to Store
ALTER TABLE "Store" ADD COLUMN IF NOT EXISTS "kycStatus" TEXT DEFAULT 'UNVERIFIED';
ALTER TABLE "Store" ADD COLUMN IF NOT EXISTS "riskFlag" BOOLEAN DEFAULT false;

-- Extend Order for escrow/commission
ALTER TABLE "Order" ADD COLUMN IF NOT EXISTS "subtotalProductsHTG" DOUBLE PRECISION DEFAULT 0;
ALTER TABLE "Order" ADD COLUMN IF NOT EXISTS "commissionAmountHTG" DOUBLE PRECISION DEFAULT 0;
ALTER TABLE "Order" ADD COLUMN IF NOT EXISTS "sellerGrossHTG" DOUBLE PRECISION DEFAULT 0;
ALTER TABLE "Order" ADD COLUMN IF NOT EXISTS "sellerNetHTG" DOUBLE PRECISION DEFAULT 0;
ALTER TABLE "Order" ADD COLUMN IF NOT EXISTS "escrowStatus" TEXT DEFAULT 'NONE';

-- SellerBalance payoutPending
ALTER TABLE "SellerBalance" ADD COLUMN IF NOT EXISTS "payoutPendingHTG" DOUBLE PRECISION DEFAULT 0;

-- PayoutRequest weekStart + batchKey
ALTER TABLE "PayoutRequest" ADD COLUMN IF NOT EXISTS "weekStart" TIMESTAMP;
ALTER TABLE "PayoutRequest" ADD COLUMN IF NOT EXISTS "batchKey" TEXT;
CREATE UNIQUE INDEX IF NOT EXISTS "PayoutRequest_batchKey_key" ON "PayoutRequest" ("batchKey");

-- FinancialLedger payoutRequest relation
ALTER TABLE "FinancialLedger" ADD COLUMN IF NOT EXISTS "payoutRequestId" TEXT;

-- Indexes
CREATE INDEX IF NOT EXISTS "PayoutRequest_storeId_idx" ON "PayoutRequest" ("storeId");
