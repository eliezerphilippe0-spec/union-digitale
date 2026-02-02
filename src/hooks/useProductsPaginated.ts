import { useInfiniteQuery } from '@tanstack/react-query';
import { collection, query, where, orderBy, limit, startAfter, getDocs, Query, DocumentData } from 'firebase/firestore';
import { db } from '../lib/firebase';

interface Product {
  id: string;
  name: string;
  description: string;
  price: number;
  category: string;
  brand?: string;
  vendorId: string;
  images: string[];
  isActive: boolean;
  createdAt: any;
}

interface UseProductsPaginatedOptions {
  category?: string;
  minPrice?: number;
  maxPrice?: number;
  sortBy?: 'createdAt' | 'price';
  sortOrder?: 'asc' | 'desc';
  pageSize?: number;
}

/**
 * Paginated products hook with infinite scroll support
 * Uses React Query for caching and automatic refetching
 */
export const useProductsPaginated = (options: UseProductsPaginatedOptions = {}) => {
  const {
    category,
    minPrice,
    maxPrice,
    sortBy = 'createdAt',
    sortOrder = 'desc',
    pageSize = 20
  } = options;

  return useInfiniteQuery({
    queryKey: ['products', category, minPrice, maxPrice, sortBy, sortOrder],
    queryFn: async ({ pageParam = null }) => {
      // Build query
      let q: Query<DocumentData> = collection(db, 'products');

      // Filter by active products
      q = query(q, where('isActive', '==', true));

      // Category filter
      if (category) {
        q = query(q, where('category', '==', category));
      }

      // Price range filters
      if (minPrice !== undefined) {
        q = query(q, where('price', '>=', minPrice));
      }
      if (maxPrice !== undefined) {
        q = query(q, where('price', '<=', maxPrice));
      }

      // Sort order
      q = query(q, orderBy(sortBy, sortOrder));

      // Pagination
      if (pageParam) {
        q = query(q, startAfter(pageParam));
      }

      q = query(q, limit(pageSize));

      // Execute query
      const snapshot = await getDocs(q);

      const products: Product[] = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      } as Product));

      // Get last document for pagination cursor
      const lastDoc = snapshot.docs[snapshot.docs.length - 1];

      return {
        products,
        nextCursor: lastDoc,
        hasMore: products.length === pageSize
      };
    },
    getNextPageParam: (lastPage) => {
      return lastPage.hasMore ? lastPage.nextCursor : undefined;
    },
    initialPageParam: null,
    staleTime: 5 * 60 * 1000, // 5 minutes
    gcTime: 10 * 60 * 1000 // 10 minutes (formerly cacheTime)
  });
};

/**
 * Search products with pagination
 */
interface UseProductSearchOptions extends UseProductsPaginatedOptions {
  searchTerm: string;
}

export const useProductSearch = (options: UseProductSearchOptions) => {
  const { searchTerm, ...paginationOptions } = options;

  return useInfiniteQuery({
    queryKey: ['products', 'search', searchTerm, paginationOptions],
    queryFn: async ({ pageParam = null }) => {
      // Build base query
      let q: Query<DocumentData> = collection(db, 'products');
      q = query(q, where('isActive', '==', true));

      // Add filters
      if (paginationOptions.category) {
        q = query(q, where('category', '==', paginationOptions.category));
      }
      if (paginationOptions.minPrice !== undefined) {
        q = query(q, where('price', '>=', paginationOptions.minPrice));
      }
      if (paginationOptions.maxPrice !== undefined) {
        q = query(q, where('price', '<=', paginationOptions.maxPrice));
      }

      // Sort
      q = query(q, orderBy(paginationOptions.sortBy || 'createdAt', paginationOptions.sortOrder || 'desc'));

      // Pagination
      if (pageParam) {
        q = query(q, startAfter(pageParam));
      }

      q = query(q, limit(paginationOptions.pageSize || 20));

      const snapshot = await getDocs(q);

      // Client-side text search (Firestore limitation)
      // In production, use Algolia for full-text search
      let products: Product[] = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      } as Product));

      if (searchTerm) {
        const term = searchTerm.toLowerCase();
        products = products.filter(product => {
          const name = (product.name || '').toLowerCase();
          const description = (product.description || '').toLowerCase();
          return name.includes(term) || description.includes(term);
        });
      }

      const lastDoc = snapshot.docs[snapshot.docs.length - 1];

      return {
        products,
        nextCursor: lastDoc,
        hasMore: snapshot.docs.length === (paginationOptions.pageSize || 20)
      };
    },
    getNextPageParam: (lastPage) => {
      return lastPage.hasMore ? lastPage.nextCursor : undefined;
    },
    enabled: searchTerm.length >= 2, // Only search if term is 2+ chars
    initialPageParam: null,
    staleTime: 2 * 60 * 1000, // 2 minutes
    gcTime: 5 * 60 * 1000 // 5 minutes
  });
};

/**
 * Vendor products with pagination
 */
export const useVendorProducts = (vendorId: string, options: UseProductsPaginatedOptions = {}) => {
  const { pageSize = 20, sortBy = 'createdAt', sortOrder = 'desc' } = options;

  return useInfiniteQuery({
    queryKey: ['products', 'vendor', vendorId, sortBy, sortOrder],
    queryFn: async ({ pageParam = null }) => {
      let q: Query<DocumentData> = collection(db, 'products');

      q = query(
        q,
        where('vendorId', '==', vendorId),
        orderBy(sortBy, sortOrder)
      );

      if (pageParam) {
        q = query(q, startAfter(pageParam));
      }

      q = query(q, limit(pageSize));

      const snapshot = await getDocs(q);

      const products: Product[] = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      } as Product));

      const lastDoc = snapshot.docs[snapshot.docs.length - 1];

      return {
        products,
        nextCursor: lastDoc,
        hasMore: products.length === pageSize
      };
    },
    getNextPageParam: (lastPage) => {
      return lastPage.hasMore ? lastPage.nextCursor : undefined;
    },
    initialPageParam: null,
    staleTime: 5 * 60 * 1000,
    gcTime: 10 * 60 * 1000
  });
};
