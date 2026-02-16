CREATE TABLE "SellerAnalyticsEvent" (
  "id" TEXT NOT NULL,
  "sellerId" TEXT NOT NULL,
  "storeId" TEXT NOT NULL,
  "eventName" TEXT NOT NULL,
  "eventVersion" TEXT NOT NULL DEFAULT 'v1',
  "metadata" JSONB NOT NULL,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

  CONSTRAINT "SellerAnalyticsEvent_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "SellerAnalyticsEvent_storeId_createdAt_idx" ON "SellerAnalyticsEvent"("storeId", "createdAt");
CREATE INDEX "SellerAnalyticsEvent_sellerId_createdAt_idx" ON "SellerAnalyticsEvent"("sellerId", "createdAt");
CREATE INDEX "SellerAnalyticsEvent_eventName_createdAt_idx" ON "SellerAnalyticsEvent"("eventName", "createdAt");
