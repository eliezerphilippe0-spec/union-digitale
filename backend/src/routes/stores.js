/**
 * Store Routes
 */

const express = require('express');
const prisma = require('../lib/prisma');
const { authenticate, requireSeller, requireAdmin } = require('../middleware/auth');
const { AppError } = require('../middleware/errorHandler');
const validate = require('../middleware/validate');
const { body } = require('express-validator');

const router = express.Router();

const updateStoreRules = [
  body('name').optional().isString().isLength({ min: 2 }).withMessage('Nom invalide'),
  body('description').optional().isString().isLength({ min: 5 }).withMessage('Description invalide'),
  body('email').optional().isEmail().withMessage('Email invalide'),
  body('phone').optional().isString().isLength({ min: 6 }).withMessage('Téléphone invalide'),
  body('whatsapp').optional().isString().isLength({ min: 6 }).withMessage('WhatsApp invalide'),
  body('city').optional().isString().isLength({ min: 2 }).withMessage('Ville invalide'),
  body('department').optional().isString().isLength({ min: 2 }).withMessage('Département invalide'),
];

// Get all stores (public)
router.get('/', async (req, res, next) => {
  try {
    const { page = 1, limit = 20, search } = req.query;
    
    const where = {
      status: 'ACTIVE',
      ...(search && {
        OR: [
          { name: { contains: search, mode: 'insensitive' } },
          { description: { contains: search, mode: 'insensitive' } },
        ],
      }),
    };

    const [stores, total] = await Promise.all([
      prisma.store.findMany({
        where,
        skip: (parseInt(page) - 1) * parseInt(limit),
        take: parseInt(limit),
        orderBy: { rating: 'desc' },
        select: {
          id: true,
          name: true,
          slug: true,
          description: true,
          logo: true,
          banner: true,
          rating: true,
          reviewCount: true,
          totalSales: true,
          isVerified: true,
          city: true,
        },
      }),
      prisma.store.count({ where }),
    ]);

    res.json({
      stores,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / parseInt(limit)),
      },
    });
  } catch (error) {
    next(error);
  }
});

// Public trust badge by slug
router.get('/:slug/trust', async (req, res, next) => {
  try {
    const store = await prisma.store.findUnique({
      where: { slug: req.params.slug },
      select: { trustTier: true, payoutDelayHours: true },
    });

    if (!store) return res.status(404).json({ error: 'Store not found' });

    res.json({
      trustTier: store.trustTier,
      badge: store.trustTier === 'ELITE' ? 'Elite Seller' : store.trustTier === 'TRUSTED' ? 'Trusted Seller' : 'Seller',
      payoutDelayHours: store.payoutDelayHours,
    });
  } catch (error) {
    next(error);
  }
});

// Get store by slug (public)
router.get('/:slug', async (req, res, next) => {
  try {
    const store = await prisma.store.findUnique({
      where: { slug: req.params.slug },
      include: {
        products: {
          where: { status: 'ACTIVE' },
          take: 12,
          orderBy: { salesCount: 'desc' },
        },
        _count: { select: { products: true } },
      },
    });

    if (!store) {
      throw new AppError('Boutique non trouvée', 404);
    }

    res.json({ store });
  } catch (error) {
    next(error);
  }
});

// Get my store (seller)
router.get('/me/store', authenticate, requireSeller, async (req, res, next) => {
  try {
    const store = await prisma.store.findUnique({
      where: { userId: req.user.id },
      include: {
        _count: { select: { products: true, orders: true } },
      },
    });

    if (!store) {
      throw new AppError('Boutique non trouvée', 404);
    }

    res.json({ store });
  } catch (error) {
    next(error);
  }
});

// Update my store (seller)
// Admin commission summary
router.get('/admin/commissions/summary', authenticate, requireAdmin, async (req, res, next) => {
  try {
    const { from, to } = req.query;
    const dateFilter = {};
    if (from) dateFilter.gte = new Date(from);
    if (to) dateFilter.lte = new Date(to);

    const where = Object.keys(dateFilter).length ? { createdAt: dateFilter } : {};

    const totalAgg = await prisma.financialLedger.aggregate({
      _sum: { amountHTG: true },
      _count: { _all: true },
      where: { ...where, type: 'PLATFORM_EARN' },
    });

    const grouped = await prisma.financialLedger.groupBy({
      by: ['storeId'],
      _sum: { amountHTG: true },
      _count: { _all: true },
      where: { ...where, type: 'PLATFORM_EARN' },
      orderBy: { _sum: { amountHTG: 'desc' } },
      take: 10,
    });

    const storeIds = grouped.map(g => g.storeId);
    const stores = await prisma.store.findMany({
      where: { id: { in: storeIds } },
      select: { id: true, name: true, slug: true },
    });
    const storeMap = Object.fromEntries(stores.map(s => [s.id, s]));

    const topStores = grouped.map(g => ({
      store: storeMap[g.storeId] || { id: g.storeId, name: 'Unknown', slug: null },
      amount: g._sum.amountHTG || 0,
      count: g._count._all || 0,
    }));

    res.json({
      totalCommission: totalAgg._sum.amountHTG || 0,
      totalOrders: totalAgg._count._all || 0,
      topStores,
    });
  } catch (error) {
    next(error);
  }
});

