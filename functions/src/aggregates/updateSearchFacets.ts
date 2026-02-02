import { onDocumentWritten } from "firebase-functions/v2/firestore";
import * as admin from "firebase-admin";

const db = admin.firestore();

/**
 * Updates search facets aggregate when products are added/updated/deleted
 * This prevents expensive full collection scans for facet data
 */
export const onProductWritten = onDocumentWritten(
  'products/{productId}',
  async (event) => {
    console.log('Updating search facets aggregate...');

    try {
      // Query all active products
      const productsSnapshot = await db
        .collection('products')
        .where('isActive', '==', true)
        .get();

      const products = productsSnapshot.docs.map(doc => doc.data());

      // Extract unique categories
      const categories = [...new Set(
        products
          .map(p => p.category)
          .filter(Boolean)
      )].sort();

      // Extract unique brands
      const brands = [...new Set(
        products
          .map(p => p.brand)
          .filter(Boolean)
      )].sort();

      // Extract unique vendors
      const vendors = [...new Set(
        products
          .map(p => p.vendorId)
          .filter(Boolean)
      )];

      // Calculate price ranges
      const prices = products.map(p => p.price).filter(p => p > 0);
      const minPrice = prices.length > 0 ? Math.min(...prices) : 0;
      const maxPrice = prices.length > 0 ? Math.max(...prices) : 0;

      const priceStep = maxPrice > 0 ? (maxPrice - minPrice) / 5 : 0;

      const priceRanges = priceStep > 0 ? [
        { label: `${minPrice} - ${Math.round(minPrice + priceStep)}`, min: minPrice, max: minPrice + priceStep },
        { label: `${Math.round(minPrice + priceStep)} - ${Math.round(minPrice + 2 * priceStep)}`, min: minPrice + priceStep, max: minPrice + 2 * priceStep },
        { label: `${Math.round(minPrice + 2 * priceStep)} - ${Math.round(minPrice + 3 * priceStep)}`, min: minPrice + 2 * priceStep, max: minPrice + 3 * priceStep },
        { label: `${Math.round(minPrice + 3 * priceStep)} - ${Math.round(minPrice + 4 * priceStep)}`, min: minPrice + 3 * priceStep, max: minPrice + 4 * priceStep },
        { label: `${Math.round(minPrice + 4 * priceStep)}+`, min: minPrice + 4 * priceStep, max: Infinity }
      ] : [];

      // Update aggregate document
      const facetsRef = db.collection('search_facets').doc('products');

      await facetsRef.set({
        categories,
        brands,
        vendors,
        priceRanges,
        totalProducts: products.length,
        minPrice,
        maxPrice,
        updatedAt: admin.firestore.FieldValue.serverTimestamp()
      });

      console.log(`✅ Search facets updated: ${categories.length} categories, ${brands.length} brands`);

    } catch (error) {
      console.error('Error updating search facets:', error);
    }
  }
);

/**
 * Updates category statistics aggregate
 */
export const onProductCategoryChange = onDocumentWritten(
  'products/{productId}',
  async (event) => {
    const before = event.data?.before?.data();
    const after = event.data?.after?.data();

    // Only process if category changed or product deleted
    if (before?.category === after?.category && after !== undefined) {
      return;
    }

    console.log('Updating category statistics...');

    try {
      // Get all active products
      const productsSnapshot = await db
        .collection('products')
        .where('isActive', '==', true)
        .get();

      // Count products per category
      const categoryStats = new Map<string, number>();

      for (const doc of productsSnapshot.docs) {
        const product = doc.data();
        if (product.category) {
          categoryStats.set(
            product.category,
            (categoryStats.get(product.category) || 0) + 1
          );
        }
      }

      // Update category stats document
      const statsRef = db.collection('search_stats').doc('categories');

      const stats: any = {};
      for (const [category, count] of categoryStats) {
        stats[category] = count;
      }

      await statsRef.set({
        ...stats,
        total: productsSnapshot.size,
        updatedAt: admin.firestore.FieldValue.serverTimestamp()
      });

      console.log(`✅ Category statistics updated: ${categoryStats.size} categories`);

    } catch (error) {
      console.error('Error updating category statistics:', error);
    }
  }
);
