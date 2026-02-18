const { v4: uuidv4 } = require('uuid');
const prisma = require('../lib/prisma');
const config = require('../config');
const moncashService = require('../services/moncashService');
const natcashService = require('../services/natcashService');
const { redeemPointsOnPayment, awardCashbackAndPoints, applyEscrowAndCommission } = require('../services/paymentCompletion');

const logCronEvent = (event, payload = {}) => {
  try {
    console.log(JSON.stringify({ event, ...payload }));
  } catch (error) {
    console.log(JSON.stringify({ event, error: 'event_log_failed' }));
  }
};

const acquireJobLock = async ({ key, lockedBy, ttlMs }) => {
  const now = new Date();
  const expiresAt = new Date(now.getTime() + ttlMs);

  return prisma.$transaction(async (tx) => {
    const existing = await tx.jobLock.findUnique({ where: { key } });
    if (existing?.expiresAt && existing.expiresAt > now) {
      logCronEvent('cron_lock_conflict', { job: key, lockedBy: existing.lockedBy });
      return null;
    }

    const updated = await tx.jobLock.upsert({
      where: { key },
      update: { lockedBy, lockedAt: now, expiresAt },
      create: { key, lockedBy, lockedAt: now, expiresAt },
    });

    logCronEvent('cron_lock_acquired', { job: key, lockedBy });
    return updated;
  });
};

const releaseJobLock = async ({ key, report }) => {
  const now = new Date();
  await prisma.jobLock.update({
    where: { key },
    data: {
      expiresAt: now,
      lockedBy: null,
      lockedAt: null,
      ...(report && { lastReport: report }),
    },
  });
};

const mapWithConcurrency = async (items, limit, fn) => {
  const results = [];
  const executing = [];
  for (const item of items) {
    const p = Promise.resolve().then(() => fn(item));
    results.push(p);
    if (limit <= items.length) {
      const e = p.then(() => executing.splice(executing.indexOf(e), 1));
      executing.push(e);
      if (executing.length >= limit) {
        await Promise.race(executing);
      }
    }
  }
  return Promise.all(results);
};

const parseEventPayload = (event) => {
  if (!event) return {};
  if (typeof event === 'object' && !Array.isArray(event)) return event;
  try {
    return JSON.parse(event);
  } catch (e) {
    return {};
  }
};

const isMoncashConfirmed = (payment) => {
  if (!payment) return false;
  const status = String(payment.status || payment.transaction_status || '').toLowerCase();
  if (['completed', 'success', 'successful', 'paid'].includes(status)) return true;
  if (payment.transactionId || payment.transaction_id) return true;
  return false;
};

const isStripeConfirmed = (intent) => {
  if (!intent) return false;
  const status = String(intent.status || '').toLowerCase();
  return status === 'succeeded' || status === 'requires_capture';
};

const findRedirectCandidates = async ({ since, limit }) => {
  return prisma.$queryRaw`
    SELECT
      r.id,
      r."sessionId",
      r."eventData",
      r."createdAt",
      (r."eventData"->>'orderId') AS "orderId",
      (r."eventData"->>'orderNumber') AS "orderNumber",
      (r."eventData"->>'paymentId') AS "paymentId",
      (r."eventData"->>'paymentMethod') AS "paymentMethod"
    FROM analytics_events r
    WHERE r."eventName" = 'checkout_payment_success'
      AND (r."eventData"->>'successSource') = 'redirect'
      AND r."createdAt" >= ${since}
      AND NOT EXISTS (
        SELECT 1
        FROM analytics_events c
        WHERE c."eventName" = 'checkout_payment_success'
          AND (c."eventData"->>'successSource') = 'confirmed'
          AND c."createdAt" >= ${since}
          AND (
            c."sessionId" = r."sessionId"
            OR (c."eventData"->>'orderId') = (r."eventData"->>'orderId')
          )
      )
    ORDER BY r."createdAt" ASC
    LIMIT ${limit}
  `;
};

const confirmOrderIfNeeded = async ({ order, paymentId, paidAt, dryRun, provider, source }) => {
  if (!order) return { status: 'SKIP_NO_ORDER' };

  if (order.paymentStatus === 'PAID') {
    if (!dryRun) {
      await applyEscrowAndCommission(order);
    }
    return { status: 'ALREADY_PAID' };
  }

  if (dryRun) return { status: 'WOULD_CONFIRM' };

  const updateResult = await prisma.order.updateMany({
    where: { id: order.id, paymentStatus: { not: 'PAID' } },
    data: {
      paymentStatus: 'PAID',
      paymentId: paymentId || order.paymentId,
      paidAt: paidAt || new Date(),
      status: 'CONFIRMED',
    },
  });

  if (!updateResult.count) {
    return { status: 'ALREADY_PAID' };
  }

  const updated = {
    ...order,
    paymentStatus: 'PAID',
    paymentId: paymentId || order.paymentId,
    paidAt: paidAt || new Date(),
    status: 'CONFIRMED',
  };

  await redeemPointsOnPayment({ order: updated, paymentId: updated.paymentId || paymentId || 'UNKNOWN' });
  await awardCashbackAndPoints(updated);
  await applyEscrowAndCommission(updated);

  await prisma.store.update({
    where: { id: order.storeId },
    data: { totalSales: { increment: 1 } },
  });

  console.log(JSON.stringify({
    event: 'checkout_payment_reconciliation_fixed',
    orderId: order.id,
    orderNumber: order.orderNumber,
    provider,
    paymentId: updated.paymentId || paymentId || null,
    source: source || 'redirect',
  }));

  return { status: 'CONFIRMED', orderId: order.id };
};

