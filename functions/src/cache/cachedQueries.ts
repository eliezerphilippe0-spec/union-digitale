import { onCall, HttpsError } from 'firebase-functions/v2/https';
import { onDocumentWritten } from 'firebase-functions/v2/firestore';
import * as admin from 'firebase-admin';
import { getCached, CacheKeys, CacheTTL, invalidateCache } from './redisCache';
import { defineSecret } from 'firebase-functions/params';

const redisUrl = defineSecret('UPSTASH_REDIS_URL');
const redisToken = defineSecret('UPSTASH_REDIS_TOKEN');

/**
 * Get popular products with caching
 * Cache for 1 hour, invalidate on new orders
 */
export const getPopularProducts = onCall(
  {
    secrets: [redisUrl, redisToken],
    region: 'us-central1'
  },
  async (request) => {
    const { limit = 20 } = request.data;

    return await getCached(
      `${CacheKeys.POPULAR_PRODUCTS}:${limit}`,
      async () => {
        const db = admin.firestore();

        const snapshot = await db
          .collection('products')
          .where('status', '==', 'active')
          .orderBy('salesCount', 'desc')
          .limit(limit)
          .get();

        return snapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        }));
      },
      CacheTTL.POPULAR_PRODUCTS
    );
  }
);

/**
 * Get vendor statistics with caching
 * Cache for 15 minutes
 */
export const getVendorStats = onCall(
  {
    secrets: [redisUrl, redisToken],
    region: 'us-central1'
  },
  async (request) => {
    const vendorId = request.auth?.uid;

    if (!vendorId) {
      throw new HttpsError('unauthenticated', 'Must be logged in');
    }

    return await getCached(
      CacheKeys.VENDOR_STATS(vendorId),
      async () => {
        const db = admin.firestore();

        // Fetch all stats in parallel
        const [ordersSnapshot, productsSnapshot, balanceDoc, transactionsSnapshot] = await Promise.all([
          db.collection(`vendors/${vendorId}/orders`).count().get(),
          db.collection('products').where('vendorId', '==', vendorId).count().get(),
          db.collection('balances').doc(vendorId).get(),
          db.collection('transactions').where('vendorId', '==', vendorId).get()
        ]);

        const balance = balanceDoc.data();
        const totalRevenue = transactionsSnapshot.docs
          .filter(doc => doc.data().type === 'commission')
          .reduce((sum, doc) => sum + (doc.data().amount || 0), 0);

        return {
          totalOrders: ordersSnapshot.data().count,
          totalProducts: productsSnapshot.data().count,
          availableBalance: balance?.available || 0,
          pendingBalance: balance?.pending || 0,
          totalRevenue,
          lastUpdated: Date.now()
        };
      },
      CacheTTL.VENDOR_STATS
    );
  }
);

/**
 * Get products by category with caching
 * Cache for 30 minutes
 */
export const getProductsByCategory = onCall(
  {
    secrets: [redisUrl, redisToken],
    region: 'us-central1'
  },
  async (request) => {
    const { category, limit = 20, offset = 0 } = request.data;

    if (!category) {
      throw new HttpsError('invalid-argument', 'Category is required');
    }

    const cacheKey = `${CacheKeys.CATEGORY_PRODUCTS(category)}:${limit}:${offset}`;

    return await getCached(
      cacheKey,
      async () => {
        const db = admin.firestore();

        const snapshot = await db
          .collection('products')
          .where('category', '==', category)
          .where('status', '==', 'active')
          .orderBy('salesCount', 'desc')
          .limit(limit)
          .offset(offset)
          .get();

        return snapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        }));
      },
      CacheTTL.CATEGORY_PRODUCTS
    );
  }
);

/**
 * Cache invalidation triggers
 */

// Invalidate popular products cache when order is created
export const invalidatePopularOnOrder = onDocumentWritten(
  {
    document: 'orders/{orderId}',
    secrets: [redisUrl, redisToken],
    region: 'us-central1'
  },
  async (event) => {
    const afterData = event.data?.after.data();

    if (!afterData) return;

    // Invalidate popular products cache
    await invalidateCache(`${CacheKeys.POPULAR_PRODUCTS}*`);

    // Invalidate category caches for affected products
    const items = afterData.items || [];
    for (const item of items) {
      if (item.category) {
        await invalidateCache(`${CacheKeys.CATEGORY_PRODUCTS(item.category)}*`);
      }
    }

    console.log('✅ Invalidated product caches after order');
  }
);

// Invalidate vendor stats when order or transaction changes
export const invalidateVendorStatsOnChange = onDocumentWritten(
  {
    document: 'transactions/{transactionId}',
    secrets: [redisUrl, redisToken],
    region: 'us-central1'
  },
  async (event) => {
    const afterData = event.data?.after.data();

    if (!afterData) return;

    const vendorId = afterData.vendorId;

    if (vendorId) {
      await invalidateCache(CacheKeys.VENDOR_STATS(vendorId));
      console.log(`✅ Invalidated cache for vendor ${vendorId}`);
    }
  }
);

// Invalidate product cache when product is updated
export const invalidateProductOnUpdate = onDocumentWritten(
  {
    document: 'products/{productId}',
    secrets: [redisUrl, redisToken],
    region: 'us-central1'
  },
  async (event) => {
    const productId = event.params.productId;
    const afterData = event.data?.after.data();

    // Invalidate single product cache
    await invalidateCache(CacheKeys.PRODUCT(productId));

    // Invalidate category cache if category changed
    if (afterData?.category) {
      await invalidateCache(`${CacheKeys.CATEGORY_PRODUCTS(afterData.category)}*`);
    }

    // If product became popular, invalidate popular cache
    if (afterData && (afterData.salesCount || 0) > 50) {
      await invalidateCache(`${CacheKeys.POPULAR_PRODUCTS}*`);
    }

    console.log(`✅ Invalidated caches for product ${productId}`);
  }
);
