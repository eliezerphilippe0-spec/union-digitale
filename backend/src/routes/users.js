/**
 * User Routes
 */

const express = require('express');
const { PrismaClient } = require('@prisma/client');
const { authenticate, requireAdmin } = require('../middleware/auth');
const { AppError } = require('../middleware/errorHandler');

const router = express.Router();
const prisma = new PrismaClient();

// Update profile
router.put('/profile', authenticate, async (req, res, next) => {
  try {
    const { firstName, lastName, phone, avatar } = req.body;
    
    const user = await prisma.user.update({
      where: { id: req.user.id },
      data: { firstName, lastName, phone, avatar },
      select: {
        id: true,
        email: true,
        phone: true,
        firstName: true,
        lastName: true,
        avatar: true,
      },
    });

    res.json({ message: 'Profil mis à jour', user });
  } catch (error) {
    next(error);
  }
});

// Get addresses
router.get('/addresses', authenticate, async (req, res, next) => {
  try {
    const addresses = await prisma.address.findMany({
      where: { userId: req.user.id },
      orderBy: [{ isDefault: 'desc' }, { createdAt: 'desc' }],
    });
    res.json({ addresses });
  } catch (error) {
    next(error);
  }
});

// Add address
router.post('/addresses', authenticate, async (req, res, next) => {
  try {
    const { label, fullName, phone, street, city, department, postalCode, instructions, isDefault } = req.body;

    // If setting as default, unset other defaults
    if (isDefault) {
      await prisma.address.updateMany({
        where: { userId: req.user.id },
        data: { isDefault: false },
      });
    }

    const address = await prisma.address.create({
      data: {
        userId: req.user.id,
        label, fullName, phone, street, city, department, postalCode, instructions, isDefault,
      },
    });

    res.status(201).json({ message: 'Adresse ajoutée', address });
  } catch (error) {
    next(error);
  }
});

// Update address
router.put('/addresses/:id', authenticate, async (req, res, next) => {
  try {
    const existing = await prisma.address.findFirst({
      where: { id: req.params.id, userId: req.user.id },
    });

    if (!existing) {
      throw new AppError('Adresse non trouvée', 404);
    }

    const { label, fullName, phone, street, city, department, postalCode, instructions, isDefault } = req.body;

    if (isDefault) {
      await prisma.address.updateMany({
        where: { userId: req.user.id },
        data: { isDefault: false },
      });
    }

    const address = await prisma.address.update({
      where: { id: req.params.id },
      data: { label, fullName, phone, street, city, department, postalCode, instructions, isDefault },
    });

    res.json({ message: 'Adresse mise à jour', address });
  } catch (error) {
    next(error);
  }
});

// Delete address
router.delete('/addresses/:id', authenticate, async (req, res, next) => {
  try {
    const existing = await prisma.address.findFirst({
      where: { id: req.params.id, userId: req.user.id },
    });

    if (!existing) {
      throw new AppError('Adresse non trouvée', 404);
    }

    await prisma.address.delete({ where: { id: req.params.id } });
    res.json({ message: 'Adresse supprimée' });
  } catch (error) {
    next(error);
  }
});

// Get favorites
router.get('/favorites', authenticate, async (req, res, next) => {
  try {
    const favorites = await prisma.favorite.findMany({
      where: { userId: req.user.id },
      include: {
        product: {
          include: {
            store: { select: { name: true, slug: true } },
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });
    res.json({ favorites: favorites.map(f => f.product) });
  } catch (error) {
    next(error);
  }
});

// Add to favorites
router.post('/favorites/:productId', authenticate, async (req, res, next) => {
  try {
    await prisma.favorite.create({
      data: {
        userId: req.user.id,
        productId: req.params.productId,
      },
    });
    res.json({ message: 'Ajouté aux favoris' });
  } catch (error) {
    if (error.code === 'P2002') {
      return res.json({ message: 'Déjà dans les favoris' });
    }
    next(error);
  }
});

// Remove from favorites
router.delete('/favorites/:productId', authenticate, async (req, res, next) => {
  try {
    await prisma.favorite.deleteMany({
      where: {
        userId: req.user.id,
        productId: req.params.productId,
      },
    });
    res.json({ message: 'Retiré des favoris' });
  } catch (error) {
    next(error);
  }
});

// Get notifications
router.get('/notifications', authenticate, async (req, res, next) => {
  try {
    const notifications = await prisma.notification.findMany({
      where: { userId: req.user.id },
      orderBy: { createdAt: 'desc' },
      take: 50,
    });
    res.json({ notifications });
  } catch (error) {
    next(error);
  }
});

// Mark notifications as read
router.post('/notifications/read', authenticate, async (req, res, next) => {
  try {
    await prisma.notification.updateMany({
      where: { userId: req.user.id, isRead: false },
      data: { isRead: true, readAt: new Date() },
    });
    res.json({ message: 'Notifications marquées comme lues' });
  } catch (error) {
    next(error);
  }
});

// Admin: Get all users
router.get('/', authenticate, requireAdmin, async (req, res, next) => {
  try {
    const { page = 1, limit = 20, role, status, search } = req.query;
    
    const where = {
      ...(role && { role }),
      ...(status && { status }),
      ...(search && {
        OR: [
          { email: { contains: search, mode: 'insensitive' } },
          { firstName: { contains: search, mode: 'insensitive' } },
          { lastName: { contains: search, mode: 'insensitive' } },
        ],
      }),
    };

    const [users, total] = await Promise.all([
      prisma.user.findMany({
        where,
        skip: (parseInt(page) - 1) * parseInt(limit),
        take: parseInt(limit),
        orderBy: { createdAt: 'desc' },
        select: {
          id: true,
          email: true,
          phone: true,
          firstName: true,
          lastName: true,
          role: true,
          status: true,
          createdAt: true,
          lastLoginAt: true,
        },
      }),
      prisma.user.count({ where }),
    ]);

    res.json({
      users,
      pagination: { page: parseInt(page), limit: parseInt(limit), total, pages: Math.ceil(total / parseInt(limit)) },
    });
  } catch (error) {
    next(error);
  }
});

module.exports = router;
