/**
 * Two-Factor Authentication (2FA) System
 * Adds extra security for vendor accounts
 */

import { onCall, HttpsError } from 'firebase-functions/v2/https';
import * as admin from 'firebase-admin';
import * as crypto from 'crypto';

const db = admin.firestore();

/**
 * Generate a 6-digit verification code
 */
function generateVerificationCode(): string {
  return Math.floor(100000 + Math.random() * 900000).toString();
}

/**
 * Generate a backup code
 */
function generateBackupCode(): string {
  return crypto.randomBytes(4).toString('hex').toUpperCase();
}

/**
 * Enable 2FA for a user
 */
export const enable2FA = onCall(
  { region: 'us-central1' },
  async (request) => {
    const { auth, data } = request;

    if (!auth) {
      throw new HttpsError('unauthenticated', 'Must be logged in');
    }

    const { method } = data; // 'sms' or 'email'

    if (!['sms', 'email'].includes(method)) {
      throw new HttpsError('invalid-argument', 'Method must be sms or email');
    }

    // Get user info
    const userDoc = await db.collection('users').doc(auth.uid).get();
    const user = userDoc.data();

    if (!user) {
      throw new HttpsError('not-found', 'User not found');
    }

    // Verify user has required contact info
    if (method === 'sms' && !user.phone) {
      throw new HttpsError('failed-precondition', 'Phone number required for SMS 2FA');
    }
    if (method === 'email' && !user.email) {
      throw new HttpsError('failed-precondition', 'Email required for email 2FA');
    }

    // Generate verification code
    const code = generateVerificationCode();
    const expiresAt = Date.now() + 10 * 60 * 1000; // 10 minutes

    // Store pending 2FA setup
    await db.collection('2fa_setup').doc(auth.uid).set({
      method,
      code,
      expiresAt,
      verified: false,
      createdAt: admin.firestore.FieldValue.serverTimestamp()
    });

    // Send verification code
    if (method === 'sms') {
      // TODO: Send SMS via Twilio
      console.log(`📱 2FA SMS code for ${user.phone}: ${code}`);
    } else {
      // TODO: Send email
      console.log(`📧 2FA Email code for ${user.email}: ${code}`);
    }

    return {
      success: true,
      message: `Code de vérification envoyé par ${method === 'sms' ? 'SMS' : 'email'}`
    };
  }
);

/**
 * Verify 2FA setup code and activate
 */
export const verify2FASetup = onCall(
  { region: 'us-central1' },
  async (request) => {
    const { auth, data } = request;

    if (!auth) {
      throw new HttpsError('unauthenticated', 'Must be logged in');
    }

    const { code } = data;

    if (!code) {
      throw new HttpsError('invalid-argument', 'Verification code required');
    }

    // Get pending setup
    const setupDoc = await db.collection('2fa_setup').doc(auth.uid).get();
    const setup = setupDoc.data();

    if (!setup) {
      throw new HttpsError('not-found', '2FA setup not found. Please start again.');
    }

    // Check expiration
    if (Date.now() > setup.expiresAt) {
      await db.collection('2fa_setup').doc(auth.uid).delete();
      throw new HttpsError('deadline-exceeded', 'Code expiré. Veuillez recommencer.');
    }

    // Verify code
    if (setup.code !== code) {
      throw new HttpsError('invalid-argument', 'Code incorrect');
    }

    // Generate backup codes
    const backupCodes = Array.from({ length: 10 }, () => generateBackupCode());

    // Hash backup codes before storing
    const hashedBackupCodes = backupCodes.map(c =>
      crypto.createHash('sha256').update(c).digest('hex')
    );

    // Enable 2FA on user account
    await db.collection('users').doc(auth.uid).update({
      twoFactorEnabled: true,
      twoFactorMethod: setup.method,
      twoFactorEnabledAt: admin.firestore.FieldValue.serverTimestamp()
    });

    // Store backup codes
    await db.collection('2fa_backup_codes').doc(auth.uid).set({
      codes: hashedBackupCodes,
      usedCodes: [],
      createdAt: admin.firestore.FieldValue.serverTimestamp()
    });

    // Cleanup setup doc
    await db.collection('2fa_setup').doc(auth.uid).delete();

    console.log(`🔒 2FA enabled for user ${auth.uid}`);

    return {
      success: true,
      backupCodes, // Return plain backup codes once for user to save
      message: '2FA activé avec succès. Conservez vos codes de secours en lieu sûr.'
    };
  }
);

/**
 * Send 2FA verification code for login
 */
export const send2FACode = onCall(
  { region: 'us-central1' },
  async (request) => {
    const { auth, data } = request;

    if (!auth) {
      throw new HttpsError('unauthenticated', 'Must be logged in');
    }

    // Get user info
    const userDoc = await db.collection('users').doc(auth.uid).get();
    const user = userDoc.data();

    if (!user?.twoFactorEnabled) {
      throw new HttpsError('failed-precondition', '2FA not enabled');
    }

    // Generate code
    const code = generateVerificationCode();
    const expiresAt = Date.now() + 5 * 60 * 1000; // 5 minutes

    // Store code
    await db.collection('2fa_codes').doc(auth.uid).set({
      code,
      expiresAt,
      attempts: 0,
      createdAt: admin.firestore.FieldValue.serverTimestamp()
    });

    // Send code
    if (user.twoFactorMethod === 'sms') {
      console.log(`📱 2FA login code for ${user.phone}: ${code}`);
    } else {
      console.log(`📧 2FA login code for ${user.email}: ${code}`);
    }

    return {
      success: true,
      method: user.twoFactorMethod
    };
  }
);

