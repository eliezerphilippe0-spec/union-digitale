-- Enums
DO $$ BEGIN
  CREATE TYPE "RiskLevel" AS ENUM ('NORMAL','WATCH','HIGH','FROZEN');
EXCEPTION WHEN duplicate_object THEN null; END $$;

DO $$ BEGIN
  CREATE TYPE "RiskEventType" AS ENUM ('REFUND_SPIKE','REFUND_AFTER_RELEASE_SPIKE','CHARGEBACK_SPIKE','PAYOUT_PENDING_GROWTH','PAYMENT_VELOCITY','RAPID_PAYOUT_PATTERN','MANUAL_SET');
EXCEPTION WHEN duplicate_object THEN null; END $$;

DO $$ BEGIN
  CREATE TYPE "RiskSeverity" AS ENUM ('INFO','WARNING','CRITICAL');
EXCEPTION WHEN duplicate_object THEN null; END $$;

-- Store fields
ALTER TABLE "Store" ADD COLUMN IF NOT EXISTS "riskLevel" "RiskLevel" DEFAULT 'NORMAL';
ALTER TABLE "Store" ADD COLUMN IF NOT EXISTS "payoutsFrozen" BOOLEAN DEFAULT false;
ALTER TABLE "Store" ADD COLUMN IF NOT EXISTS "lastRiskEvaluated" TIMESTAMP;

-- RiskEvent
CREATE TABLE IF NOT EXISTS "RiskEvent" (
  "id" TEXT PRIMARY KEY DEFAULT gen_random_uuid(),
  "storeId" TEXT NOT NULL,
  "type" "RiskEventType" NOT NULL,
  "severity" "RiskSeverity" NOT NULL,
  "prevLevel" "RiskLevel" NOT NULL,
  "nextLevel" "RiskLevel" NOT NULL,
  "scoreDelta" INTEGER NOT NULL DEFAULT 0,
  "details" JSONB NOT NULL,
  "createdAt" TIMESTAMP NOT NULL DEFAULT now(),
  CONSTRAINT "RiskEvent_storeId_fkey" FOREIGN KEY ("storeId") REFERENCES "Store"("id") ON DELETE CASCADE
);
CREATE INDEX IF NOT EXISTS "RiskEvent_storeId_createdAt_idx" ON "RiskEvent" ("storeId", "createdAt");
CREATE INDEX IF NOT EXISTS "RiskEvent_type_createdAt_idx" ON "RiskEvent" ("type", "createdAt");

-- RiskRuleConfig
CREATE TABLE IF NOT EXISTS "RiskRuleConfig" (
  "id" TEXT PRIMARY KEY DEFAULT gen_random_uuid(),
  "key" TEXT UNIQUE NOT NULL,
  "enabled" BOOLEAN NOT NULL DEFAULT true,
  "severity" "RiskSeverity" NOT NULL,
  "windowDays" INTEGER,
  "threshold" DOUBLE PRECISION,
  "threshold2" DOUBLE PRECISION,
  "limitInt" INTEGER,
  "multiplier" DOUBLE PRECISION,
  "json" JSONB,
  "updatedAt" TIMESTAMP NOT NULL DEFAULT now(),
  "createdAt" TIMESTAMP NOT NULL DEFAULT now()
);

-- RiskSnapshot
CREATE TABLE IF NOT EXISTS "RiskSnapshot" (
  "id" TEXT PRIMARY KEY DEFAULT gen_random_uuid(),
  "storeId" TEXT UNIQUE NOT NULL,
  "window7d" JSONB,
  "window30d" JSONB,
  "computedAt" TIMESTAMP NOT NULL DEFAULT now(),
  CONSTRAINT "RiskSnapshot_storeId_fkey" FOREIGN KEY ("storeId") REFERENCES "Store"("id") ON DELETE CASCADE
);
