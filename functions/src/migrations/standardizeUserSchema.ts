import * as admin from "firebase-admin";

const db = admin.firestore();

/**
 * Migration Script: Standardize User Schema
 *
 * OLD SCHEMA (inconsistent):
 * - full_name (string)
 * - role: 'customer' (string)
 * - wallet_balance: 0 (number)
 * - created_at (timestamp)
 *
 * NEW SCHEMA (standardized):
 * - displayName (string)
 * - role: 'admin' | 'seller' | 'buyer' (string)
 * - balance: { available, pending, total } (object)
 * - createdAt (timestamp)
 */

async function migrateUserSchema() {
  console.log('Starting user schema migration...');

  try {
    // Get all users
    const usersSnapshot = await db.collection('users').get();
    console.log(`Found ${usersSnapshot.size} users to migrate`);

    let migratedCount = 0;
    let skippedCount = 0;
    let errorCount = 0;

    // Process in batches of 500 (Firestore batch limit)
    const batchSize = 500;
    let batch = db.batch();
    let operationCount = 0;

    for (const doc of usersSnapshot.docs) {
      const userId = doc.id;
      const userData = doc.data();

      try {
        // Check if already migrated
        if (userData.displayName && userData.balance && typeof userData.balance === 'object') {
          console.log(`User ${userId} already migrated, skipping`);
          skippedCount++;
          continue;
        }

        // Build update object
        const updates: any = {
          updatedAt: admin.firestore.FieldValue.serverTimestamp()
        };

        // Migrate full_name -> displayName
        if (userData.full_name && !userData.displayName) {
          updates.displayName = userData.full_name;
          updates.full_name = admin.firestore.FieldValue.delete();
        } else if (!userData.displayName && userData.email) {
          // Fallback: use email prefix as displayName
          updates.displayName = userData.email.split('@')[0];
        }

        // Migrate role: 'customer' -> 'buyer'
        if (userData.role === 'customer') {
          updates.role = 'buyer';
        } else if (!userData.role) {
          updates.role = 'buyer'; // Default to buyer
        }

        // Migrate wallet_balance -> balance object
        if (typeof userData.wallet_balance === 'number' && !userData.balance) {
          updates.balance = {
            available: userData.wallet_balance || 0,
            pending: 0,
            total: userData.wallet_balance || 0
          };
          updates.wallet_balance = admin.firestore.FieldValue.delete();
        } else if (!userData.balance) {
          // No wallet_balance, create default balance
          updates.balance = {
            available: 0,
            pending: 0,
            total: 0
          };
        }

        // Migrate created_at -> createdAt
        if (userData.created_at && !userData.createdAt) {
          updates.createdAt = userData.created_at;
          updates.created_at = admin.firestore.FieldValue.delete();
        }

        // Add to batch
        batch.update(doc.ref, updates);
        operationCount++;
        migratedCount++;

        // Commit batch if we hit the limit
        if (operationCount >= batchSize) {
          await batch.commit();
          console.log(`Committed batch of ${operationCount} updates`);
          batch = db.batch();
          operationCount = 0;
        }

      } catch (error) {
        console.error(`Error migrating user ${userId}:`, error);
        errorCount++;
      }
    }

    // Commit remaining operations
    if (operationCount > 0) {
      await batch.commit();
      console.log(`Committed final batch of ${operationCount} updates`);
    }

    console.log('\n=== Migration Summary ===');
    console.log(`Total users: ${usersSnapshot.size}`);
    console.log(`Migrated: ${migratedCount}`);
    console.log(`Skipped (already migrated): ${skippedCount}`);
    console.log(`Errors: ${errorCount}`);
    console.log('========================\n');

    return {
      total: usersSnapshot.size,
      migrated: migratedCount,
      skipped: skippedCount,
      errors: errorCount
    };

  } catch (error) {
    console.error('Migration failed:', error);
    throw error;
  }
}

/**
 * Set custom claims for all existing users
 */
async function setCustomClaimsForAllUsers() {
  console.log('Setting custom claims for all users...');

  try {
    const usersSnapshot = await db.collection('users').get();
    console.log(`Found ${usersSnapshot.size} users`);

    let successCount = 0;
    let errorCount = 0;

    for (const doc of usersSnapshot.docs) {
      const userId = doc.id;
      const userData = doc.data();
      const role = userData.role || 'buyer';

      try {
        await admin.auth().setCustomUserClaims(userId, {
          role: role,
          sellerId: role === 'seller' ? userId : null
        });

        console.log(`✅ Custom claims set for ${userId}: ${role}`);
        successCount++;
      } catch (error) {
        console.error(`❌ Failed to set custom claims for ${userId}:`, error);
        errorCount++;
      }
    }

    console.log('\n=== Custom Claims Summary ===');
    console.log(`Total users: ${usersSnapshot.size}`);
    console.log(`Success: ${successCount}`);
    console.log(`Errors: ${errorCount}`);
    console.log('============================\n');

    return {
      total: usersSnapshot.size,
      success: successCount,
      errors: errorCount
    };

  } catch (error) {
    console.error('Custom claims setup failed:', error);
    throw error;
  }
}

// Run migrations if called directly
if (require.main === module) {
  (async () => {
    try {
      // Initialize Firebase Admin if not already initialized
      if (!admin.apps.length) {
        admin.initializeApp();
      }

      // Run schema migration
      await migrateUserSchema();

      // Set custom claims
      await setCustomClaimsForAllUsers();

      console.log('✅ All migrations completed successfully');
      process.exit(0);
    } catch (error) {
      console.error('❌ Migration failed:', error);
      process.exit(1);
    }
  })();
}

export { migrateUserSchema, setCustomClaimsForAllUsers };
