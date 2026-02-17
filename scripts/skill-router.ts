#!/usr/bin/env node
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const args = process.argv.slice(2);
const getArg = (flag) => {
  const idx = args.indexOf(flag);
  if (idx === -1) return null;
  return args[idx + 1] || null;
};

const task = getArg('--task');
const forceSkill = getArg('--force');
const testsAdded = getArg('--testsAdded') === 'true';

if (!task) {
  console.error('Usage: node scripts/skill-router.ts --task "..."');
  process.exit(1);
}

const text = task.toLowerCase();

const skillRules = [
  { key: 'finance_guardian', keywords: ['escrow', 'payout', 'refund', 'commission', 'ledger', 'balance', 'wallet', 'suborder', 'suborders'] },
  { key: 'security_auditor', keywords: ['rules', 'auth', 'admin', 'role', 'permission', 'jwt', 'webhook'] },
  { key: 'perf_optimizer', keywords: ['query', 'index', 'pagination', 'firestore', 'limit', 'startafter', 'n+1'] },
  { key: 'architecture_guard', keywords: ['migration', 'schema', 'refactor', 'version', 'flag', 'compatibility'] },
  { key: 'growth_engineer', keywords: ['badge', 'tracking', 'analytics', 'kpi', 'conversion', 'a/b'] },
];

const refusalRules = {
  finance_guardian: ['price from body', 'no idempotency', 'no ledger', 'negative balance', 'ignore risklevel', 'ignore payoutsfrozen'],
  security_auditor: ['trust userid from body', 'global read', 'no role check', 'no webhook signature', 'client write sensitive'],
  perf_optimizer: ['no limit', 'no index', 'n+1', 'snapshot admin list'],
  architecture_guard: ['breaking change', 'no migration', 'no feature flag'],
  growth_engineer: ['no kpi', 'no tracking', 'no rate limit'],
};

const matched = [];
for (const rule of skillRules) {
  if (rule.keywords.some((k) => text.includes(k))) matched.push(rule.key);
}

// priority order already in skillRules
let selectedSkill = matched[0] || 'growth_engineer';
if (forceSkill) selectedSkill = forceSkill;

const secondarySkills = matched
  .filter((k) => k !== selectedSkill)
  .slice(0, 2);

let checklistStatus = 'PASSED';
const refusalHits = (refusalRules[selectedSkill] || []).filter((k) => text.includes(k));
if (refusalHits.length > 0) checklistStatus = 'BLOCKED';

const output = {
  task,
  selectedSkill,
  secondarySkills,
  checklistStatus,
  testsAdded: !!testsAdded,
};

const skillDir = path.join(process.cwd(), '.skill');
if (!fs.existsSync(skillDir)) fs.mkdirSync(skillDir, { recursive: true });
fs.writeFileSync(path.join(skillDir, 'last_run.json'), JSON.stringify(output, null, 2));

const logLine = `${new Date().toISOString()} | ${selectedSkill} | ${checklistStatus} | ${task}\n`;
const logPath = path.join(process.cwd(), 'logs', 'skill_usage.log');
try {
  fs.appendFileSync(logPath, logLine);
} catch (e) {
  // ignore
}

// Best-effort DB log (if prisma available)
try {
  const prisma = await import(path.join(process.cwd(), 'backend', 'src', 'lib', 'prisma.js'))
    .catch(() => null);
  if (prisma?.default?.skillUsageEvent?.create) {
    await prisma.default.skillUsageEvent.create({
      data: {
        skillKey: selectedSkill,
        status: checklistStatus,
        source: 'router',
        metadata: { task, secondarySkills },
      },
    });
  }
} catch (e) {
  // ignore
}

if (checklistStatus === 'BLOCKED') {
  console.error('BLOCKED: refusal rules triggered');
  process.exit(1);
}

console.log(`Selected skill: ${selectedSkill}`);
