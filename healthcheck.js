#!/usr/bin/env node

/**
 * Script de vérification de santé du projet Union Digitale
 * Usage: node healthcheck.js
 */

import { existsSync, statSync } from 'fs';
import { resolve } from 'path';
import { execSync } from 'child_process';

const colors = {
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  reset: '\x1b[0m'
};

function log(status, message) {
  const icon = status === 'ok' ? '✅' : status === 'warn' ? '⚠️' : '❌';
  const color = status === 'ok' ? colors.green : status === 'warn' ? colors.yellow : colors.red;
  console.log(`${color}${icon} ${message}${colors.reset}`);
}

function checkFile(path, description) {
  if (existsSync(path)) {
    log('ok', `${description}: Présent`);
    return true;
  } else {
    log('error', `${description}: MANQUANT`);
    return false;
  }
}

function checkDirectory(path, description) {
  if (existsSync(path)) {
    const stats = statSync(path);
    if (stats.isDirectory()) {
      log('ok', `${description}: OK`);
      return true;
    }
  }
  log('error', `${description}: MANQUANT`);
  return false;
}

function checkNodeVersion() {
  try {
    const version = execSync('node --version', { encoding: 'utf-8' }).trim();
    const majorVersion = parseInt(version.slice(1).split('.')[0]);

    if (majorVersion >= 18) {
      log('ok', `Node.js version: ${version}`);
      return true;
    } else {
      log('warn', `Node.js version: ${version} (recommandé: >= 18)`);
      return false;
    }
  } catch (error) {
    log('error', 'Node.js: Non détecté');
    return false;
  }
}

function checkNpmVersion() {
  try {
    const version = execSync('npm --version', { encoding: 'utf-8' }).trim();
    log('ok', `npm version: ${version}`);
    return true;
  } catch (error) {
    log('error', 'npm: Non détecté');
    return false;
  }
}

function checkPort5173() {
  try {
    const processes = execSync('netstat -ano | findstr :5173', { encoding: 'utf-8' });
    if (processes.trim()) {
      log('warn', 'Port 5173: OCCUPÉ (exécutez: npm run kill-port)');
      return false;
    } else {
      log('ok', 'Port 5173: Disponible');
      return true;
    }
  } catch (error) {
    // Si erreur, le port est probablement libre
    log('ok', 'Port 5173: Disponible');
    return true;
  }
}

function checkCacheSize() {
  const cachePaths = [
    'node_modules/.vite',
    '.vite',
    'dist'
  ];

  let totalSize = 0;
  let exists = false;

  cachePaths.forEach(path => {
    if (existsSync(path)) {
      exists = true;
      // Note: Calcul de taille simplifié
    }
  });

  if (exists) {
    log('warn', 'Caches présents (si problème: npm run clean)');
  } else {
    log('ok', 'Caches: Propre');
  }
}

function checkGitStatus() {
  try {
    const status = execSync('git status --porcelain', { encoding: 'utf-8' });
    if (status.trim()) {
      const lines = status.trim().split('\n').length;
      log('warn', `Git: ${lines} fichier(s) modifié(s) non commité(s)`);
    } else {
      log('ok', 'Git: État propre');
    }
  } catch (error) {
    log('warn', 'Git: Non initialisé ou erreur');
  }
}

console.log(`\n${colors.blue}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${colors.reset}`);
console.log(`${colors.blue}🏥 Healthcheck Union Digitale${colors.reset}`);
console.log(`${colors.blue}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${colors.reset}\n`);

console.log('📦 Environnement:');
checkNodeVersion();
checkNpmVersion();
console.log('');

console.log('📁 Fichiers Critiques:');
checkFile('package.json', 'package.json');
checkFile('vite.config.js', 'vite.config.js');
checkFile('src/App.jsx', 'src/App.jsx');
checkFile('src/main.jsx', 'src/main.jsx');
checkFile('src/App.jsx.backup', 'src/App.jsx.backup');
console.log('');

console.log('📂 Dossiers:');
checkDirectory('node_modules', 'node_modules');
checkDirectory('src', 'src');
checkDirectory('public', 'public');
console.log('');

console.log('🌐 Réseau:');
checkPort5173();
console.log('');

console.log('💾 Cache:');
checkCacheSize();
console.log('');

console.log('🔧 Git:');
checkGitStatus();

console.log(`\n${colors.blue}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${colors.reset}`);
console.log(`${colors.green}✨ Healthcheck terminé${colors.reset}`);
console.log(`${colors.blue}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${colors.reset}\n`);

console.log('💡 Commandes utiles:');
console.log('   npm run dev          - Démarrer dev server');
console.log('   npm run fresh        - Clean + dev');
console.log('   npm run fresh:full   - Clean complet + réinstall + dev');
console.log('   npm run kill-port    - Libérer le port 5173');
console.log('   node healthcheck.js  - Relancer ce check\n');
