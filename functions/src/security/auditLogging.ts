/**
 * Audit Logging System
 * Records all critical operations for compliance and security
 */

import { onCall, HttpsError } from 'firebase-functions/v2/https';
import { onDocumentWritten, onDocumentCreated, onDocumentDeleted } from 'firebase-functions/v2/firestore';
import { onSchedule } from 'firebase-functions/v2/scheduler';
import * as admin from 'firebase-admin';

const db = admin.firestore();

/**
 * Audit log severity levels
 */
export type AuditSeverity = 'info' | 'warning' | 'critical';

/**
 * Audit log action types
 */
export type AuditAction =
  | 'user_login'
  | 'user_logout'
  | 'user_register'
  | 'user_password_change'
  | 'user_role_change'
  | 'order_created'
  | 'order_cancelled'
  | 'order_refunded'
  | 'payment_received'
  | 'payment_failed'
  | 'product_created'
  | 'product_updated'
  | 'product_deleted'
  | 'review_created'
  | 'review_deleted'
  | 'coupon_created'
  | 'coupon_used'
  | 'vendor_payout'
  | 'admin_action'
  | 'security_alert';

/**
 * Create an audit log entry
 */
export async function createAuditLog(params: {
  userId?: string;
  action: AuditAction;
  severity: AuditSeverity;
  resourceType?: string;
  resourceId?: string;
  details?: Record<string, any>;
  ip?: string;
  userAgent?: string;
}): Promise<string> {
  const {
    userId,
    action,
    severity,
    resourceType,
    resourceId,
    details,
    ip,
    userAgent
  } = params;

  const auditLog = {
    userId: userId || 'system',
    action,
    severity,
    resourceType: resourceType || null,
    resourceId: resourceId || null,
    details: details || {},
    ip: ip || null,
    userAgent: userAgent || null,
    timestamp: admin.firestore.FieldValue.serverTimestamp(),
    processed: false
  };

  const docRef = await db.collection('auditLogs').add(auditLog);

  // Log critical events to console for immediate visibility
  if (severity === 'critical') {
    console.error(`🚨 CRITICAL AUDIT: ${action}`, {
      userId,
      resourceType,
      resourceId,
      details
    });
  }

  return docRef.id;
}

/**
 * Log order changes
 */
export const auditOrderChanges = onDocumentWritten(
  {
    document: 'orders/{orderId}',
    region: 'us-central1'
  },
  async (event) => {
    const before = event.data?.before.data();
    const after = event.data?.after.data();
    const orderId = event.params.orderId;

    // New order
    if (!before && after) {
      await createAuditLog({
        userId: after.userId,
        action: 'order_created',
        severity: 'info',
        resourceType: 'order',
        resourceId: orderId,
        details: {
          total: after.total,
          itemCount: after.items?.length || 0,
          paymentMethod: after.paymentMethod
        }
      });
    }

    // Order cancelled
    if (before?.status !== 'cancelled' && after?.status === 'cancelled') {
      await createAuditLog({
        userId: after.userId,
        action: 'order_cancelled',
        severity: 'warning',
        resourceType: 'order',
        resourceId: orderId,
        details: {
          previousStatus: before.status,
          total: after.total,
          cancelReason: after.cancelReason || 'Unknown'
        }
      });
    }

    // Order refunded
    if (before?.paymentStatus !== 'refunded' && after?.paymentStatus === 'refunded') {
      await createAuditLog({
        userId: after.userId,
        action: 'order_refunded',
        severity: 'critical',
        resourceType: 'order',
        resourceId: orderId,
        details: {
          total: after.total,
          refundAmount: after.refundAmount || after.total
        }
      });
    }

    // Payment received
    if (before?.paymentStatus !== 'completed' && after?.paymentStatus === 'completed') {
      await createAuditLog({
        userId: after.userId,
        action: 'payment_received',
        severity: 'info',
        resourceType: 'order',
        resourceId: orderId,
        details: {
          total: after.total,
          paymentMethod: after.paymentMethod
        }
      });
    }

    // Payment failed
    if (before?.paymentStatus !== 'failed' && after?.paymentStatus === 'failed') {
      await createAuditLog({
        userId: after.userId,
        action: 'payment_failed',
        severity: 'warning',
        resourceType: 'order',
        resourceId: orderId,
        details: {
          total: after.total,
          paymentMethod: after.paymentMethod,
          errorMessage: after.paymentError || 'Unknown error'
        }
      });
    }
  }
);

/**
 * Log user role changes
 */
