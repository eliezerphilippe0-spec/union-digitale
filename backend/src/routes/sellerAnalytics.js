const express = require('express');
const { PrismaClient } = require('@prisma/client');
const { authenticate, requireSeller } = require('../middleware/auth');

const prisma = new PrismaClient();
const router = express.Router();

const ALLOWED_EVENTS = new Set([
  'seller_trust_nav_click',
  'seller_trust_page_view',
  'seller_trust_timeline_expand',
  'seller_trust_timeline_item_view',
]);

const MAX_METADATA_BYTES = 10 * 1024;
const RATE_LIMIT_PER_MIN = 60;
const rateBuckets = new Map();

const validateEvent = (payload) => {
  if (!payload?.eventName || !ALLOWED_EVENTS.has(payload.eventName)) return 'Invalid eventName';
  if (!payload?.eventVersion) return 'Missing eventVersion';
  if (typeof payload.metadata !== 'object' || payload.metadata === null || Array.isArray(payload.metadata)) return 'Invalid metadata';
  const size = Buffer.byteLength(JSON.stringify(payload.metadata), 'utf8');
  if (size > MAX_METADATA_BYTES) return 'Metadata too large';
  return null;
};

const checkRateLimit = (sellerId) => {
  const now = Date.now();
  const bucket = rateBuckets.get(sellerId) || { count: 0, resetAt: now + 60 * 1000 };
  if (now > bucket.resetAt) {
    bucket.count = 0;
    bucket.resetAt = now + 60 * 1000;
  }
  bucket.count += 1;
  rateBuckets.set(sellerId, bucket);
  return bucket.count <= RATE_LIMIT_PER_MIN;
};

router.post('/analytics/event', authenticate, requireSeller, async (req, res, next) => {
  try {
    const error = validateEvent(req.body);
    if (error) return res.status(400).json({ error });

    if (!checkRateLimit(req.user.id)) return res.status(429).json({ error: 'Rate limit' });

    const store = await prisma.store.findUnique({ where: { userId: req.user.id }, select: { id: true } });
    if (!store) return res.status(404).json({ error: 'Store not found' });

    await prisma.sellerAnalyticsEvent.create({
      data: {
        sellerId: req.user.id,
        storeId: store.id,
        eventName: req.body.eventName,
        eventVersion: req.body.eventVersion,
        metadata: req.body.metadata,
      },
    });

    res.json({ ok: true });
  } catch (error) {
    next(error);
  }
});

module.exports = { router, validateEvent };