const runPaymentRedirectReconcile = async ({ dryRun = false } = {}) => {
  const jobId = uuidv4();
  const startedAt = new Date();
  const lockKey = 'payment_redirect_reconcile';
  const batchSize = Number(config.PAYMENT_RECONCILE_BATCH_SIZE || 200);
  const timeBudgetMs = Number(config.PAYMENT_RECONCILE_BUDGET_MS || 60000);
  const concurrency = Number(config.PAYMENT_RECONCILE_CONCURRENCY || 5);
  const since = new Date(Date.now() - 24 * 60 * 60 * 1000);
  const lock = await acquireJobLock({ key: lockKey, lockedBy: jobId, ttlMs: 5 * 60 * 1000 });

  if (!lock) {
    return { job: lockKey, jobId, skipped: true, reason: 'LOCKED' };
  }

  const report = {
    job: lockKey,
    jobId,
    startedAt: startedAt.toISOString(),
    finishedAt: null,
    dryRun,
    scanned: 0,
    deduped: 0,
    skippedNoOrder: 0,
    checkedProvider: 0,
    alreadyPaid: 0,
    confirmed: 0,
    wouldConfirm: 0,
    ledgerFixed: 0,
    errors: 0,
  };

  try {
    const rows = await findRedirectCandidates({ since, limit: batchSize });
    report.scanned = rows.length;
    const seen = new Set();
    const candidates = [];

    for (const row of rows) {
      const payload = parseEventPayload(row.eventData);
      const orderId = row.orderId || payload.orderId || payload.order_id || null;
      const orderNumber = row.orderNumber || payload.orderNumber || payload.order_number || null;
      const key = orderId || orderNumber || row.sessionId || row.id;
      if (seen.has(key)) continue;
      seen.add(key);
      candidates.push({
        id: row.id,
        sessionId: row.sessionId,
        createdAt: row.createdAt,
        orderId,
        orderNumber,
        paymentId: row.paymentId || payload.paymentId || payload.payment_id || null,
        paymentMethod: row.paymentMethod || payload.paymentMethod || payload.payment_method || null,
      });
    }

    report.deduped = candidates.length;

    const started = Date.now();

    await mapWithConcurrency(candidates, concurrency, async (candidate) => {
      if (Date.now() - started > timeBudgetMs) return;
      try {
        const order = candidate.orderId
          ? await prisma.order.findUnique({ where: { id: candidate.orderId } })
          : (candidate.orderNumber
            ? await prisma.order.findFirst({ where: { orderNumber: candidate.orderNumber } })
            : null);

        if (!order) {
          report.skippedNoOrder += 1;
          return;
        }

        const paymentMethod = order.paymentMethod || candidate.paymentMethod;

        if (order.paymentStatus === 'PAID') {
          const result = await confirmOrderIfNeeded({ order, paymentId: order.paymentId, dryRun, provider: paymentMethod, source: 'redirect' });
          if (result.status === 'ALREADY_PAID') report.alreadyPaid += 1;
          if (result.status === 'ALREADY_PAID' && !dryRun) report.ledgerFixed += 1;
          return;
        }

        if (paymentMethod === 'MONCASH') {
          report.checkedProvider += 1;
          const payment = await moncashService.getPaymentByOrderId(order.orderNumber);
          if (isMoncashConfirmed(payment?.payment || payment)) {
            const result = await confirmOrderIfNeeded({ order, paymentId: payment?.payment?.transactionId || payment?.payment?.transaction_id || payment?.transactionId || payment?.transaction_id, paidAt: new Date(), dryRun, provider: 'moncash', source: 'redirect' });
            if (result.status === 'CONFIRMED') report.confirmed += 1;
            if (result.status === 'WOULD_CONFIRM') report.wouldConfirm += 1;
          }
          return;
        }

        if (paymentMethod === 'NATCASH') {
          const paymentId = order.paymentId || candidate.paymentId;
          if (!paymentId) return;
          report.checkedProvider += 1;
          const status = await natcashService.getPaymentStatus(paymentId);
          if (String(status?.status || '').toLowerCase() === 'completed') {
            const result = await confirmOrderIfNeeded({ order, paymentId: status.transactionId || paymentId, paidAt: status.paidAt ? new Date(status.paidAt) : new Date(), dryRun, provider: 'natcash', source: 'redirect' });
            if (result.status === 'CONFIRMED') report.confirmed += 1;
            if (result.status === 'WOULD_CONFIRM') report.wouldConfirm += 1;
          }
          return;
        }

        if (paymentMethod === 'CARD' && config.STRIPE_SECRET_KEY) {
          const paymentId = order.paymentId || candidate.paymentId;
          if (!paymentId) return;
          report.checkedProvider += 1;
          const stripe = require('stripe')(config.STRIPE_SECRET_KEY);
          const intent = await stripe.paymentIntents.retrieve(paymentId);
          if (isStripeConfirmed(intent)) {
            const result = await confirmOrderIfNeeded({ order, paymentId: intent.id || paymentId, paidAt: intent.created ? new Date(intent.created * 1000) : new Date(), dryRun, provider: 'stripe', source: 'redirect' });
            if (result.status === 'CONFIRMED') report.confirmed += 1;
            if (result.status === 'WOULD_CONFIRM') report.wouldConfirm += 1;
          }
        }
      } catch (error) {
        report.errors += 1;
      }
    });
  } finally {
    report.finishedAt = new Date().toISOString();
    await releaseJobLock({ key: lockKey, report: dryRun ? null : report });
  }

  console.log(JSON.stringify(report));
  return report;
};

const getPaymentReconcileStatus = async (key = 'payment_redirect_reconcile') => {
  return prisma.jobLock.findUnique({ where: { key } });
};

module.exports = {
  runPaymentRedirectReconcile,
  getPaymentReconcileStatus,
  acquireJobLock,
  releaseJobLock,
};
