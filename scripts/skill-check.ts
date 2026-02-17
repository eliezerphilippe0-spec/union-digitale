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

if (rulesChanged || indexesChanged) {
  // JSON validation only; changelog enforced in review
}

console.log('SKILL CHECK PASSED');
