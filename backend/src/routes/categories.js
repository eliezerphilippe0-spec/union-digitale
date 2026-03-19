/**
 * Category Routes
 */

const express = require('express');
const { PrismaClient } = require('@prisma/client');
const { authenticate, requireAdmin } = require('../middleware/auth');

const router = express.Router();
const prisma = new PrismaClient();

// Get all categories
router.get('/', async (req, res, next) => {
  try {
    const categories = await prisma.category.findMany({
      where: { parentId: null },
      include: {
        children: true,
        _count: { select: { products: true } },
      },
      orderBy: { name: 'asc' },
    });
    res.json({ categories });
  } catch (error) {
    next(error);
  }
});

// Get category by slug
router.get('/:slug', async (req, res, next) => {
  try {
    const category = await prisma.category.findUnique({
      where: { slug: req.params.slug },
      include: {
        children: true,
        parent: true,
      },
    });
    if (!category) {
      return res.status(404).json({ error: 'Catégorie non trouvée' });
    }
    res.json({ category });
  } catch (error) {
    next(error);
  }
});

// Create category (admin)
router.post('/', authenticate, requireAdmin, async (req, res, next) => {
  try {
    const { name, slug, description, icon, image, parentId } = req.body;
    const category = await prisma.category.create({
      data: { name, slug, description, icon, image, parentId },
    });
    res.status(201).json({ category });
  } catch (error) {
    next(error);
  }
});

// Update category (admin)
router.put('/:id', authenticate, requireAdmin, async (req, res, next) => {
  try {
    const { name, slug, description, icon, image, parentId } = req.body;
    const category = await prisma.category.update({
      where: { id: req.params.id },
      data: { name, slug, description, icon, image, parentId },
    });
    res.json({ category });
  } catch (error) {
    next(error);
  }
});

module.exports = router;
