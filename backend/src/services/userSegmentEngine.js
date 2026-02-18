const prisma = require('../lib/prisma');

const DAYS_MS = 864e5;
const daysAgo = (days, now = new Date()) => new Date(now.getTime() - days * DAYS_MS);

const determineUserSegment = ({
  orderCount90d = 0,
  orderTotal90d = 0,
  firstPurchaseDate,
  acquisitionDate,
  cartUpdatedAt,
  now = new Date(),
} = {}) => {
  const recentWindow = daysAgo(30, now);
  const acquiredAt = acquisitionDate || now;

  if (!firstPurchaseDate) {
    if (cartUpdatedAt && cartUpdatedAt >= recentWindow) return 'HIGH_INTENT';
    if (acquiredAt >= recentWindow) return 'NEW';
    return 'HIGH_INTENT';
  }

  if (orderCount90d >= 10 || orderTotal90d >= 100000) return 'POWER';
  if (orderCount90d >= 5 || orderTotal90d >= 30000) return 'HIGH_VALUE';
  if (orderCount90d >= 2) return 'RETURNING';
  if (firstPurchaseDate >= recentWindow) return 'NEW';
  return 'RETURNING';
};

const computeUserSegmentForUser = async (userId, { now = new Date(), windowDays = 90 } = {}) => {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: {
      id: true,
      createdAt: true,
      acquisitionDate: true,
      firstPurchaseDate: true,
      userSegment: true,
    },
  });

  if (!user) throw new Error('User not found');

  const windowStart = daysAgo(windowDays, now);

  const [orderAgg, firstPaidOrder, cartItem] = await Promise.all([
    prisma.order.aggregate({
      where: {
        userId,
        paymentStatus: 'PAID',
        createdAt: { gte: windowStart },
      },
      _count: { _all: true },
      _sum: { total: true },
    }),
    prisma.order.findFirst({
      where: { userId, paymentStatus: 'PAID' },
      orderBy: { createdAt: 'asc' },
      select: { createdAt: true, paidAt: true },
    }),
    prisma.cartItem.findFirst({
      where: { userId },
      orderBy: { updatedAt: 'desc' },
      select: { updatedAt: true },
    }),
  ]);

  const computedFirstPurchase = firstPaidOrder ? (firstPaidOrder.paidAt || firstPaidOrder.createdAt) : null;
  const existingFirst = user.firstPurchaseDate;
  const firstPurchaseDate = computedFirstPurchase
    ? (existingFirst ? new Date(Math.min(existingFirst.getTime(), computedFirstPurchase.getTime())) : computedFirstPurchase)
    : existingFirst;

  const acquisitionDate = user.acquisitionDate || user.createdAt;

  const orderCount90d = Number(orderAgg?._count?._all || 0);
  const orderTotal90d = Number(orderAgg?._sum?.total || 0);

  const nextSegment = determineUserSegment({
    orderCount90d,
    orderTotal90d,
    firstPurchaseDate,
    acquisitionDate,
    cartUpdatedAt: cartItem?.updatedAt || null,
    now,
  });

  return {
    userId,
    prevSegment: user.userSegment,
    nextSegment,
    acquisitionDate,
    firstPurchaseDate,
    metrics: { orderCount90d, orderTotal90d },
  };
};

const applyUserSegment = async ({ userId, prevSegment, nextSegment, acquisitionDate, firstPurchaseDate, metrics, windowDays, reason, jobRunId }) => {
  const now = new Date();
  const changed = prevSegment !== nextSegment;

  await prisma.$transaction(async (tx) => {
    await tx.user.update({
      where: { id: userId },
      data: {
        acquisitionDate,
        firstPurchaseDate: firstPurchaseDate || undefined,
        userSegment: nextSegment,
        segmentUpdatedAt: now,
      },
    });

    if (changed) {
      await tx.userSegmentEvent.create({
        data: {
          userId,
          eventName: 'user_segment_updated',
          eventVersion: 'v1',
          fromSegment: prevSegment || null,
          toSegment: nextSegment,
          reason: reason ? String(reason).slice(0, 200) : null,
          windowDays: windowDays || null,
          computedAt: now,
          jobRunId: jobRunId || null,
          metadata: {
            prevSegment,
            nextSegment,
            metrics,
            computedAt: now.toISOString(),
          },
        },
      });
    }
  });

  return { changed, segment: nextSegment };
};

const recomputeUserSegmentForUser = async (userId, options = {}) => {
  const decision = await computeUserSegmentForUser(userId, options);
  const applied = await applyUserSegment({
    ...decision,
    windowDays: options.windowDays,
    reason: options.reason || null,
    jobRunId: options.jobRunId || null,
  });
  return { ...decision, ...applied };
};

module.exports = {
  determineUserSegment,
  computeUserSegmentForUser,
  recomputeUserSegmentForUser,
  applyUserSegment,
};
