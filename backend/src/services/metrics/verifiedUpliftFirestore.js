const { getFirestore } = require('../../lib/firestoreAdmin');

const CACHE = new Map();
const TTL_MS = 60 * 1000;
const DEFAULT_BUDGET_MS = 1200;
const DEFAULT_MAX_DOCS = 15000;
const CHUNK_HOURS = 24;

const clamp01 = (x) => {
  if (!Number.isFinite(x)) return 0;
  return Math.max(0, Math.min(1, x));
};

const safeDiv = (a, b) => (b ? a / b : 0);

const isConvertedSubOrder = (d) => {
  if (!d) return false;
  const paymentStatus = String(d.paymentStatus || '').toUpperCase();
  const status = String(d.status || '').toUpperCase();
  if (paymentStatus === 'CONFIRMED') return true;
  return status === 'PAID' || status === 'DELIVERED' || status === 'COMPLETED';
};

const cacheGet = (key) => {
  const hit = CACHE.get(key);
  if (!hit) return null;
  if (Date.now() > hit.exp) {
    CACHE.delete(key);
    return null;
  }
  return hit.value;
};

const cacheSet = (key, value, ttlMs = TTL_MS) => {
  CACHE.set(key, { exp: Date.now() + ttlMs, value });
};

const getVerifiedMapForVendors = async (vendorIds, { STORE_KEY_MODE = 'DOC_ID' } = {}) => {
  const db = getFirestore();
  if (!db) return new Map();
  const map = new Map();
  const ids = Array.from(vendorIds);
  const chunkSize = 30;

  for (let i = 0; i < ids.length; i += chunkSize) {
    const chunk = ids.slice(i, i + chunkSize);
    if (STORE_KEY_MODE === 'DOC_ID') {
      const refs = chunk.map((id) => db.collection('stores').doc(id));
      const snaps = await db.getAll(...refs);
      snaps.forEach((s, idx) => {
        const vendorId = chunk[idx];
        map.set(vendorId, Boolean(s.exists && s.data()?.isVerifiedSeller));
      });
    } else {
      const q = db.collection('stores').where('ownerUid', 'in', chunk);
      const snap = await q.get();
      snap.docs.forEach((d) => {
        const data = d.data();
        map.set(String(data.ownerUid), Boolean(data.isVerifiedSeller));
      });
      chunk.forEach((vid) => {
        if (!map.has(vid)) map.set(vid, false);
      });
    }
  }

  return map;
};

const computeVerifiedSellerUpliftFirestore = async ({
  from,
  to,
  budgetMs = DEFAULT_BUDGET_MS,
  maxDocs = DEFAULT_MAX_DOCS,
  STORE_KEY_MODE = 'DOC_ID',
} = {}) => {
  const db = getFirestore();
  if (!db) {
    return { status: 'FIRESTORE_DISABLED', data: null };
  }

  const cacheKey = `uplift:${from?.toISOString?.() || 'from'}:${to?.toISOString?.() || 'to'}`;
  const cached = cacheGet(cacheKey);
  if (cached) return { status: 'SKIPPED_CACHED', data: cached, cache: 'HIT' };

  const started = Date.now();
  let scanned = 0;
  let cursorFrom = new Date(from);
  const end = new Date(to);

  const vendorAgg = new Map();

  while (cursorFrom < end) {
    if (Date.now() - started > budgetMs) {
      return { status: 'SKIPPED_BUDGET', data: null, scanned };
    }
    if (scanned >= maxDocs) {
      return { status: 'SKIPPED_BUDGET', data: null, scanned };
    }

    const cursorTo = new Date(Math.min(end.getTime(), cursorFrom.getTime() + CHUNK_HOURS * 3600 * 1000));
    const q = db
      .collection('orderSubs')
      .where('createdAt', '>=', cursorFrom)
      .where('createdAt', '<', cursorTo)
      .select('vendorId', 'createdAt', 'status', 'paymentStatus');

    const snap = await q.get();

    for (const doc of snap.docs) {
      scanned += 1;
      if (scanned > maxDocs) break;
      const d = doc.data();
      const vendorId = String(d.vendorId || '');
      if (!vendorId) continue;
      const agg = vendorAgg.get(vendorId) || { total: 0, converted: 0 };
      agg.total += 1;
      if (isConvertedSubOrder(d)) agg.converted += 1;
      vendorAgg.set(vendorId, agg);
    }

    cursorFrom = cursorTo;
  }

  if (vendorAgg.size === 0) {
    const emptyValue = {
      window: { from: from.toISOString(), to: to.toISOString() },
      verified: { stores: 0, subOrders: 0, converted: 0, rate: 0 },
      nonVerified: { stores: 0, subOrders: 0, converted: 0, rate: 0 },
      upliftAbs: 0,
      upliftRel: 0,
    };
    cacheSet(cacheKey, emptyValue);
    return { status: 'EMPTY', data: emptyValue, scanned, cache: 'MISS' };
  }

  const verifiedMap = await getVerifiedMapForVendors(vendorAgg.keys(), { STORE_KEY_MODE });

  let vSub = 0;
  let vConv = 0;
  let nvSub = 0;
  let nvConv = 0;

  for (const [vendorId, agg] of vendorAgg.entries()) {
    const isVerified = Boolean(verifiedMap.get(vendorId));
    if (isVerified) {
      vSub += agg.total;
      vConv += agg.converted;
    } else {
      nvSub += agg.total;
      nvConv += agg.converted;
    }
  }

  const rateV = vSub > 0 ? vConv / vSub : 0;
  const rateNV = nvSub > 0 ? nvConv / nvSub : 0;
  const data = {
    window: { from: from.toISOString(), to: to.toISOString() },
    verified: { stores: verifiedMap.size, subOrders: vSub, converted: vConv, rate: clamp01(rateV) },
    nonVerified: { stores: vendorAgg.size - verifiedMap.size, subOrders: nvSub, converted: nvConv, rate: clamp01(rateNV) },
    upliftAbs: clamp01(rateV) - clamp01(rateNV),
    upliftRel: rateNV > 0 ? safeDiv(rateV, rateNV) - 1 : 0,
  };

  cacheSet(cacheKey, data);
  return { status: 'OK', data, scanned, cache: 'MISS' };
};

module.exports = { computeVerifiedSellerUpliftFirestore };
