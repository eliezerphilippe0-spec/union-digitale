-- Trust formula versioning
ALTER TABLE "Store" ADD COLUMN "trustFormulaVersion" TEXT NOT NULL DEFAULT 'v1';
ALTER TABLE "Store" ADD COLUMN "trustFormulaUpdatedAt" TIMESTAMP(3);

ALTER TABLE "TrustEvent" ADD COLUMN "formulaVersion" TEXT NOT NULL DEFAULT 'v1';

UPDATE "Store" SET "trustFormulaVersion" = 'v1' WHERE "trustFormulaVersion" IS NULL;
UPDATE "TrustEvent" SET "formulaVersion" = 'v1' WHERE "formulaVersion" IS NULL;
