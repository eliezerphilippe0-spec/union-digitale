/**
 * Firestore Indexing Strategy & Query Optimization
 * Documentation for required composite indexes
 *
 * HOW TO CREATE INDEXES:
 * 1. Auto-create: Run queries in Firebase Console, it will prompt to create indexes
 * 2. Manual: Add to firestore.indexes.json
 * 3. CLI: firebase deploy --only firestore:indexes
 */

/**
 * REQUIRED COMPOSITE INDEXES
 *
 * These indexes are critical for performance at scale.
 * Without them, queries will be slow or fail entirely.
 */

export const REQUIRED_INDEXES = {
  // Products collection
  products: [
    {
      collectionGroup: 'products',
      fields: [
        { fieldPath: 'status', order: 'ASCENDING' },
        { fieldPath: 'salesCount', order: 'DESCENDING' }
      ],
      description: 'Popular products query (used in cachedQueries)'
    },
    {
      collectionGroup: 'products',
      fields: [
        { fieldPath: 'status', order: 'ASCENDING' },
        { fieldPath: 'category', order: 'ASCENDING' },
        { fieldPath: 'salesCount', order: 'DESCENDING' }
      ],
      description: 'Products by category with popularity'
    },
    {
      collectionGroup: 'products',
      fields: [
        { fieldPath: 'vendorId', order: 'ASCENDING' },
        { fieldPath: 'status', order: 'ASCENDING' },
        { fieldPath: 'createdAt', order: 'DESCENDING' }
      ],
      description: 'Vendor products (dashboard)'
    },
    {
      collectionGroup: 'products',
      fields: [
        { fieldPath: 'status', order: 'ASCENDING' },
        { fieldPath: 'createdAt', order: 'DESCENDING' }
      ],
      description: 'Recent active products'
    },
    {
      collectionGroup: 'products',
      fields: [
        { fieldPath: 'status', order: 'ASCENDING' },
        { fieldPath: 'rating', order: 'DESCENDING' }
      ],
      description: 'Top rated products'
    },
    {
      collectionGroup: 'products',
      fields: [
        { fieldPath: 'vendorId', order: 'ASCENDING' },
        { fieldPath: 'stock', order: 'ASCENDING' }
      ],
      description: 'Low stock alerts for vendors'
    }
  ],

  // Orders collection
  orders: [
    {
      collectionGroup: 'orders',
      fields: [
        { fieldPath: 'userId', order: 'ASCENDING' },
        { fieldPath: 'createdAt', order: 'DESCENDING' }
      ],
      description: 'User order history'
    },
    {
      collectionGroup: 'orders',
      fields: [
        { fieldPath: 'status', order: 'ASCENDING' },
        { fieldPath: 'createdAt', order: 'DESCENDING' }
      ],
      description: 'Orders by status (pending, completed, etc.)'
    },
    {
      collectionGroup: 'orders',
      fields: [
        { fieldPath: 'paymentStatus', order: 'ASCENDING' },
        { fieldPath: 'createdAt', order: 'DESCENDING' }
      ],
      description: 'Orders by payment status'
    }
  ],

  // Vendor order views (subcollection)
  vendorOrderViews: [
    {
      collectionGroup: 'vendorOrderViews',
      fields: [
        { fieldPath: 'vendorId', order: 'ASCENDING' },
        { fieldPath: 'orderStatus', order: 'ASCENDING' },
        { fieldPath: 'createdAt', order: 'DESCENDING' }
      ],
      description: 'Vendor dashboard orders by status'
    },
    {
      collectionGroup: 'vendorOrderViews',
      fields: [
        { fieldPath: 'vendorId', order: 'ASCENDING' },
        { fieldPath: 'createdAt', order: 'DESCENDING' }
      ],
      description: 'All vendor orders chronological'
    }
  ],

  // Reviews collection (to be created)
  reviews: [
    {
      collectionGroup: 'reviews',
      fields: [
        { fieldPath: 'productId', order: 'ASCENDING' },
        { fieldPath: 'createdAt', order: 'DESCENDING' }
      ],
      description: 'Product reviews'
    },
    {
      collectionGroup: 'reviews',
      fields: [
        { fieldPath: 'vendorId', order: 'ASCENDING' },
        { fieldPath: 'rating', order: 'DESCENDING' }
      ],
      description: 'Vendor ratings'
    },
    {
      collectionGroup: 'reviews',
      fields: [
        { fieldPath: 'userId', order: 'ASCENDING' },
        { fieldPath: 'createdAt', order: 'DESCENDING' }
      ],
      description: 'User review history'
    }
  ],

  // Messages collection (chat - to be created)
  messages: [
    {
      collectionGroup: 'messages',
      fields: [
        { fieldPath: 'conversationId', order: 'ASCENDING' },
        { fieldPath: 'createdAt', order: 'ASCENDING' }
      ],
      description: 'Chat messages in conversation'
    },
    {
      collectionGroup: 'messages',
      fields: [
        { fieldPath: 'recipientId', order: 'ASCENDING' },
        { fieldPath: 'read', order: 'ASCENDING' },
        { fieldPath: 'createdAt', order: 'DESCENDING' }
      ],
      description: 'Unread messages for user'
    }
  ],

  // Audit logs (to be created)
  auditLogs: [
    {
      collectionGroup: 'auditLogs',
      fields: [
        { fieldPath: 'userId', order: 'ASCENDING' },
        { fieldPath: 'timestamp', order: 'DESCENDING' }
      ],
      description: 'User audit trail'
    },
    {
      collectionGroup: 'auditLogs',
      fields: [
        { fieldPath: 'action', order: 'ASCENDING' },
        { fieldPath: 'timestamp', order: 'DESCENDING' }
      ],
      description: 'Audit logs by action type'
    },
    {
      collectionGroup: 'auditLogs',
      fields: [
        { fieldPath: 'severity', order: 'ASCENDING' },
        { fieldPath: 'timestamp', order: 'DESCENDING' }
      ],
      description: 'Critical actions log'
    }
  ]
};

