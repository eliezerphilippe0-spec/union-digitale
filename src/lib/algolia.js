import algoliasearch from 'algoliasearch';

// Initialize Algolia client with environment variables
const algoliaAppId = import.meta.env.VITE_ALGOLIA_APP_ID;
const algoliaSearchKey = import.meta.env.VITE_ALGOLIA_SEARCH_KEY;

if (!algoliaAppId || !algoliaSearchKey) {
  console.warn('⚠️  Algolia credentials not configured. Search will be limited.');
}

// Create Algolia search client
export const searchClient = algoliaAppId && algoliaSearchKey
  ? algoliasearch(algoliaAppId, algoliaSearchKey)
  : null;

// Helper function to configure Algolia index settings
export async function configureAlgoliaIndex() {
  if (!searchClient) {
    throw new Error('Algolia client not initialized');
  }

  const index = searchClient.initIndex('products');

  // Configure index settings
  await index.setSettings({
    // Searchable attributes (in order of importance)
    searchableAttributes: [
      'name',
      'brand',
      'description',
      'category',
      'tags'
    ],

    // Attributes for faceting (filtering)
    attributesForFaceting: [
      'filterOnly(vendorId)',
      'searchable(category)',
      'searchable(subcategory)',
      'searchable(brand)',
      'status',
      'tags'
    ],

    // Custom ranking (after textual relevance)
    customRanking: [
      'desc(salesCount)',
      'desc(rating)',
      'desc(createdAt)'
    ],

    // Typo tolerance
    typoTolerance: true,
    minWordSizefor1Typo: 4,
    minWordSizefor2Typos: 8,

    // Highlighting
    attributesToHighlight: [
      'name',
      'description',
      'brand'
    ],

    // Snippeting
    attributesToSnippet: [
      'description:20'
    ],

    // Pagination
    hitsPerPage: 20,
    maxValuesPerFacet: 100,

    // Query languages
    queryLanguages: ['fr', 'ht', 'en'],
    indexLanguages: ['fr', 'ht', 'en'],

    // Relevance
    removeWordsIfNoResults: 'lastWords',
    advancedSyntax: true,
    removeStopWords: true
  });

  console.log('✅ Algolia index configured successfully');
}