/**
 * Verify 2FA code during login
 */
export const verify2FACode = onCall(
  { region: 'us-central1' },
  async (request) => {
    const { auth, data } = request;

    if (!auth) {
      throw new HttpsError('unauthenticated', 'Must be logged in');
    }

    const { code } = data;

    if (!code) {
      throw new HttpsError('invalid-argument', 'Code required');
    }

    // Get stored code
    const codeDoc = await db.collection('2fa_codes').doc(auth.uid).get();
    const storedCode = codeDoc.data();

    if (!storedCode) {
      throw new HttpsError('not-found', 'No pending 2FA verification');
    }

    // Check attempts (max 3)
    if (storedCode.attempts >= 3) {
      await db.collection('2fa_codes').doc(auth.uid).delete();
      throw new HttpsError('resource-exhausted', 'Trop de tentatives. Veuillez recommencer.');
    }

    // Check expiration
    if (Date.now() > storedCode.expiresAt) {
      await db.collection('2fa_codes').doc(auth.uid).delete();
      throw new HttpsError('deadline-exceeded', 'Code expiré');
    }

    // Verify code
    if (storedCode.code !== code) {
      // Increment attempts
      await db.collection('2fa_codes').doc(auth.uid).update({
        attempts: admin.firestore.FieldValue.increment(1)
      });
      throw new HttpsError('invalid-argument', 'Code incorrect');
    }

    // Success - cleanup and set custom claim
    await db.collection('2fa_codes').doc(auth.uid).delete();

    // Set 2FA verified claim (valid for session)
    await admin.auth().setCustomUserClaims(auth.uid, {
      ...(await admin.auth().getUser(auth.uid)).customClaims,
      twoFactorVerified: true,
      twoFactorVerifiedAt: Date.now()
    });

    console.log(`✅ 2FA verified for user ${auth.uid}`);

    return { success: true, verified: true };
  }
);

/**
 * Use backup code
 */
export const useBackupCode = onCall(
  { region: 'us-central1' },
  async (request) => {
    const { auth, data } = request;

    if (!auth) {
      throw new HttpsError('unauthenticated', 'Must be logged in');
    }

    const { backupCode } = data;

    if (!backupCode) {
      throw new HttpsError('invalid-argument', 'Backup code required');
    }

    // Get backup codes
    const codesDoc = await db.collection('2fa_backup_codes').doc(auth.uid).get();
    const codesData = codesDoc.data();

    if (!codesData) {
      throw new HttpsError('not-found', 'No backup codes found');
    }

    // Hash the provided code
    const hashedCode = crypto.createHash('sha256').update(backupCode.toUpperCase()).digest('hex');

    // Check if code is valid and not used
    if (!codesData.codes.includes(hashedCode)) {
      throw new HttpsError('invalid-argument', 'Code de secours invalide');
    }

    if (codesData.usedCodes.includes(hashedCode)) {
      throw new HttpsError('invalid-argument', 'Ce code a déjà été utilisé');
    }

    // Mark code as used
    await db.collection('2fa_backup_codes').doc(auth.uid).update({
      usedCodes: admin.firestore.FieldValue.arrayUnion(hashedCode)
    });

    // Set 2FA verified
    await admin.auth().setCustomUserClaims(auth.uid, {
      ...(await admin.auth().getUser(auth.uid)).customClaims,
      twoFactorVerified: true,
      twoFactorVerifiedAt: Date.now()
    });

    const remainingCodes = codesData.codes.length - codesData.usedCodes.length - 1;

    console.log(`🔑 Backup code used for user ${auth.uid}. ${remainingCodes} remaining.`);

    return {
      success: true,
      remainingCodes,
      warning: remainingCodes < 3 ? 'Vous avez peu de codes de secours restants. Pensez à en régénérer.' : null
    };
  }
);

/**
 * Disable 2FA
 */
export const disable2FA = onCall(
  { region: 'us-central1' },
  async (request) => {
    const { auth, data } = request;

    if (!auth) {
      throw new HttpsError('unauthenticated', 'Must be logged in');
    }

    const { password } = data; // Require password confirmation

    // TODO: Verify password (would need to use Firebase Auth REST API)

    // Disable 2FA
    await db.collection('users').doc(auth.uid).update({
      twoFactorEnabled: false,
      twoFactorMethod: admin.firestore.FieldValue.delete(),
      twoFactorEnabledAt: admin.firestore.FieldValue.delete()
    });

    // Delete backup codes
    await db.collection('2fa_backup_codes').doc(auth.uid).delete();

    console.log(`🔓 2FA disabled for user ${auth.uid}`);

    return { success: true };
  }
);
