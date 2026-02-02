#!/usr/bin/env node

/**
 * Quick Firebase Security Status Check
 * Lists all security configurations in place
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const projectRoot = path.resolve(__dirname, '..');
const checks = [];

// Colors for output
const colors = {
  reset: '\x1b[0m',
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  cyan: '\x1b[36m'
};

function check(name, testFn) {
  try {
    const result = testFn();
    checks.push({ name, result: result ? '✓' : '✗', color: result ? 'green' : 'red' });
  } catch (e) {
    checks.push({ name, result: '✗', color: 'red' });
  }
}

// Run all checks
console.log(`\n${colors.cyan}[FIREBASE SECURITY STATUS]${colors.reset}\n`);

// File existence checks
check('Root .env.local exists', () => fs.existsSync(path.join(projectRoot, '.env.local')));
check('Functions .env.local exists', () => fs.existsSync(path.join(projectRoot, 'functions/.env.local')));
check('Root .gitignore exists', () => fs.existsSync(path.join(projectRoot, '.gitignore')));
check('Functions .gitignore exists', () => fs.existsSync(path.join(projectRoot, 'functions/.gitignore')));

// .gitignore content checks
const gitignore = fs.readFileSync(path.join(projectRoot, '.gitignore'), 'utf8');
check('.gitignore protects .env', () => gitignore.includes('.env'));
check('.gitignore protects firebase-adminsdk', () => gitignore.includes('firebase-adminsdk'));
check('.gitignore protects .env.local', () => gitignore.includes('.env.local'));

// Exposed credentials check
const hasExposedKeys = fs.readdirSync(projectRoot, { recursive: true })
  .filter(f => typeof f === 'string' && f.includes('firebase-adminsdk') && f.endsWith('.json'))
  .filter(f => !f.includes('node_modules'))
  .length === 0;

check('No exposed firebase-adminsdk files', () => hasExposedKeys);

// Documentation checks
check('FIREBASE_SECURITY_SETUP.md exists', () => fs.existsSync(path.join(projectRoot, 'FIREBASE_SECURITY_SETUP.md')));
check('FIREBASE_SECURITY_README.md exists', () => fs.existsSync(path.join(projectRoot, 'FIREBASE_SECURITY_README.md')));
check('SECURITY_SETUP_COMPLETED.md exists', () => fs.existsSync(path.join(projectRoot, 'SECURITY_SETUP_COMPLETED.md')));

// Script checks
check('setup-security.ps1 exists', () => fs.existsSync(path.join(projectRoot, 'scripts/setup-security.ps1')));
check('setup-security.js exists', () => fs.existsSync(path.join(projectRoot, 'scripts/setup-security.js')));

// Print results
console.log('Configuration Status:\n');
checks.forEach(check => {
  const colorCode = colors[check.color];
  console.log(`  ${colorCode}${check.result}${colors.reset} ${check.name}`);
});

// Summary
const passed = checks.filter(c => c.result === '✓').length;
const total = checks.length;

console.log(`\n${colors.cyan}Result: ${passed}/${total} checks passed${colors.reset}\n`);

if (passed === total) {
  console.log(`${colors.green}✓ All security configurations are in place!${colors.reset}\n`);
} else {
  console.log(`${colors.yellow}⚠ Some checks failed. Review the configuration above.${colors.reset}\n`);
}
