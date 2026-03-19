/**
 * Review Routes
 */

const express = require('express');
const { PrismaClient } = require('@prisma/client');
const { authenticate, requireAdmin } = require('../middleware/auth');
const { AppError } = require('../middleware/errorHandler');

const router = express.Router();
const prisma = new PrismaClient();

// Get product reviews
router.get('/product/:productId', async (req, res, next) => {
  try {
    const { page = 1, limit = 10 } = req.query;
    
    const [reviews, total] = await Promise.all([
      prisma.review.findMany({
        where: { productId: req.params.productId, isApproved: true },
        skip: (parseInt(page) - 1) * parseInt(limit),
        take: parseInt(limit),
        orderBy: { createdAt: 'desc' },
        include: {
          user: { select: { firstName: true, lastName: true, avatar: true } },
        },
      }),
      prisma.review.count({ where: { productId: req.params.productId, isApproved: true } }),
    ]);

    res.json({
      reviews,
      pagination: { page: parseInt(page), limit: parseInt(limit), total, pages: Math.ceil(total / parseInt(limit)) },
    });
  } catch (error) {
    next(error);
  }
});

// Create review
router.post('/', authenticate, async (req, res, next) => {
  try {
    const { productId, rating, title, comment, images } = req.body;

    // Check if user bought the product
    const orderItem = await prisma.orderItem.findFirst({
      where: {
        productId,
        order: {
          userId: req.user.id,
          status: 'DELIVERED',
        },
      },
    });

    const review = await prisma.review.create({
      data: {
        userId: req.user.id,
        productId,
        rating,
        title,
        comment,
        images: images || [],
        isVerified: !!orderItem,
        isApproved: true, // Auto-approve for now
      },
    });

    // Update product rating
    const stats = await prisma.review.aggregate({
      where: { productId, isApproved: true },
      _avg: { rating: true },
      _count: true,
    });

    await prisma.product.update({
      where: { id: productId },
      data: {
        rating: stats._avg.rating || 0,
        reviewCount: stats._count,
      },
    });

    res.status(201).json({ message: 'Avis publié', review });
  } catch (error) {
    if (error.code === 'P2002') {
      throw new AppError('Vous avez déjà laissé un avis pour ce produit', 400);
    }
    next(error);
  }
});

// Delete review
router.delete('/:id', authenticate, async (req, res, next) => {
  try {
    const review = await prisma.review.findFirst({
      where: {
        id: req.params.id,
        ...(req.user.role !== 'ADMIN' && { userId: req.user.id }),
      },
    });

    if (!review) {
      throw new AppError('Avis non trouvé', 404);
    }

    await prisma.review.delete({ where: { id: req.params.id } });

    // Update product rating
    const stats = await prisma.review.aggregate({
      where: { productId: review.productId, isApproved: true },
      _avg: { rating: true },
      _count: true,
    });

    await prisma.product.update({
      where: { id: review.productId },
      data: {
        rating: stats._avg.rating || 0,
        reviewCount: stats._count,
      },
    });

    res.json({ message: 'Avis supprimé' });
  } catch (error) {
    next(error);
  }
});

// Admin: Pending reviews
router.get('/pending', authenticate, requireAdmin, async (req, res, next) => {
  try {
    const reviews = await prisma.review.findMany({
      where: { isApproved: false },
      include: {
        user: { select: { firstName: true, lastName: true } },
        product: { select: { title: true, slug: true } },
      },
      orderBy: { createdAt: 'asc' },
    });
    res.json({ reviews });
  } catch (error) {
    next(error);
  }
});

// Admin: Approve review
router.post('/:id/approve', authenticate, requireAdmin, async (req, res, next) => {
  try {
    const review = await prisma.review.update({
      where: { id: req.params.id },
      data: { isApproved: true },
    });
    res.json({ message: 'Avis approuvé', review });
  } catch (error) {
    next(error);
  }
});

module.exports = router;
