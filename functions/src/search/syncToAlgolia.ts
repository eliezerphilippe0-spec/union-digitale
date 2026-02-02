import { onDocumentWritten } from 'firebase-functions/v2/firestore';
import { defineSecret } from 'firebase-functions/params';
import { algoliasearch } from 'algoliasearch';

// Define secrets for Algolia credentials
const algoliaAppId = defineSecret('ALGOLIA_APP_ID');
const algoliaAdminKey = defineSecret('ALGOLIA_ADMIN_KEY');

/**
 * Sync products to Algolia index when created, updated, or deleted
 * This enables instant full-text search with typo-tolerance
 */
export const syncProductToAlgolia = onDocumentWritten(
  {
    document: 'products/{productId}',
    secrets: [algoliaAppId, algoliaAdminKey],
    region: 'us-central1'
  },
  async (event) => {
    const productId = event.params.productId;
    const beforeData = event.data?.before.data();
    const afterData = event.data?.after.data();

    // Initialize Algolia client (v5 API)
    const client = algoliasearch(
      algoliaAppId.value(),
      algoliaAdminKey.value()
    );

    // Handle deletion
    if (!afterData) {
      console.log(`🗑️  Deleting product ${productId} from Algolia`);
      try {
        await client.deleteObject({
          indexName: 'products',
          objectID: productId
        });
      } catch (error) {
        console.error('Error deleting from Algolia:', error);
      }
      return;
    }

    // Prepare product data for Algolia
    const algoliaObject = {
      objectID: productId,
      name: afterData.name || '',
      description: afterData.description || '',
      price: afterData.price || 0,
      category: afterData.category || 'Uncategorized',
      subcategory: afterData.subcategory || '',
      brand: afterData.brand || '',
      vendorId: afterData.vendorId || '',
      vendorName: afterData.vendorName || '',
      images: afterData.images || [],
      imageUrl: afterData.images?.[0] || '',
      stock: afterData.stock || 0,
      status: afterData.status || 'active',
      tags: afterData.tags || [],
      rating: afterData.rating || 0,
      reviewCount: afterData.reviewCount || 0,
      salesCount: afterData.salesCount || 0,
      // Timestamps as Unix timestamp for sorting
      createdAt: afterData.createdAt?.toMillis() || Date.now(),
      updatedAt: afterData.updatedAt?.toMillis() || Date.now(),
      // Add searchable concatenation for better results
      _tags: [
        afterData.category,
        afterData.subcategory,
        afterData.brand,
        ...(afterData.tags || [])
      ].filter(Boolean)
    };

    // Only index active products with stock
    if (afterData.status === 'active' && (afterData.stock || 0) > 0) {
      console.log(`✅ Indexing product ${productId} to Algolia`);
      try {
        await client.saveObject({
          indexName: 'products',
          body: algoliaObject
        });
      } catch (error) {
        console.error('Error saving to Algolia:', error);
      }
    } else {
      // Remove from index if inactive or out of stock
      console.log(`⚠️  Removing inactive/out-of-stock product ${productId} from Algolia`);
      try {
        await client.deleteObject({
          indexName: 'products',
          objectID: productId
        });
      } catch (error) {
        // Ignore error if object doesn't exist
      }
    }
  }
);

/**
 * Bulk reindex all products to Algolia
 * Use this for initial setup or full reindex
 * Trigger manually by creating admin_tasks document with type: 'reindex_algolia'
 */
export const bulkReindexToAlgolia = onDocumentWritten(
  {
    document: 'admin_tasks/{taskId}',
    secrets: [algoliaAppId, algoliaAdminKey],
    region: 'us-central1'
  },
  async (event) => {
    const taskData = event.data?.after.data();

    // Only process reindex tasks
    if (taskData?.type !== 'reindex_algolia') return;

    console.log('🔄 Starting bulk reindex to Algolia...');

    const admin = await import('firebase-admin');
    const db = admin.firestore();

    // Initialize Algolia
    const client = algoliasearch(
      algoliaAppId.value(),
      algoliaAdminKey.value()
    );

    // Fetch all active products
    const productsSnapshot = await db
      .collection('products')
      .where('status', '==', 'active')
      .get();

    const algoliaObjects = productsSnapshot.docs
      .filter(doc => {
        const data = doc.data();
        return (data.stock || 0) > 0; // Only products with stock
      })
      .map(doc => {
        const data = doc.data();
        return {
          objectID: doc.id,
          name: data.name || '',
          description: data.description || '',
          price: data.price || 0,
          category: data.category || 'Uncategorized',
          subcategory: data.subcategory || '',
          brand: data.brand || '',
          vendorId: data.vendorId || '',
          vendorName: data.vendorName || '',
          images: data.images || [],
          imageUrl: data.images?.[0] || '',
          stock: data.stock || 0,
          status: data.status || 'active',
          tags: data.tags || [],
          rating: data.rating || 0,
          reviewCount: data.reviewCount || 0,
          salesCount: data.salesCount || 0,
          createdAt: data.createdAt?.toMillis() || Date.now(),
          updatedAt: data.updatedAt?.toMillis() || Date.now(),
          _tags: [
            data.category,
            data.subcategory,
            data.brand,
            ...(data.tags || [])
          ].filter(Boolean)
        };
      });

    // Save objects in batch (v5 API)
    if (algoliaObjects.length > 0) {
      try {
        await client.saveObjects({
          indexName: 'products',
          objects: algoliaObjects
        });
        console.log(`✅ Indexed ${algoliaObjects.length} products to Algolia`);
      } catch (error) {
        console.error('Error bulk indexing to Algolia:', error);
      }
    }

    // Update task status
    await event.data?.after.ref.update({
      status: 'completed',
      completedAt: admin.firestore.FieldValue.serverTimestamp(),
      productsIndexed: algoliaObjects.length
    });
  }
);