export const auditUserRoleChanges = onDocumentWritten(
  {
    document: 'users/{userId}',
    region: 'us-central1'
  },
  async (event) => {
    const before = event.data?.before.data();
    const after = event.data?.after.data();
    const userId = event.params.userId;

    // Role change
    if (before?.role && after?.role && before.role !== after.role) {
      await createAuditLog({
        userId,
        action: 'user_role_change',
        severity: 'critical',
        resourceType: 'user',
        resourceId: userId,
        details: {
          previousRole: before.role,
          newRole: after.role
        }
      });
    }

    // New user registration
    if (!before && after) {
      await createAuditLog({
        userId,
        action: 'user_register',
        severity: 'info',
        resourceType: 'user',
        resourceId: userId,
        details: {
          role: after.role,
          email: after.email
        }
      });
    }
  }
);

/**
 * Log product deletions
 */
export const auditProductDeletion = onDocumentDeleted(
  {
    document: 'products/{productId}',
    region: 'us-central1'
  },
  async (event) => {
    const product = event.data?.data();
    const productId = event.params.productId;

    await createAuditLog({
      userId: product?.vendorId,
      action: 'product_deleted',
      severity: 'warning',
      resourceType: 'product',
      resourceId: productId,
      details: {
        name: product?.name,
        price: product?.price,
        vendorId: product?.vendorId
      }
    });
  }
);

/**
 * Log vendor payouts
 */
export const auditVendorPayout = onDocumentCreated(
  {
    document: 'payouts/{payoutId}',
    region: 'us-central1'
  },
  async (event) => {
    const payout = event.data?.data();
    const payoutId = event.params.payoutId;

    await createAuditLog({
      userId: payout?.vendorId,
      action: 'vendor_payout',
      severity: 'critical',
      resourceType: 'payout',
      resourceId: payoutId,
      details: {
        amount: payout?.amount,
        method: payout?.method,
        vendorId: payout?.vendorId
      }
    });
  }
);

/**
 * Get audit logs (admin only)
 */
export const getAuditLogs = onCall(
  { region: 'us-central1' },
  async (request) => {
    const { auth, data } = request;

    if (!auth) {
      throw new HttpsError('unauthenticated', 'Must be logged in');
    }

    // Verify admin role
    const userDoc = await db.collection('users').doc(auth.uid).get();
    const user = userDoc.data();

    if (user?.role !== 'admin') {
      throw new HttpsError('permission-denied', 'Admin access required');
    }

    const {
      action,
      severity,
      userId,
      resourceType,
      startDate,
      endDate,
      limit = 100
    } = data;

    let query: admin.firestore.Query = db.collection('auditLogs');

    if (action) {
      query = query.where('action', '==', action);
    }
    if (severity) {
      query = query.where('severity', '==', severity);
    }
    if (userId) {
      query = query.where('userId', '==', userId);
    }
    if (resourceType) {
      query = query.where('resourceType', '==', resourceType);
    }
    if (startDate) {
      query = query.where('timestamp', '>=', admin.firestore.Timestamp.fromDate(new Date(startDate)));
    }
    if (endDate) {
      query = query.where('timestamp', '<=', admin.firestore.Timestamp.fromDate(new Date(endDate)));
    }

    query = query.orderBy('timestamp', 'desc').limit(limit);

    const logsSnapshot = await query.get();

    const logs = logsSnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }));

    return { logs };
  }
);

/**
 * Archive old audit logs (runs monthly)
 */
export const archiveOldAuditLogs = onSchedule(
  {
    schedule: '0 0 1 * *', // 1st of each month
    region: 'us-central1',
    timeZone: 'America/Port-au-Prince'
  },
  async () => {
    const threeMonthsAgo = new Date();
    threeMonthsAgo.setMonth(threeMonthsAgo.getMonth() - 3);

    const oldLogs = await db
      .collection('auditLogs')
      .where('timestamp', '<', admin.firestore.Timestamp.fromDate(threeMonthsAgo))
      .where('severity', '!=', 'critical') // Keep critical logs
      .limit(500)
      .get();

    // Archive to a separate collection (could also export to BigQuery)
    const batch = db.batch();

    for (const doc of oldLogs.docs) {
      const archiveRef = db.collection('auditLogs_archive').doc(doc.id);
      batch.set(archiveRef, doc.data());
      batch.delete(doc.ref);
    }

    await batch.commit();

    console.log(`📦 Archived ${oldLogs.size} old audit logs`);
  }
);