/**
 * Query optimization helpers
 */
export const QUERY_BEST_PRACTICES = {
  // Use pagination instead of loading all results
  usePagination: true,
  defaultPageSize: 20,
  maxPageSize: 100,

  // Use cursors for efficient pagination
  useCursors: true,

  // Cache frequently accessed data
  cacheHotData: true,
  cacheTTL: {
    products: 3600, // 1 hour
    categories: 7200, // 2 hours
    vendors: 1800, // 30 minutes
    orders: 300 // 5 minutes
  },

  // Denormalize when appropriate
  denormalizeRules: [
    'Store vendorName in products for display',
    'Store product thumbnails in orders',
    'Store user displayName in reviews'
  ],

  // Avoid N+1 queries
  batchReads: true,
  maxBatchSize: 10
};

/**
 * Generate firestore.indexes.json content
 * Run this to create the indexes file
 */
export function generateIndexesJson(): string {
  const indexes: any[] = [];

  for (const [collection, indexList] of Object.entries(REQUIRED_INDEXES)) {
    for (const index of indexList) {
      indexes.push({
        collectionGroup: index.collectionGroup,
        queryScope: 'COLLECTION',
        fields: index.fields
      });
    }
  }

  return JSON.stringify({ indexes }, null, 2);
}

/**
 * Audit existing queries to find missing indexes
 * This function scans your Cloud Functions code for Firestore queries
 * and checks if they have proper indexes
 */
export async function auditQueries(): Promise<{
  indexed: string[];
  missingIndex: string[];
  recommendations: string[];
}> {
  // This would need to be implemented to scan actual queries
  // For now, return structure
  return {
    indexed: [
      'products WHERE status == active ORDER BY salesCount DESC',
      'orders WHERE userId == X ORDER BY createdAt DESC'
    ],
    missingIndex: [
      'products WHERE status == active AND category == X ORDER BY price ASC'
    ],
    recommendations: [
      'Consider adding index for products filtered by price',
      'Cache popular category queries in Redis',
      'Denormalize vendor names in products collection'
    ]
  };
}
