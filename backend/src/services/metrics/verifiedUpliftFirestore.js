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
  let hasSnapshot = false;
  let snapshotCovered = 0;
  let snapshotTotal = 0;

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
      .select('vendorId', 'createdAt', 'status', 'paymentStatus', 'isVerifiedSellerSnapshot');

    const snap = await q.get();

    for (const doc of snap.docs) {
      scanned += 1;
      if (scanned > maxDocs) break;
      const d = doc.data();
      const vendorId = String(d.vendorId || '');
      if (!vendorId) continue;
      if (typeof d.isVerifiedSellerSnapshot === 'boolean') hasSnapshot = true;
      const agg = vendorAgg.get(vendorId) || { total: 0, converted: 0, snapshot: null };
      agg.total += 1;
      const converted = isConvertedSubOrder(d);
      if (converted) {
        agg.converted += 1;
        snapshotTotal += 1;
        if (typeof d.isVerifiedSellerSnapshot === 'boolean') snapshotCovered += 1;
      }
      if (agg.snapshot === null && typeof d.isVerifiedSellerSnapshot === 'boolean') {
        agg.snapshot = d.isVerifiedSellerSnapshot;
      }
      vendorAgg.set(vendorId, agg);
    }

    cursorFrom = cursorTo;
  }

  if (vendorAgg.size === 0) {

    const emptyValue = {
      window: { from: from.toISOString(), to: to.toISOString() },
      status: 'EMPTY',
      counts: {
        verified: { subs: 0, converted: 0, conversionRate: 0 },
        nonVerified: { subs: 0, converted: 0, conversionRate: 0 },
      },
      uplift: { conversionDelta: null, conversionLiftPct: null },
      snapshot: { coveredCount: 0, totalCount: 0, coverageRate: 0 },
    };
    cacheSet(cacheKey, emptyValue);
    return { status: 'EMPTY', data: emptyValue, scanned, cache: 'MISS' };
  }

  let verifiedMap = null;
  let status = hasSnapshot ? 'SNAPSHOT' : 'FALLBACK_JOIN';
  if (!hasSnapshot) {
    verifiedMap = await getVerifiedMapForVendors(vendorAgg.keys(), { STORE_KEY_MODE });
  }

  let vSub = 0;
  let vConv = 0;
  let nvSub = 0;
  let nvConv = 0;

  for (const [vendorId, agg] of vendorAgg.entries()) {
    const isVerified = hasSnapshot ? Boolean(agg.snapshot) : Boolean(verifiedMap?.get(vendorId));
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
    status,
    counts: {
      verified: { subs: vSub, converted: vConv, conversionRate: clamp01(rateV) },
      nonVerified: { subs: nvSub, converted: nvConv, conversionRate: clamp01(rateNV) },
    },
    uplift: {
      conversionDelta: (vSub + nvSub) > 0 ? (clamp01(rateV) - clamp01(rateNV)) : null,
      conversionLiftPct: rateNV > 0 ? (rateV - rateNV) / rateNV : null,
    },
    snapshot: {
      coveredCount: snapshotCovered,
      totalCount: snapshotTotal,
      coverageRate: clamp01(snapshotTotal > 0 ? snapshotCovered / snapshotTotal : 0),
    },
  };

  cacheSet(cacheKey, data);
  return { status, data, scanned, cache: 'MISS' };
};

module.exports = { computeVerifiedSellerUpliftFirestore };
