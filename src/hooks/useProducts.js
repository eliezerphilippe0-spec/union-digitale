import { useState, useEffect, useCallback } from 'react';
import { collection, query, limit, startAfter, getDocs, onSnapshot, orderBy, where } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { products as localProducts } from '../data/products';
import { cacheService } from '../services/cacheService';

const PRODUCTS_PER_PAGE = 20;
const CACHE_KEY = 'products_catalog';
const CACHE_TTL = 5 * 60 * 1000; // 5 minutes

export const useProducts = (options = {}) => {
    const {
        pageSize = PRODUCTS_PER_PAGE,
        enableRealtime = false,
        category = null,
        useCache = true
    } = options;

    const [products, setProducts] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [hasMore, setHasMore] = useState(true);
    const [lastDoc, setLastDoc] = useState(null);

    // Fetch initial products
    useEffect(() => {
        const fetchProducts = async () => {
            try {
                // Try cache first (only if it contains products)
                if (useCache) {
                    const cached = cacheService.get(CACHE_KEY);
                    if (cached && Array.isArray(cached) && cached.length > 0) {
                        setProducts(cached);
                        setLoading(false);
                        return;
                    }
                }

                // Build query
                let q = query(
                    collection(db, 'products'),
                    orderBy('createdAt', 'desc'),
                    limit(pageSize)
                );

                if (category) {
                    q = query(q, where('category', '==', category));
                }

                const querySnapshot = await getDocs(q);
                const productsData = querySnapshot.docs.map(doc => ({
                    id: doc.id,
                    ...doc.data()
                }));

                // Set last document for pagination
                if (querySnapshot.docs.length > 0) {
                    setLastDoc(querySnapshot.docs[querySnapshot.docs.length - 1]);
                }

                // Check if there are more products
                setHasMore(querySnapshot.docs.length === pageSize);

                // Merge with local products (always include local products as base)
                const dbIds = new Set(productsData.map(p => String(p.id)));
                const localFiltered = localProducts.filter(p => !dbIds.has(String(p.id)));

                // Always include all local products + any additional from Firebase
                const mergedProducts = productsData.length > 0
                    ? [...productsData, ...localFiltered]
                    : [...localProducts]; // Use all local products if Firebase returns nothing

                setProducts(mergedProducts);

                // Cache results (only if we have products)
                if (useCache && mergedProducts.length > 0) {
                    cacheService.set(CACHE_KEY, mergedProducts, CACHE_TTL);
                }

            } catch (err) {
                console.error("Error fetching products:", err);
                // Fallback to local products
                setProducts(localProducts.slice(0, pageSize));
                setError(err);
            } finally {
                setLoading(false);
            }
        };

        fetchProducts();
    }, [category, pageSize, useCache]);

    // Real-time updates (optional)
    useEffect(() => {
        if (!enableRealtime) return;

        let q = query(
            collection(db, 'products'),
            orderBy('createdAt', 'desc'),
            limit(pageSize)
        );

        const unsubscribe = onSnapshot(q, (snapshot) => {
            const productsData = snapshot.docs.map(doc => ({
                id: doc.id,
                ...doc.data()
            }));

            setProducts(productsData);

            // Invalidate cache on real-time update
            cacheService.remove(CACHE_KEY);
        }, (err) => {
            console.error("Real-time update error:", err);
        });

        return () => unsubscribe();
    }, [enableRealtime, pageSize]);

    // Load more products (pagination)
    const loadMore = useCallback(async () => {
        if (!hasMore || loading) return;

        setLoading(true);

        try {
            let q = query(
                collection(db, 'products'),
                orderBy('createdAt', 'desc'),
                startAfter(lastDoc),
                limit(pageSize)
            );

            if (category) {
                q = query(q, where('category', '==', category));
            }

            const querySnapshot = await getDocs(q);
            const newProducts = querySnapshot.docs.map(doc => ({
                id: doc.id,
                ...doc.data()
            }));

            if (querySnapshot.docs.length > 0) {
                setLastDoc(querySnapshot.docs[querySnapshot.docs.length - 1]);
            }

            setHasMore(querySnapshot.docs.length === pageSize);
            setProducts(prev => [...prev, ...newProducts]);

        } catch (err) {
            console.error("Error loading more products:", err);
            setError(err);
        } finally {
            setLoading(false);
        }
    }, [hasMore, loading, lastDoc, pageSize, category]);

    return {
        products,
        loading,
        error,
        hasMore,
        loadMore,
        refresh: () => {
            cacheService.remove(CACHE_KEY);
            setLastDoc(null);
            setHasMore(true);
            setLoading(true);
        }
    };
};
