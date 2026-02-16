const CACHE_TTL_MS = 30 * 60 * 1000;
const memoryCache = new Map();

const getCacheKey = (slug) => `trust:${slug}`;

export const getStoreTrust = async (slug) => {
  if (!slug) return null;

  const key = getCacheKey(slug);
  const now = Date.now();

  if (memoryCache.has(key)) {
    const cached = memoryCache.get(key);
    if (now - cached.ts < CACHE_TTL_MS) return cached.data;
  }

  const fromLocal = localStorage.getItem(key);
  if (fromLocal) {
    const cached = JSON.parse(fromLocal);
    if (now - cached.ts < CACHE_TTL_MS) {
      memoryCache.set(key, cached);
      return cached.data;
    }
  }

  const baseUrl = import.meta.env.VITE_API_URL || import.meta.env.VITE_BACKEND_URL || '';
  const res = await fetch(`${baseUrl}/api/stores/${slug}/trust`);
  if (!res.ok) return null;
  const data = await res.json();
  const payload = { ts: now, data };
  memoryCache.set(key, payload);
  localStorage.setItem(key, JSON.stringify(payload));
  return data;
};
