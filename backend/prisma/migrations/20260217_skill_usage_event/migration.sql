-- Create SkillUsageEvent table
CREATE TABLE IF NOT EXISTS "SkillUsageEvent" (
  "id" TEXT PRIMARY KEY,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "actor" TEXT,
  "task" TEXT NOT NULL,
  "selectedSkill" TEXT NOT NULL,
  "secondarySkills" JSONB,
  "result" TEXT NOT NULL DEFAULT 'PASSED',
  "blocked" BOOLEAN NOT NULL DEFAULT false,
  "changedFiles" JSONB,
  "commitHash" TEXT
);

CREATE INDEX IF NOT EXISTS "SkillUsageEvent_createdAt_idx" ON "SkillUsageEvent"("createdAt");
CREATE INDEX IF NOT EXISTS "SkillUsageEvent_selectedSkill_createdAt_idx" ON "SkillUsageEvent"("selectedSkill", "createdAt");
CREATE INDEX IF NOT EXISTS "SkillUsageEvent_result_createdAt_idx" ON "SkillUsageEvent"("result", "createdAt");
CREATE INDEX IF NOT EXISTS "SkillUsageEvent_blocked_createdAt_idx" ON "SkillUsageEvent"("blocked", "createdAt");
