import React, { useRef, useCallback } from 'react';
import { useProductsPaginated } from '../hooks/useProductsPaginated';

interface ProductListPaginatedProps {
  category?: string;
  minPrice?: number;
  maxPrice?: number;
  sortBy?: 'createdAt' | 'price';
  sortOrder?: 'asc' | 'desc';
}

/**
 * Example component using infinite scroll pagination
 * Uses Intersection Observer to load more when scrolling
 */
export const ProductListPaginated: React.FC<ProductListPaginatedProps> = ({
  category,
  minPrice,
  maxPrice,
  sortBy = 'createdAt',
  sortOrder = 'desc'
}) => {
  const {
    data,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
    isLoading,
    isError,
    error
  } = useProductsPaginated({
    category,
    minPrice,
    maxPrice,
    sortBy,
    sortOrder,
    pageSize: 20
  });

  // Intersection Observer for infinite scroll
  const observerTarget = useRef<HTMLDivElement>(null);

  const handleObserver = useCallback(
    (entries: IntersectionObserverEntry[]) => {
      const [target] = entries;
      if (target.isIntersecting && hasNextPage && !isFetchingNextPage) {
        fetchNextPage();
      }
    },
    [fetchNextPage, hasNextPage, isFetchingNextPage]
  );

  React.useEffect(() => {
    const element = observerTarget.current;
    if (!element) return;

    const observer = new IntersectionObserver(handleObserver, {
      threshold: 0.1,
      rootMargin: '100px'
    });

    observer.observe(element);

    return () => observer.disconnect();
  }, [handleObserver]);

  if (isLoading) {
    return (
      <div className="flex justify-center items-center p-12">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (isError) {
    return (
      <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded">
        Error loading products: {error?.message}
      </div>
    );
  }

  const allProducts = data?.pages.flatMap(page => page.products) || [];

  if (allProducts.length === 0) {
    return (
      <div className="text-center py-12 text-gray-500">
        No products found
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Products Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
        {allProducts.map((product) => (
          <div
            key={product.id}
            className="bg-white rounded-lg shadow-md overflow-hidden hover:shadow-lg transition-shadow"
          >
            {/* Product Image */}
            <div className="aspect-square bg-gray-200 relative">
              {product.images?.[0] ? (
                <img
                  src={product.images[0]}
                  alt={product.name}
                  className="w-full h-full object-cover"
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center text-gray-400">
                  No Image
                </div>
              )}
            </div>

            {/* Product Info */}
            <div className="p-4">
              <h3 className="font-semibold text-lg mb-2 line-clamp-2">
                {product.name}
              </h3>
              <p className="text-gray-600 text-sm mb-3 line-clamp-2">
                {product.description}
              </p>
              <div className="flex items-center justify-between">
                <span className="text-xl font-bold text-blue-600">
                  {product.price} HTG
                </span>
                <span className="text-xs text-gray-500 bg-gray-100 px-2 py-1 rounded">
                  {product.category}
                </span>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Loading indicator for next page */}
      {isFetchingNextPage && (
        <div className="flex justify-center py-4">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
        </div>
      )}

      {/* Intersection Observer Target */}
      <div ref={observerTarget} className="h-10" />

      {/* End of results */}
      {!hasNextPage && allProducts.length > 0 && (
        <div className="text-center py-4 text-gray-500">
          No more products to load
        </div>
      )}

      {/* Results count */}
      <div className="text-center text-sm text-gray-500">
        Showing {allProducts.length} products
      </div>
    </div>
  );
};

export default ProductListPaginated;
