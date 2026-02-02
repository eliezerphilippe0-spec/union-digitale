import React from 'react';
import { InstantSearch, SearchBox, Hits, Configure, RefinementList, Stats, Pagination } from 'react-instantsearch';
import { searchClient } from '../../lib/algolia';
import { Link } from 'react-router-dom';
import { ShoppingCart, Star } from 'lucide-react';

/**
 * Product Hit Component - Displays individual search result
 */
function ProductHit({ hit }) {
  return (
    <Link
      to={`/product/${hit.objectID}`}
      className="block bg-white rounded-lg shadow-sm hover:shadow-md transition-shadow p-4"
    >
      <div className="flex gap-4">
        {/* Product Image */}
        <div className="w-24 h-24 flex-shrink-0">
          <img
            src={hit.imageUrl || '/placeholder-product.png'}
            alt={hit.name}
            className="w-full h-full object-cover rounded-md"
            loading="lazy"
          />
        </div>

        {/* Product Info */}
        <div className="flex-1 min-w-0">
          {/* Product Name (highlighted by Algolia) */}
          <h3
            className="font-semibold text-gray-900 mb-1 truncate"
            dangerouslySetInnerHTML={{ __html: hit._highlightResult?.name?.value || hit.name }}
          />

          {/* Brand & Category */}
          <div className="flex items-center gap-2 text-sm text-gray-600 mb-2">
            {hit.brand && <span className="font-medium">{hit.brand}</span>}
            {hit.brand && hit.category && <span>•</span>}
            {hit.category && <span>{hit.category}</span>}
          </div>

          {/* Rating */}
          {hit.rating > 0 && (
            <div className="flex items-center gap-1 mb-2">
              <Star className="w-4 h-4 fill-yellow-400 text-yellow-400" />
              <span className="text-sm font-medium">{hit.rating.toFixed(1)}</span>
              <span className="text-sm text-gray-500">({hit.reviewCount || 0})</span>
            </div>
          )}

          {/* Price & Stock */}
          <div className="flex items-center justify-between">
            <span className="text-lg font-bold text-primary-600">
              {hit.price.toLocaleString()} HTG
            </span>
            {hit.stock > 0 ? (
              <span className="text-xs text-green-600 font-medium">
                En stock
              </span>
            ) : (
              <span className="text-xs text-red-600 font-medium">
                Rupture
              </span>
            )}
          </div>
        </div>
      </div>
    </Link>
  );
}

/**
 * Algolia-powered Search Bar Component
 * Features: instant search, typo-tolerance, faceted filtering
 */
export default function AlgoliaSearchBar({ onClose }) {
  // If Algolia not configured, show fallback
  if (!searchClient) {
    return (
      <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 text-center">
        <p className="text-yellow-800">
          🔍 Recherche avancée non configurée. Veuillez configurer Algolia.
        </p>
      </div>
    );
  }

  return (
    <InstantSearch searchClient={searchClient} indexName="products">
      {/* Configure default query params */}
      <Configure hitsPerPage={20} />

      <div className="bg-white rounded-lg shadow-xl max-w-6xl mx-auto">
        {/* Search Header */}
        <div className="p-6 border-b border-gray-200">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-2xl font-bold text-gray-900">Rechercher des produits</h2>
            {onClose && (
              <button
                onClick={onClose}
                className="text-gray-500 hover:text-gray-700 text-2xl"
              >
                ×
              </button>
            )}
          </div>

          {/* Search Box */}
          <SearchBox
            placeholder="Rechercher par nom, marque, catégorie..."
            classNames={{
              root: 'relative',
              form: 'relative',
              input: 'w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:border-primary-500 focus:ring-2 focus:ring-primary-200 outline-none text-lg',
              submit: 'absolute right-3 top-1/2 -translate-y-1/2',
              reset: 'absolute right-12 top-1/2 -translate-y-1/2',
              submitIcon: 'w-6 h-6 text-primary-600',
              resetIcon: 'w-5 h-5 text-gray-400 hover:text-gray-600'
            }}
          />

          {/* Search Stats */}
          <Stats
            classNames={{
              root: 'mt-2 text-sm text-gray-600'
            }}
            translations={{
              rootElementText({ nbHits, processingTimeMS }) {
                return `${nbHits.toLocaleString()} résultat${nbHits > 1 ? 's' : ''} trouvé${nbHits > 1 ? 's' : ''} en ${processingTimeMS}ms`;
              }
            }}
          />
        </div>

        {/* Main Content */}
        <div className="flex">
          {/* Filters Sidebar */}
          <div className="w-64 border-r border-gray-200 p-6 space-y-6">
            {/* Category Filter */}
            <div>
              <h3 className="font-semibold text-gray-900 mb-3">Catégorie</h3>
              <RefinementList
                attribute="category"
                limit={10}
                showMore={true}
                showMoreLimit={50}
                classNames={{
                  root: 'space-y-2',
                  list: 'space-y-2',
                  item: 'text-sm',
                  label: 'flex items-center gap-2 cursor-pointer hover:text-primary-600',
                  checkbox: 'w-4 h-4 text-primary-600 rounded border-gray-300 focus:ring-primary-500',
                  labelText: 'flex-1',
                  count: 'text-xs bg-gray-100 px-2 py-1 rounded'
                }}
              />
            </div>

            {/* Brand Filter */}
            <div>
              <h3 className="font-semibold text-gray-900 mb-3">Marque</h3>
              <RefinementList
                attribute="brand"
                limit={10}
                showMore={true}
                classNames={{
                  root: 'space-y-2',
                  list: 'space-y-2',
                  item: 'text-sm',
                  label: 'flex items-center gap-2 cursor-pointer hover:text-primary-600',
                  checkbox: 'w-4 h-4 text-primary-600 rounded border-gray-300 focus:ring-primary-500',
                  labelText: 'flex-1',
                  count: 'text-xs bg-gray-100 px-2 py-1 rounded'
                }}
              />
            </div>

            {/* Subcategory Filter */}
            <div>
              <h3 className="font-semibold text-gray-900 mb-3">Sous-catégorie</h3>
              <RefinementList
                attribute="subcategory"
                limit={10}
                classNames={{
                  root: 'space-y-2',
                  list: 'space-y-2',
                  item: 'text-sm',
                  label: 'flex items-center gap-2 cursor-pointer hover:text-primary-600',
                  checkbox: 'w-4 h-4 text-primary-600 rounded border-gray-300 focus:ring-primary-500',
                  labelText: 'flex-1',
                  count: 'text-xs bg-gray-100 px-2 py-1 rounded'
                }}
              />
            </div>
          </div>

          {/* Results */}
          <div className="flex-1 p-6">
            <Hits
              hitComponent={ProductHit}
              classNames={{
                root: 'space-y-4',
                list: 'space-y-4',
                item: 'list-none'
              }}
            />

            {/* Pagination */}
            <div className="mt-8">
              <Pagination
                classNames={{
                  root: 'flex justify-center',
                  list: 'flex gap-2',
                  item: 'list-none',
                  link: 'px-4 py-2 border border-gray-300 rounded hover:bg-gray-50',
                  selectedItem: 'bg-primary-600 text-white',
                  disabledItem: 'opacity-50 cursor-not-allowed'
                }}
              />
            </div>
          </div>
        </div>
      </div>
    </InstantSearch>
  );
}
