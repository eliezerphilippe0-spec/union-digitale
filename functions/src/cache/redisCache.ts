import { Redis } from '@upstash/redis';
import { defineSecret } from 'firebase-functions/params';

// Define secrets for Redis credentials
const redisUrl = defineSecret('UPSTASH_REDIS_URL');
const redisToken = defineSecret('UPSTASH_REDIS_TOKEN');

/**
 * Get Redis client instance
 * Uses Upstash Redis for serverless-friendly caching
 */
export function getRedisClient() {
  return new Redis({
    url: redisUrl.value(),
    token: redisToken.value()
  });
}

/**
 * Cache key prefixes for organization
 */
export const CacheKeys = {
  POPULAR_PRODUCTS: 'popular_products',
  VENDOR_STATS: (vendorId: string) => `vendor_stats:${vendorId}`,
  PRODUCT: (productId: string) => `product:${productId}`,
  CATEGORY_PRODUCTS: (category: string) => `category:${category}`,
  SEARCH_RESULTS: (query: string) => `search:${query}`,
  USER_CART: (userId: string) => `cart:${userId}`,
  FLASH_SALE: 'flash_sale_products'
};

/**
 * Cache TTL (Time To Live) in seconds
 */
export const CacheTTL = {
  POPULAR_PRODUCTS: 3600, // 1 hour
  VENDOR_STATS: 900, // 15 minutes
  PRODUCT: 1800, // 30 minutes
  CATEGORY_PRODUCTS: 1800, // 30 minutes
  SEARCH_RESULTS: 900, // 15 minutes
  USER_CART: 86400, // 24 hours
  FLASH_SALE: 300 // 5 minutes
};

/**
 * Generic cache getter with fallback
 */
export async function getCached<T>(
  key: string,
  fetcher: () => Promise<T>,
  ttl: number = 3600
): Promise<T> {
  const redis = getRedisClient();

  try {
    // Try to get from cache
    const cached = await redis.get(key);

    if (cached !== null) {
      console.log(`✅ Cache HIT: ${key}`);
      return cached as T;
    }

    console.log(`❌ Cache MISS: ${key}`);

    // Fetch fresh data
    const freshData = await fetcher();

    // Store in cache
    await redis.setex(key, ttl, JSON.stringify(freshData));

    return freshData;
  } catch (error) {
    console.error(`Redis error for key ${key}:`, error);
    // Fallback to fetcher if Redis fails
    return await fetcher();
  }
}

/**
 * Invalidate cache by key or pattern
 */
export async function invalidateCache(keyOrPattern: string): Promise<void> {
  const redis = getRedisClient();

  try {
    // If pattern (contains *), scan and delete all matching keys
    if (keyOrPattern.includes('*')) {
      const keys = await redis.keys(keyOrPattern);
      if (keys.length > 0) {
        await redis.del(...keys);
        console.log(`🗑️  Invalidated ${keys.length} cache keys matching ${keyOrPattern}`);
      }
    } else {
      // Single key deletion
      await redis.del(keyOrPattern);
      console.log(`🗑️  Invalidated cache key: ${keyOrPattern}`);
    }
  } catch (error) {
    console.error(`Failed to invalidate cache ${keyOrPattern}:`, error);
  }
}

/**
 * Set cache with TTL
 */
export async function setCache(
  key: string,
  value: any,
  ttl: number
): Promise<void> {
  const redis = getRedisClient();

  try {
    await redis.setex(key, ttl, JSON.stringify(value));
    console.log(`💾 Cached: ${key} (TTL: ${ttl}s)`);
  } catch (error) {
    console.error(`Failed to set cache ${key}:`, error);
  }
}

/**
 * Get cache without automatic fallback
 */
export async function getCache<T>(key: string): Promise<T | null> {
  const redis = getRedisClient();

  try {
    const value = await redis.get(key);
    return value as T | null;
  } catch (error) {
    console.error(`Failed to get cache ${key}:`, error);
    return null;
  }
}

/**
 * Increment counter in cache (useful for rate limiting, analytics)
 */
export async function incrementCache(
  key: string,
  ttl?: number
): Promise<number> {
  const redis = getRedisClient();

  try {
    const newValue = await redis.incr(key);

    // Set expiry if specified and this is first increment
    if (ttl && newValue === 1) {
      await redis.expire(key, ttl);
    }

    return newValue;
  } catch (error) {
    console.error(`Failed to increment cache ${key}:`, error);
    return 0;
  }
}
