import { onDocumentCreated } from "firebase-functions/v2/firestore";
import { onCall, HttpsError } from "firebase-functions/v2/https";
import * as admin from "firebase-admin";

/**
 * Automatically sets custom claims when a new user document is created
 * This ensures role-based access control works properly
 */
export const onUserDocumentCreated = onDocumentCreated(
  'users/{userId}',
  async (event) => {
    const userId = event.params.userId;
    const userData = event.data?.data();

    if (!userData) {
      console.warn(`No data found for user ${userId}`);
      return;
    }

    const role = userData.role || 'buyer';

    try {
      // Set custom claims in Firebase Auth
      await admin.auth().setCustomUserClaims(userId, {
        role: role,
        sellerId: role === 'seller' ? userId : null
      });

      console.log(`✅ Custom claims set for ${userId}: role=${role}`);
    } catch (error) {
      console.error(`❌ Failed to set custom claims for ${userId}:`, error);
    }
  }
);

/**
 * Callable function for admins to update user roles
 * Usage: firebase.functions().httpsCallable('setUserRole')({ userId, role })
 */
export const setUserRole = onCall(async (request) => {
  // Verify caller is admin
  if (!request.auth) {
    throw new HttpsError('unauthenticated', 'Must be authenticated');
  }

  if (request.auth.token.role !== 'admin') {
    throw new HttpsError('permission-denied', 'Only admins can set user roles');
  }

  const { userId, role } = request.data;

  // Validate inputs
  if (!userId || typeof userId !== 'string') {
    throw new HttpsError('invalid-argument', 'userId is required');
  }

  if (!role || !['admin', 'seller', 'buyer'].includes(role)) {
    throw new HttpsError('invalid-argument', 'role must be admin, seller, or buyer');
  }

  try {
    // Update custom claims
    await admin.auth().setCustomUserClaims(userId, {
      role: role,
      sellerId: role === 'seller' ? userId : null
    });

    // Update Firestore document
    await admin.firestore().collection('users').doc(userId).update({
      role: role,
      updatedAt: admin.firestore.FieldValue.serverTimestamp()
    });

    console.log(`✅ Role updated for ${userId}: ${role}`);

    return {
      success: true,
      userId,
      role
    };
  } catch (error: any) {
    console.error('Error setting user role:', error);
    throw new HttpsError('internal', error.message);
  }
});

/**
 * Callable function for users to refresh their custom claims token
 * Call this after role changes to get updated claims without signing out
 */
export const refreshCustomClaims = onCall(async (request) => {
  if (!request.auth) {
    throw new HttpsError('unauthenticated', 'Must be authenticated');
  }

  const userId = request.auth.uid;

  try {
    // Get user document
    const userDoc = await admin.firestore().collection('users').doc(userId).get();

    if (!userDoc.exists) {
      throw new HttpsError('not-found', 'User document not found');
    }

    const userData = userDoc.data();
    const role = userData?.role || 'buyer';

    // Update custom claims
    await admin.auth().setCustomUserClaims(userId, {
      role: role,
      sellerId: role === 'seller' ? userId : null
    });

    console.log(`✅ Custom claims refreshed for ${userId}: ${role}`);

    return {
      success: true,
      role
    };
  } catch (error: any) {
    console.error('Error refreshing custom claims:', error);
    throw new HttpsError('internal', error.message);
  }
});
