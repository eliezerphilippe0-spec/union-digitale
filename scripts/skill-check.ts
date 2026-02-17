#!/usr/bin/env node
import fs from 'fs';
import path from 'path';
import { execSync } from 'child_process';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const isCI = process.argv.includes('--ci');

const readJSON = (p) => JSON.parse(fs.readFileSync(p, 'utf8'));

const lastRunPath = path.join(process.cwd(), '.skill', 'last_run.json');
if (!fs.existsSync(lastRunPath)) {
  console.error('BLOCKED: missing .skill/last_run.json');
  process.exit(1);
}

const lastRun = readJSON(lastRunPath);
if (lastRun.checklistStatus !== 'PASSED') {
  console.error('BLOCKED: checklistStatus != PASSED');
  process.exit(1);
}

const getChangedFiles = () => {
  if (isCI) {
    const base = process.env.SKILL_DIFF_BASE;
    if (!base) {
      console.error('BLOCKED: SKILL_DIFF_BASE missing in CI');
      process.exit(1);
    }
    const cmd = `git diff --name-only ${base}...HEAD`;
    try {
      const out = execSync(cmd, { stdio: ['ignore', 'pipe', 'pipe'] }).toString();
      return out.split('\n').filter(Boolean);
    } catch (e) {
      console.error('BLOCKED: git diff failed in CI');
      process.exit(1);
    }
  }
  const cmd = 'git diff --name-only --cached';
  try {
    const out = execSync(cmd, { stdio: ['ignore', 'pipe', 'pipe'] }).toString();
    return out.split('\n').filter(Boolean);
  } catch (e) {
    return [];
  }
};

const changed = getChangedFiles();
const isBackendChange = (f) => (
  f.startsWith('backend/') ||
  f.startsWith('functions/') ||
  f.startsWith('prisma/') ||
  f === 'firestore.rules' ||
  f === 'firestore.indexes.json'
);

const backendChanged = changed.some(isBackendChange);
const financeChanged = changed.some((f) => /finance|payout|escrow|ledger|refund|commission/i.test(f));
const rulesChanged = changed.some((f) => f === 'firestore.rules');
const indexesChanged = changed.some((f) => f === 'firestore.indexes.json');

if ((backendChanged || financeChanged) && lastRun.testsAdded !== true) {
  console.error('BLOCKED: backend/finance changes require testsAdded=true');
  process.exit(1);
}

if (indexesChanged) {
  try {
    JSON.parse(fs.readFileSync('firestore.indexes.json', 'utf8'));
  } catch (e) {
    console.error('BLOCKED: firestore.indexes.json invalid JSON');
    process.exit(1);
  }
}

const driftWarnings = [];
if (lastRun.selectedSkill === 'growth_engineer' && backendChanged) {
  driftWarnings.push({ reason: 'growth_engineer_with_backend_changes' });
}
if (lastRun.selectedSkill === 'perf_optimizer' && (rulesChanged || /auth|security/i.test(changed.join(' ')))) {
  driftWarnings.push({ reason: 'perf_optimizer_with_security_changes' });
}
if (lastRun.selectedSkill === 'security_auditor' && !backendChanged && !rulesChanged && !indexesChanged) {
  driftWarnings.push({ reason: 'security_auditor_with_no_backend_changes' });
}
if (lastRun.selectedSkill === 'finance_guardian' && !financeChanged) {
  driftWarnings.push({ reason: 'finance_guardian_with_no_finance_changes' });
}
if (lastRun.selectedSkill === 'architecture_guard' && !backendChanged && changed.some((f)=>f.startsWith('src/'))) {
  driftWarnings.push({ reason: 'architecture_guard_with_ui_only_changes' });
}

if (driftWarnings.length > 0) {
  console.warn('WARN: skill drift detected', driftWarnings);
}

// attach warnings to last_run.json (non-blocking)
try {
  lastRun.driftWarnings = driftWarnings;
  fs.writeFileSync(lastRunPath, JSON.stringify(lastRun, null, 2));
} catch (e) {}

if (rulesChanged || indexesChanged) {
  // JSON validation only; changelog enforced in review
}

const commitPolicyWarnings = [];
try {
  const commitMsgPath = path.join(process.cwd(), '.git', 'COMMIT_EDITMSG');
  if (fs.existsSync(commitMsgPath)) {
    const msg = fs.readFileSync(commitMsgPath, 'utf8').trim();
    const expected = {
      finance_guardian: ['feat(finance):', 'fix(finance):', 'security(finance):'],
      security_auditor: ['security(', 'fix(security):'],
      perf_optimizer: ['perf(', 'perf(admin):', 'perf(firestore):'],
      architecture_guard: ['refactor(', 'chore('],
      growth_engineer: ['feat(growth):', 'chore(analytics):'],
    };
    const exp = expected[lastRun.selectedSkill] || [];
    if (exp.length && !exp.some((p) => msg.startsWith(p))) {
      commitPolicyWarnings.push({ reason: 'commit_prefix_mismatch', expected: exp, actual: msg });
      console.warn('WARN: commit prefix does not match selectedSkill', exp);
    }
  } else {
    console.warn('WARN: commit message not available');
  }
} catch (e) {
  console.warn('WARN: commit policy check failed');
}

try {
  lastRun.commitPolicyWarnings = commitPolicyWarnings;
  fs.writeFileSync(lastRunPath, JSON.stringify(lastRun, null, 2));
} catch (e) {}

console.log('SKILL CHECK PASSED');