// Admin commission export (CSV)
router.get('/admin/commissions/export', authenticate, requireAdmin, async (req, res, next) => {
  try {
    const { from, to } = req.query;
    const dateFilter = {};
    if (from) dateFilter.gte = new Date(from);
    if (to) dateFilter.lte = new Date(to);

    const where = Object.keys(dateFilter).length ? { createdAt: dateFilter } : {};

    const rows = await prisma.financialLedger.findMany({
      where: { ...where, type: 'PLATFORM_EARN' },
      include: { store: { select: { name: true, slug: true } }, order: { select: { orderNumber: true, commissionRate: true } } },
      orderBy: { createdAt: 'desc' },
    });

    const header = 'orderNumber,storeName,storeSlug,rate,amountHTG,status,createdAt';
    const lines = rows.map(r => [
      r.order?.orderNumber || '',
      (r.store?.name || '').replace(/,/g, ' '),
      r.store?.slug || '',
      r.order?.commissionRate || 0,
      r.amountHTG,
      r.status,
      r.createdAt.toISOString(),
    ].join(','));

    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', 'attachment; filename="commissions.csv"');
    res.send([header, ...lines].join('\n'));
  } catch (error) {
    next(error);
  }
});

// Seller commission summary
router.get('/me/commissions/summary', authenticate, requireSeller, async (req, res, next) => {
  try {
    const store = await prisma.store.findUnique({ where: { userId: req.user.id } });
    if (!store) throw new AppError('Boutique non trouvée', 404);

    const totalAgg = await prisma.financialLedger.aggregate({
      _sum: { amountHTG: true },
      _count: { _all: true },
      where: { storeId: store.id, type: 'PLATFORM_EARN' },
    });

    res.json({
      totalCommission: totalAgg._sum.amountHTG || 0,
      totalOrders: totalAgg._count._all || 0,
    });
  } catch (error) {
    next(error);
  }
});

// Seller commission export (CSV)
router.get('/me/commissions/export', authenticate, requireSeller, async (req, res, next) => {
  try {
    const store = await prisma.store.findUnique({ where: { userId: req.user.id } });
    if (!store) throw new AppError('Boutique non trouvée', 404);

    const rows = await prisma.financialLedger.findMany({
      where: { storeId: store.id, type: 'PLATFORM_EARN' },
      include: { order: { select: { orderNumber: true, commissionRate: true } } },
      orderBy: { createdAt: 'desc' },
    });

    const header = 'orderNumber,rate,amountHTG,status,createdAt';
    const lines = rows.map(r => [
      r.order?.orderNumber || '',
      r.order?.commissionRate || 0,
      r.amountHTG,
      r.status,
      r.createdAt.toISOString(),
    ].join(','));

    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', 'attachment; filename="my-commissions.csv"');
    res.send([header, ...lines].join('\n'));
  } catch (error) {
    next(error);
  }
});

router.put('/me/store', authenticate, requireSeller, validate(updateStoreRules), async (req, res, next) => {
  try {
    const {
      name, description, logo, banner, email, phone, whatsapp,
      address, city, department,
    } = req.body;

    const store = await prisma.store.update({
      where: { userId: req.user.id },
      data: {
        name, description, logo, banner, email, phone, whatsapp,
        address, city, department,
      },
    });

    res.json({ message: 'Boutique mise à jour', store });
  } catch (error) {
    next(error);
  }
});

// Get store stats (seller)
router.get('/me/stats', authenticate, requireSeller, async (req, res, next) => {
  try {
    const store = await prisma.store.findUnique({
      where: { userId: req.user.id },
    });

    if (!store) {
      throw new AppError('Boutique non trouvée', 404);
    }

    const [
      totalOrders,
      pendingOrders,
      totalRevenue,
      totalProducts,
      lowStockProducts,
    ] = await Promise.all([
      prisma.order.count({ where: { storeId: store.id } }),
      prisma.order.count({ where: { storeId: store.id, status: 'PENDING' } }),
      prisma.order.aggregate({
        where: { storeId: store.id, paymentStatus: 'PAID' },
        _sum: { total: true },
      }),
      prisma.product.count({ where: { storeId: store.id } }),
      prisma.$queryRaw`SELECT COUNT(*)::int AS count FROM "Product" WHERE "storeId" = ${store.id} AND "stock" <= "lowStockThreshold"`,
    ]);

    res.json({
      stats: {
        totalOrders,
        pendingOrders,
        totalRevenue: totalRevenue._sum.total || 0,
        totalProducts,
        lowStockProducts: (lowStockProducts[0]?.count || 0),
        rating: store.rating,
        reviewCount: store.reviewCount,
      },
    });
  } catch (error) {
    next(error);
  }
});

// Approve store (admin)
router.post('/:id/approve', authenticate, requireAdmin, async (req, res, next) => {
  try {
    const store = await prisma.store.update({
      where: { id: req.params.id },
      data: { status: 'ACTIVE' },
    });
    res.json({ message: 'Boutique approuvée', store });
  } catch (error) {
    next(error);
  }
});

module.exports = router;
