#!/usr/bin/env node
import fs from 'fs';
import path from 'path';
import { execSync } from 'child_process';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const args = process.argv.slice(2);
const getArg = (flag) => {
  const idx = args.indexOf(flag);
  if (idx === -1) return null;
  return args[idx + 1] || null;
};

let task = getArg('--task');
const forceSkill = getArg('--force');
const overrideArg = getArg('--skill');
const overrideEnv = process.env.SKILL_OVERRIDE || null;

const testsAdded = getArg('--testsAdded') === 'true';

if (!task) {
  console.error('Usage: node scripts/skill-router.ts --task "..."');
  process.exit(1);
}

// sanitize task
if (task) {
  task = String(task).replace(/\s+/g, ' ').trim();
  if (task.length > 500) task = task.slice(0, 500);
}
const text = task.toLowerCase();

const skillRules = [
  { key: 'finance_guardian', keywords: ['escrow', 'payout', 'refund', 'commission', 'ledger', 'balance', 'wallet', 'suborder', 'suborders'] },
  { key: 'security_auditor', keywords: ['rules', 'auth', 'role', 'permission', 'jwt', 'webhook'] },
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
const normalSelectedSkill = matched[0] || 'growth_engineer';
let selectedSkill = normalSelectedSkill;
if (forceSkill) selectedSkill = forceSkill;
const overrideSkill = overrideArg || overrideEnv;
let secondarySkills = matched.filter((k) => k !== selectedSkill).slice(0, 2);
let normalSecondarySkills = matched.filter((k) => k !== normalSelectedSkill);

if (overrideSkill) {
  const allowed = ['finance_guardian','security_auditor','perf_optimizer','architecture_guard','growth_engineer'];
  if (!allowed.includes(overrideSkill)) {
    console.error('BLOCKED: invalid override skill');
    process.exit(1);
  }
  selectedSkill = overrideSkill;
}

if (selectedSkill === 'finance_guardian' && text.includes('refund') && !secondarySkills.includes('security_auditor')) {
  secondarySkills = ['security_auditor', ...secondarySkills].slice(0, 2);
}

if (overrideSkill) {
  const priority = ['finance_guardian','security_auditor','perf_optimizer','architecture_guard','growth_engineer'];
  const baseSkills = [normalSelectedSkill, ...normalSecondarySkills];
  if (normalSelectedSkill === 'finance_guardian' && text.includes('refund')) {
    baseSkills.push('security_auditor');
  }
  const normalSkills = baseSkills.filter((k) => k !== selectedSkill);
  secondarySkills = Array.from(new Set(normalSkills))
    .sort((a,b)=>priority.indexOf(a)-priority.indexOf(b))
    .slice(0,2);
}

if (secondarySkills.length > 2) {
  secondarySkills = secondarySkills.slice(0, 2);
}

let checklistStatus = 'PASSED';
const refusalHits = (refusalRules[selectedSkill] || []).filter((k) => text.includes(k));
if (refusalHits.length > 0) checklistStatus = 'BLOCKED';

const getChangedFiles = () => {
  try {
    const out = execSync('git diff --name-only --cached', { stdio: ['ignore', 'pipe', 'pipe'] }).toString();
    return out.split('\n').filter(Boolean).slice(0, 50).map((f) => f.slice(0, 200));
  } catch (e) {
    return [];
  }
};

const changedFiles = getChangedFiles();
const safeTask = String(task || '').slice(0, 500);
const safeChangedFiles = Array.isArray(changedFiles)
  ? changedFiles.filter((f) => typeof f === 'string').slice(0, 50)
  : [];

const output = {
  task,
  selectedSkill,
  secondarySkills,
  checklistStatus,
  testsAdded: !!testsAdded,
  overrideUsed: !!overrideSkill,
  overrideSkill: overrideSkill || null,
  overrideReason: overrideArg ? 'CLI' : (overrideEnv ? 'ENV' : null),
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

let commitHash = null;
try {
  commitHash = execSync('git rev-parse HEAD', { stdio: ['ignore', 'pipe', 'pipe'] }).toString().trim();
} catch (e) {
  commitHash = null;
}
const safeCommitHash = typeof commitHash === 'string' ? commitHash.slice(0, 100) : null;

// Best-effort DB log (if prisma available)
try {
  const prisma = await import(path.join(process.cwd(), 'backend', 'src', 'lib', 'prisma.js'))
    .catch(() => null);
  if (prisma?.default?.skillUsageEvent?.create) {
    let driftWarningCount = 0;
    let commitPolicyWarningCount = 0;
    try {
      const last = JSON.parse(fs.readFileSync(path.join(skillDir, 'last_run.json'), 'utf8'));
      driftWarningCount = Number(last.driftWarningCount || 0);
      commitPolicyWarningCount = Number(last.commitPolicyWarningCount || 0);
    } catch (e) {}

    await prisma.default.skillUsageEvent.create({
      data: {
        actor: 'openclaw',
        task: safeTask,
        selectedSkill,
        secondarySkills,
        checklistStatus,
        testsAdded: !!testsAdded,
        result: checklistStatus,
        blocked: checklistStatus === 'BLOCKED',
        overrideUsed: !!overrideSkill,
        driftWarningCount,
        commitPolicyWarningCount,
        changedFiles: safeChangedFiles,
        commitHash: safeCommitHash,
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

if (overrideSkill) {
  console.warn(`WARN: skill override used (${overrideArg ? 'CLI' : 'ENV'})`);
}
console.log(`Selected skill: ${selectedSkill}`);
