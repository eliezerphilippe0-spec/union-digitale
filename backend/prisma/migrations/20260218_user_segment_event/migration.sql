-- Add fields to UserSegmentEvent
ALTER TABLE "UserSegmentEvent" ADD COLUMN IF NOT EXISTS "fromSegment" TEXT;
ALTER TABLE "UserSegmentEvent" ADD COLUMN IF NOT EXISTS "toSegment" TEXT;
ALTER TABLE "UserSegmentEvent" ADD COLUMN IF NOT EXISTS "reason" TEXT;
ALTER TABLE "UserSegmentEvent" ADD COLUMN IF NOT EXISTS "windowDays" INTEGER;
ALTER TABLE "UserSegmentEvent" ADD COLUMN IF NOT EXISTS "computedAt" TIMESTAMP(3);
ALTER TABLE "UserSegmentEvent" ADD COLUMN IF NOT EXISTS "jobRunId" TEXT;

-- Indexes
CREATE INDEX IF NOT EXISTS "UserSegmentEvent_toSegment_createdAt_idx" ON "UserSegmentEvent"("toSegment", "createdAt");
