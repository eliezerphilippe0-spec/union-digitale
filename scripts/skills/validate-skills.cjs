#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

const ROOT = path.resolve(__dirname, '..', '..');
const SKILLS_DIR = path.join(ROOT, 'skills');
const OUTPUT_DIR = path.join(ROOT, '.skill');
const OUTPUT_FILE = path.join(OUTPUT_DIR, 'last_run.json');

const REQUIRED_SECTIONS = [
  'Purpose',
  'Scope',
  'Inputs',
  'Outputs',
  'Preconditions',
  'Side Effects',
  'Guardrails',
  'Logging',
  'Examples',
  'Ownership',
];

const REQUIRED_METADATA = [
  /^-\s+Key:\s+.+/m,
  /^-\s+Owner:\s+.+/m,
  /^-\s+Version:\s+.+/m,
  /^-\s+Status:\s+.+/m,
];

const errors = [];
const warnings = [];

if (!fs.existsSync(SKILLS_DIR)) {
  errors.push('Missing skills/ directory.');
}

const files = fs.existsSync(SKILLS_DIR)
  ? fs.readdirSync(SKILLS_DIR).filter((f) => f.endsWith('.md'))
  : [];

if (files.length === 0) {
  errors.push('No skills/*.md files found.');
}

for (const file of files) {
  const filePath = path.join(SKILLS_DIR, file);
  const content = fs.readFileSync(filePath, 'utf8');

  if (!/^#\s+Skill:/m.test(content)) {
    errors.push(`${file}: missing "# Skill:" header.`);
  }

  for (const regex of REQUIRED_METADATA) {
    if (!regex.test(content)) {
      errors.push(`${file}: missing metadata line (${regex}).`);
    }
  }

  for (const section of REQUIRED_SECTIONS) {
    const sectionRegex = new RegExp(`^##\\s+${section}\\b`, 'm');
    if (!sectionRegex.test(content)) {
      errors.push(`${file}: missing section "${section}".`);
    }
  }
}

const result = {
  runAt: new Date().toISOString(),
  status: errors.length ? 'failed' : 'ok',
  skillsChecked: files.length,
  errors,
  warnings,
};

if (process.argv.includes('--write')) {
  fs.mkdirSync(OUTPUT_DIR, { recursive: true });
  fs.writeFileSync(OUTPUT_FILE, `${JSON.stringify(result, null, 2)}\n`);
}

if (errors.length) {
  console.error('Skills validation failed:\n');
  errors.forEach((err) => console.error(`- ${err}`));
  process.exit(1);
}

console.log('Skills validation passed.');
