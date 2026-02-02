#!/usr/bin/env node

/**
 * Script de validation des variables d'environnement
 * Vérifie que toutes les configurations requises sont présentes avant déploiement
 */

const fs = require('fs');
const path = require('path');

// Couleurs pour le terminal
const colors = {
    reset: '\x1b[0m',
    red: '\x1b[31m',
    green: '\x1b[32m',
    yellow: '\x1b[33m',
    blue: '\x1b[34m',
};

function log(message, color = 'reset') {
    console.log(`${colors[color]}${message}${colors.reset}`);
}

function checkEnvFile() {
    const envPath = path.join(__dirname, '..', '.env');

    if (!fs.existsSync(envPath)) {
        log('❌ ERREUR: Fichier .env introuvable', 'red');
        log('Créez un fichier .env à la racine du projet', 'yellow');
        return false;
    }

    const envContent = fs.readFileSync(envPath, 'utf-8');
    const envVars = {};

    envContent.split('\n').forEach(line => {
        const [key, value] = line.split('=');
        if (key && value) {
            envVars[key.trim()] = value.trim();
        }
    });

    return envVars;
}

function validateFirebaseConfig(envVars) {
    log('\n🔥 Validation Firebase...', 'blue');

    const requiredVars = [
        'VITE_FIREBASE_API_KEY',
        'VITE_FIREBASE_AUTH_DOMAIN',
        'VITE_FIREBASE_PROJECT_ID',
        'VITE_FIREBASE_STORAGE_BUCKET',
        'VITE_FIREBASE_MESSAGING_SENDER_ID',
        'VITE_FIREBASE_APP_ID',
    ];

    let allValid = true;

    requiredVars.forEach(varName => {
        if (!envVars[varName] || envVars[varName].includes('...')) {
            log(`  ❌ ${varName} manquant ou invalide`, 'red');
            allValid = false;
        } else {
            log(`  ✅ ${varName}`, 'green');
        }
    });

    return allValid;
}

function validatePaymentConfig(envVars) {
    log('\n💳 Validation Paiements...', 'blue');

    let warnings = 0;

    // Stripe
    if (!envVars.VITE_STRIPE_PUBLIC_KEY) {
        log('  ⚠️  VITE_STRIPE_PUBLIC_KEY manquant', 'yellow');
        warnings++;
    } else if (envVars.VITE_STRIPE_PUBLIC_KEY.startsWith('pk_test_')) {
        log('  ⚠️  Stripe en mode TEST (pk_test_)', 'yellow');
        log('     Pour production, utilisez pk_live_', 'yellow');
        warnings++;
    } else {
        log('  ✅ Stripe configuré (LIVE)', 'green');
    }

    // MonCash
    if (!envVars.VITE_MONCASH_CLIENT_ID) {
        log('  ⚠️  VITE_MONCASH_CLIENT_ID manquant', 'yellow');
        warnings++;
    } else {
        log('  ✅ MonCash Client ID présent', 'green');
    }

    if (envVars.VITE_MONCASH_MODE !== 'production') {
        log('  ⚠️  VITE_MONCASH_MODE n\'est pas "production"', 'yellow');
        log(`     Valeur actuelle: ${envVars.VITE_MONCASH_MODE || 'non défini'}`, 'yellow');
        warnings++;
    } else {
        log('  ✅ MonCash en mode PRODUCTION', 'green');
    }

    return warnings === 0;
}

function validateSecrets(envVars) {
    log('\n🔒 Validation Sécurité...', 'blue');

    let issues = 0;

    // Vérifier qu'aucune clé ne contient des placeholders
    Object.entries(envVars).forEach(([key, value]) => {
        if (value.includes('...') || value === 'test' || value === 'YOUR_') {
            log(`  ⚠️  ${key} contient un placeholder`, 'yellow');
            issues++;
        }
    });

    if (issues === 0) {
        log('  ✅ Aucun placeholder détecté', 'green');
    }

    return issues === 0;
}

function checkGitignore() {
    log('\n📁 Validation .gitignore...', 'blue');

    const gitignorePath = path.join(__dirname, '..', '.gitignore');

    if (!fs.existsSync(gitignorePath)) {
        log('  ❌ .gitignore introuvable', 'red');
        return false;
    }

    const gitignoreContent = fs.readFileSync(gitignorePath, 'utf-8');

    if (!gitignoreContent.includes('.env')) {
        log('  ❌ .env n\'est pas dans .gitignore', 'red');
        log('  ⚠️  DANGER: Les secrets pourraient être exposés!', 'red');
        return false;
    }

    log('  ✅ .env est bien ignoré par Git', 'green');
    return true;
}

function main() {
    log('\n═══════════════════════════════════════════════════', 'blue');
    log('   🚀 Validation Environnement - Union Digitale', 'blue');
    log('═══════════════════════════════════════════════════\n', 'blue');

    const envVars = checkEnvFile();

    if (!envVars) {
        process.exit(1);
    }

    const firebaseValid = validateFirebaseConfig(envVars);
    const paymentsValid = validatePaymentConfig(envVars);
    const secretsValid = validateSecrets(envVars);
    const gitignoreValid = checkGitignore();

    log('\n═══════════════════════════════════════════════════', 'blue');
    log('   📊 Résumé de la Validation', 'blue');
    log('═══════════════════════════════════════════════════\n', 'blue');

    const allValid = firebaseValid && paymentsValid && secretsValid && gitignoreValid;

    if (allValid) {
        log('✅ TOUTES LES VALIDATIONS SONT PASSÉES', 'green');
        log('\n🎉 Environnement prêt pour le déploiement!', 'green');
        process.exit(0);
    } else {
        log('❌ CERTAINES VALIDATIONS ONT ÉCHOUÉ', 'red');
        log('\n⚠️  Corrigez les erreurs avant de déployer', 'yellow');
        process.exit(1);
    }
}

main();
