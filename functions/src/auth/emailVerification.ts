import { onCall, HttpsError } from "firebase-functions/v2/https";
import { onDocumentCreated } from "firebase-functions/v2/firestore";
import * as admin from "firebase-admin";

const db = admin.firestore();

/**
 * Send verification email when user is created
 */
export const onUserCreated = onDocumentCreated(
  'users/{userId}',
  async (event) => {
    const userId = event.params.userId;
    const userData = event.data?.data();

    if (!userData || !userData.email) {
      console.warn(`No email found for user ${userId}`);
      return;
    }

    try {
      // Generate verification link
      const actionCodeSettings = {
        url: `${process.env.APP_URL || 'https://uniondigitale.ht'}/verify-email?userId=${userId}`,
        handleCodeInApp: true
      };

      const link = await admin.auth().generateEmailVerificationLink(
        userData.email,
        actionCodeSettings
      );

      // Send email (integrate with your email service)
      console.log(`Email verification link for ${userData.email}:`, link);

      // TODO: Send actual email via SendGrid, Mailgun, or Firebase Extensions
      // For now, log the link

      // Update user document with verification status
      await db.collection('users').doc(userId).update({
        emailVerificationSent: true,
        emailVerificationSentAt: admin.firestore.FieldValue.serverTimestamp(),
        emailVerified: false
      });

      console.log(`✅ Verification email sent to ${userData.email}`);

    } catch (error) {
      console.error(`Error sending verification email to ${userId}:`, error);
    }
  }
);

/**
 * Check if user's email is verified
 */
export const checkEmailVerified = onCall(async (request) => {
  if (!request.auth) {
    throw new HttpsError('unauthenticated', 'Must be authenticated');
  }

  const userId = request.auth.uid;

  try {
    // Check Firebase Auth verification status
    const userRecord = await admin.auth().getUser(userId);

    // Update Firestore if verification status changed
    if (userRecord.emailVerified) {
      await db.collection('users').doc(userId).update({
        emailVerified: true,
        emailVerifiedAt: admin.firestore.FieldValue.serverTimestamp()
      });
    }

    return {
      emailVerified: userRecord.emailVerified,
      email: userRecord.email
    };

  } catch (error: any) {
    console.error('Error checking email verification:', error);
    throw new HttpsError('internal', 'Failed to check verification status');
  }
});

/**
 * Resend verification email
 */
export const resendVerificationEmail = onCall(async (request) => {
  if (!request.auth) {
    throw new HttpsError('unauthenticated', 'Must be authenticated');
  }

  const userId = request.auth.uid;

  try {
    // Get user data
    const userDoc = await db.collection('users').doc(userId).get();

    if (!userDoc.exists) {
      throw new HttpsError('not-found', 'User not found');
    }

    const userData = userDoc.data();

    // Check if already verified
    const userRecord = await admin.auth().getUser(userId);

    if (userRecord.emailVerified) {
      return {
        success: true,
        alreadyVerified: true
      };
    }

    // Rate limiting: check last send time
    if (userData?.emailVerificationSentAt) {
      const lastSent = userData.emailVerificationSentAt.toDate();
      const now = new Date();
      const diffMinutes = (now.getTime() - lastSent.getTime()) / (1000 * 60);

      if (diffMinutes < 5) {
        throw new HttpsError(
          'resource-exhausted',
          `Please wait ${Math.ceil(5 - diffMinutes)} minutes before requesting another email`
        );
      }
    }

    // Generate new verification link
    const actionCodeSettings = {
      url: `${process.env.APP_URL || 'https://uniondigitale.ht'}/verify-email?userId=${userId}`,
      handleCodeInApp: true
    };

    const link = await admin.auth().generateEmailVerificationLink(
      userRecord.email!,
      actionCodeSettings
    );

    console.log(`Verification link for ${userRecord.email}:`, link);

    // TODO: Send actual email

    // Update send timestamp
    await db.collection('users').doc(userId).update({
      emailVerificationSentAt: admin.firestore.FieldValue.serverTimestamp()
    });

    return {
      success: true,
      emailSent: true
    };

  } catch (error: any) {
    if (error instanceof HttpsError) {
      throw error;
    }

    console.error('Error resending verification email:', error);
    throw new HttpsError('internal', 'Failed to resend verification email');
  }
});

/**
 * Verify seller eligibility
 * Checks email verification before allowing seller features
 */
export const verifySellerEligibility = onCall(async (request) => {
  if (!request.auth) {
    throw new HttpsError('unauthenticated', 'Must be authenticated');
  }

  const userId = request.auth.uid;

  try {
    // Check email verification
    const userRecord = await admin.auth().getUser(userId);

    if (!userRecord.emailVerified) {
      throw new HttpsError(
        'failed-precondition',
        'Email must be verified before becoming a seller'
      );
    }

    // Check user document
    const userDoc = await db.collection('users').doc(userId).get();

    if (!userDoc.exists) {
      throw new HttpsError('not-found', 'User not found');
    }

    const userData = userDoc.data();

    // Update to seller role
    await db.collection('users').doc(userId).update({
      role: 'seller',
      becameSellerAt: admin.firestore.FieldValue.serverTimestamp(),
      emailVerified: true
    });

    // Update custom claims
    await admin.auth().setCustomUserClaims(userId, {
      role: 'seller',
      sellerId: userId
    });

    console.log(`✅ User ${userId} upgraded to seller`);

    return {
      success: true,
      role: 'seller'
    };

  } catch (error: any) {
    if (error instanceof HttpsError) {
      throw error;
    }

    console.error('Error verifying seller eligibility:', error);
    throw new HttpsError('internal', 'Failed to verify eligibility');
  }
});
