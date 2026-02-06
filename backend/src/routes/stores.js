/**
 * Store Routes
 */

const express = require('express');
const { PrismaClient } = require('@prisma/client');
const { authenticate, requireSeller, requireAdmin } = require('../middleware/auth');
const { AppError } = require('../middleware/errorHandler');

const router = express.Router();
const prisma = new PrismaClient();

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
router.put('/me/store', authenticate, requireSeller, async (req, res, next) => {
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
      prisma.product.count({
        where: {
          storeId: store.id,
          stock: { lte: prisma.product.fields.lowStockThreshold },
        },
      }),
    ]);

    res.json({
      stats: {
        totalOrders,
        pendingOrders,
        totalRevenue: totalRevenue._sum.total || 0,
        totalProducts,
        lowStockProducts,
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
