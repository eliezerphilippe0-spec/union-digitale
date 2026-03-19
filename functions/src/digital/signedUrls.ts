/**
 * Signed URLs for Digital Files
 * Generates temporary, secure download links for purchased digital products
 */

import * as functions from 'firebase-functions';
import * as admin from 'firebase-admin';

const db = admin.firestore();
const storage = admin.storage();

interface DownloadRequest {
  fileId: string;
  productId: string;
}

interface SignedUrlResponse {
  success: boolean;
  url?: string;
  expiresAt?: number;
  error?: string;
}

/**
 * Generate a signed URL for a digital file download
 * Only works if user has purchased the product
 */
export const getSignedDownloadUrl = functions.https.onCall(
  async (data: DownloadRequest, context): Promise<SignedUrlResponse> => {
    // Auth check
    if (!context.auth) {
      return { success: false, error: 'Authentication required' };
    }

    const userId = context.auth.uid;
    const { fileId, productId } = data;

    if (!fileId || !productId) {
      return { success: false, error: 'fileId and productId required' };
    }

    try {
      // Verify purchase
      const purchaseId = `${userId}_${productId}`;
      const purchaseDoc = await db.collection('purchases').doc(purchaseId).get();

      if (!purchaseDoc.exists) {
        // Also check orders for the product
        const ordersQuery = await db
          .collection('orders')
          .where('userId', '==', userId)
          .where('status', 'in', ['completed', 'delivered'])
          .get();

        let hasPurchased = false;
        for (const order of ordersQuery.docs) {
          const items = order.data().items || [];
          if (items.some((item: any) => item.productId === productId)) {
            hasPurchased = true;
            break;
          }
        }

        if (!hasPurchased) {
          // Log unauthorized attempt
          await db.collection('security_logs').add({
            type: 'unauthorized_download_attempt',
            userId,
            fileId,
            productId,
            timestamp: admin.firestore.FieldValue.serverTimestamp(),
            ip: context.rawRequest?.ip || 'unknown',
          });

          return { success: false, error: 'Purchase not found' };
        }
      }

      // Get file metadata
      const fileDoc = await db.collection('digital_files').doc(fileId).get();
      if (!fileDoc.exists) {
        return { success: false, error: 'File not found' };
      }

      const fileData = fileDoc.data()!;
      const storagePath = fileData.storagePath;

      if (!storagePath) {
        return { success: false, error: 'File path not configured' };
      }

      // Generate signed URL (valid for 1 hour)
      const bucket = storage.bucket();
      const file = bucket.file(storagePath);

      const expiresAt = Date.now() + 60 * 60 * 1000; // 1 hour

      const [signedUrl] = await file.getSignedUrl({
        version: 'v4',
        action: 'read',
        expires: expiresAt,
        // Add custom headers for tracking
        extensionHeaders: {
          'x-goog-custom-audit': `user:${userId},file:${fileId}`,
        },
      });

      // Log download
      await db.collection('download_logs').add({
        userId,
        fileId,
        productId,
        timestamp: admin.firestore.FieldValue.serverTimestamp(),
        expiresAt: new Date(expiresAt),
      });

      // Update download count
      await db.collection('digital_files').doc(fileId).update({
        downloadCount: admin.firestore.FieldValue.increment(1),
        lastDownloadAt: admin.firestore.FieldValue.serverTimestamp(),
      });

      return {
        success: true,
        url: signedUrl,
        expiresAt,
      };
    } catch (error: any) {
      console.error('Error generating signed URL:', error);
      return { success: false, error: 'Failed to generate download link' };
    }
  }
);

/**
 * Batch generate signed URLs for all files in an order
 */
export const getOrderDownloadUrls = functions.https.onCall(
  async (data: { orderId: string }, context): Promise<{ success: boolean; files?: any[]; error?: string }> => {
    if (!context.auth) {
      return { success: false, error: 'Authentication required' };
    }

    const userId = context.auth.uid;
    const { orderId } = data;

    try {
      // Get order and verify ownership
      const orderDoc = await db.collection('orders').doc(orderId).get();
      if (!orderDoc.exists) {
        return { success: false, error: 'Order not found' };
      }

      const order = orderDoc.data()!;
      if (order.userId !== userId) {
        return { success: false, error: 'Access denied' };
      }

      if (!['completed', 'delivered'].includes(order.status)) {
        return { success: false, error: 'Order not yet completed' };
      }

      // Get digital items
      const digitalItems = (order.items || []).filter(
        (item: any) => item.type === 'digital' || item.isDigital
      );

      if (digitalItems.length === 0) {
        return { success: true, files: [] };
      }

      // Generate URLs for each file
      const files = [];
      const bucket = storage.bucket();
      const expiresAt = Date.now() + 60 * 60 * 1000;

      for (const item of digitalItems) {
        const filesQuery = await db
          .collection('digital_files')
          .where('productId', '==', item.productId)
          .get();

        for (const fileDoc of filesQuery.docs) {
          const fileData = fileDoc.data();
          if (fileData.storagePath) {
            try {
              const [signedUrl] = await bucket.file(fileData.storagePath).getSignedUrl({
                version: 'v4',
                action: 'read',
                expires: expiresAt,
              });

              files.push({
                fileId: fileDoc.id,
                name: fileData.name || fileData.fileName,
                type: fileData.fileType || 'file',
                size: fileData.size,
                url: signedUrl,
                expiresAt,
              });
            } catch (e) {
              console.error(`Failed to sign URL for file ${fileDoc.id}:`, e);
            }
          }
        }
      }

      return { success: true, files };
    } catch (error: any) {
      console.error('Error getting order downloads:', error);
      return { success: false, error: 'Failed to get download links' };
    }
  }
);
