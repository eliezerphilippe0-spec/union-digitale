#!/usr/bin/env node

/**
 * Firebase Security Setup Helper
 * Helps developers configure environment variables securely
 */

const fs = require('fs');
const path = require('path');
const readline = require('readline');

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

const question = (prompt) => new Promise(resolve => rl.question(prompt, resolve));

async function setupEnv() {
  console.log('\n🔐 Firebase Security Setup Helper\n');
  console.log('This script will help you configure .env.local files securely.\n');

  // Check if .env.local exists
  const rootEnvPath = path.join(__dirname, '.env.local');
  const functionsEnvPath = path.join(__dirname, 'functions', '.env.local');

  if (fs.existsSync(rootEnvPath)) {
    console.log('✅ Found .env.local in root');
  } else {
    console.log('⚠️  .env.local not found in root');
  }

  if (fs.existsSync(functionsEnvPath)) {
    console.log('✅ Found .env.local in functions/');
  } else {
    console.log('⚠️  .env.local not found in functions/');
  }

  // Check .gitignore
  const gitignorePath = path.join(__dirname, '.gitignore');
  const gitignore = fs.readFileSync(gitignorePath, 'utf8');
  
  const securityChecks = {
    '.env': gitignore.includes('.env'),
    'firebase-adminsdk': gitignore.includes('firebase-adminsdk'),
    '.env.local': gitignore.includes('.env.local'),
  };

  console.log('\n📋 .gitignore Security Checks:');
  Object.entries(securityChecks).forEach(([check, passed]) => {
    console.log(`  ${passed ? '✅' : '❌'} ${check} ignored`);
  });

  const proceed = await question('\n🚀 Ready to continue? (yes/no): ');
  
  if (proceed.toLowerCase() === 'yes') {
    console.log('\n✅ Setup complete! Don\'t forget to:');
    console.log('  1. Regenerate Firebase keys in Console');
    console.log('  2. Update .env.local with your credentials');
    console.log('  3. Store firebase-adminsdk.json in functions/');
    console.log('  4. Run: npm install && npm run build\n');
  }

  rl.close();
}

setupEnv().catch(err => {
  console.error('Error:', err);
  process.exit(1);
});
