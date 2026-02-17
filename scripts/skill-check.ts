#!/usr/bin/env node
const fs = require('fs');
const { execSync } = require('child_process');
const path = require('path');

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
  const cmd = isCI ? 'git diff --name-only origin/main...HEAD' : 'git diff --name-only --cached';
  try {
    const out = execSync(cmd, { stdio: ['ignore', 'pipe', 'pipe'] }).toString();
    return out.split('\n').filter(Boolean);
  } catch (e) {
    return [];
  }
};

const changed = getChangedFiles();
const backendChanged = changed.some((f) => f.startsWith('backend/'));
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

if ((rulesChanged || indexesChanged) && lastRun.changelogNote !== true) {
  console.error('BLOCKED: rules/indexes change requires changelogNote=true in last_run.json');
  process.exit(1);
}

console.log('SKILL CHECK PASSED');
