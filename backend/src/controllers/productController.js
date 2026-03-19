/**
 * Product Controller
 */

const { PrismaClient } = require('@prisma/client');
const { AppError } = require('../middleware/errorHandler');
const config = require('../config');

const prisma = new PrismaClient();

/**
 * Get all products with filters
 */
exports.getProducts = async (req, res, next) => {
  try {
    const {
      page = 1,
      limit = config.DEFAULT_PAGE_SIZE,
      category,
      store,
      minPrice,
      maxPrice,
      search,
      sort = 'createdAt',
      order = 'desc',
      status = 'ACTIVE',
    } = req.query;

    const skip = (parseInt(page) - 1) * parseInt(limit);
    const take = Math.min(parseInt(limit), config.MAX_PAGE_SIZE);

    // Build where clause
    const where = {
      status: status,
      ...(category && { category: { slug: category } }),
      ...(store && { store: { slug: store } }),
      ...(minPrice && { price: { gte: parseFloat(minPrice) } }),
      ...(maxPrice && { price: { ...where?.price, lte: parseFloat(maxPrice) } }),
      ...(search && {
        OR: [
          { title: { contains: search, mode: 'insensitive' } },
          { description: { contains: search, mode: 'insensitive' } },
          { brand: { contains: search, mode: 'insensitive' } },
        ],
      }),
    };

    // Build orderBy
    const orderBy = {};
    if (sort === 'price') {
      orderBy.price = order;
    } else if (sort === 'sales') {
      orderBy.salesCount = order;
    } else if (sort === 'rating') {
      orderBy.rating = order;
    } else {
      orderBy.createdAt = order;
    }

    // Get products and count
    const [products, total] = await Promise.all([
      prisma.product.findMany({
        where,
        skip,
        take,
        orderBy,
        include: {
          category: { select: { id: true, name: true, slug: true } },
          store: { select: { id: true, name: true, slug: true, rating: true } },
        },
      }),
      prisma.product.count({ where }),
    ]);

    res.json({
      products,
      pagination: {
        page: parseInt(page),
        limit: take,
        total,
        pages: Math.ceil(total / take),
      },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Get single product
 */
exports.getProduct = async (req, res, next) => {
  try {
    const { id } = req.params;

    const product = await prisma.product.findFirst({
      where: {
        OR: [{ id }, { slug: id }],
      },
      include: {
        category: true,
        store: {
          select: {
            id: true,
            name: true,
            slug: true,
            logo: true,
            rating: true,
            reviewCount: true,
            isVerified: true,
          },
        },
        reviews: {
          where: { isApproved: true },
          take: 10,
          orderBy: { createdAt: 'desc' },
          include: {
            user: { select: { firstName: true, lastName: true, avatar: true } },
          },
        },
      },
    });

    if (!product) {
      throw new AppError('Produit non trouvé', 404);
    }

    // Increment view count
    await prisma.product.update({
      where: { id: product.id },
      data: { viewCount: { increment: 1 } },
    });

    res.json({ product });
  } catch (error) {
    next(error);
  }
};

/**
 * Create product (seller only)
 */
exports.createProduct = async (req, res, next) => {
  try {
    const userId = req.user.id;

    // Get seller's store
    const store = await prisma.store.findUnique({
      where: { userId },
    });

    if (!store) {
      throw new AppError('Vous devez avoir une boutique pour créer des produits', 403);
    }

    if (store.status !== 'ACTIVE') {
      throw new AppError('Votre boutique doit être active pour créer des produits', 403);
    }

    const {
      title,
      description,
      shortDescription,
      categoryId,
      price,
      comparePrice,
      costPrice,
      sku,
      stock,
      images,
      brand,
      weight,
      dimensions,
      attributes,
    } = req.body;

    // Generate slug
    const slug = `${title.toLowerCase().replace(/[^a-z0-9]+/g, '-')}-${Date.now()}`;

    const product = await prisma.product.create({
      data: {
        storeId: store.id,
        categoryId,
        title,
        slug,
        description,
        shortDescription,
        price: parseFloat(price),
        comparePrice: comparePrice ? parseFloat(comparePrice) : null,
        costPrice: costPrice ? parseFloat(costPrice) : null,
        sku,
        stock: parseInt(stock) || 0,
        images: images || [],
        brand,
        weight: weight ? parseFloat(weight) : null,
        dimensions,
        attributes,
        status: 'PENDING', // Requires approval
      },
      include: {
        category: true,
        store: { select: { id: true, name: true, slug: true } },
      },
    });

    res.status(201).json({
      message: 'Produit créé avec succès',
      product,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Update product (seller only)
 */
exports.updateProduct = async (req, res, next) => {
  try {
    const { id } = req.params;
    const userId = req.user.id;

    // Check ownership
    const product = await prisma.product.findUnique({
      where: { id },
      include: { store: true },
    });

    if (!product) {
      throw new AppError('Produit non trouvé', 404);
    }

    if (product.store.userId !== userId && req.user.role !== 'ADMIN') {
      throw new AppError('Non autorisé', 403);
    }

    const {
      title,
      description,
      shortDescription,
      categoryId,
      price,
      comparePrice,
      costPrice,
      sku,
      stock,
      images,
      brand,
      weight,
      dimensions,
      attributes,
      status,
    } = req.body;

    const updatedProduct = await prisma.product.update({
      where: { id },
      data: {
        ...(title && { title }),
        ...(description && { description }),
        ...(shortDescription !== undefined && { shortDescription }),
        ...(categoryId && { categoryId }),
        ...(price && { price: parseFloat(price) }),
        ...(comparePrice !== undefined && { comparePrice: comparePrice ? parseFloat(comparePrice) : null }),
        ...(costPrice !== undefined && { costPrice: costPrice ? parseFloat(costPrice) : null }),
        ...(sku !== undefined && { sku }),
        ...(stock !== undefined && { stock: parseInt(stock) }),
        ...(images && { images }),
        ...(brand !== undefined && { brand }),
        ...(weight !== undefined && { weight: weight ? parseFloat(weight) : null }),
        ...(dimensions !== undefined && { dimensions }),
        ...(attributes !== undefined && { attributes }),
        ...(status && req.user.role === 'ADMIN' && { status }),
      },
      include: {
        category: true,
        store: { select: { id: true, name: true, slug: true } },
      },
    });

    res.json({
      message: 'Produit mis à jour',
      product: updatedProduct,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Delete product (seller only)
 */
exports.deleteProduct = async (req, res, next) => {
  try {
    const { id } = req.params;
    const userId = req.user.id;

    const product = await prisma.product.findUnique({
      where: { id },
      include: { store: true },
    });

    if (!product) {
      throw new AppError('Produit non trouvé', 404);
    }

    if (product.store.userId !== userId && req.user.role !== 'ADMIN') {
      throw new AppError('Non autorisé', 403);
    }

    await prisma.product.delete({ where: { id } });

    res.json({ message: 'Produit supprimé' });
  } catch (error) {
    next(error);
  }
};

/**
 * Get featured products
 */
exports.getFeatured = async (req, res, next) => {
  try {
    const products = await prisma.product.findMany({
      where: {
        status: 'ACTIVE',
        isFeatured: true,
      },
      take: 12,
      orderBy: { salesCount: 'desc' },
      include: {
        category: { select: { id: true, name: true, slug: true } },
        store: { select: { id: true, name: true, slug: true } },
      },
    });

    res.json({ products });
  } catch (error) {
    next(error);
  }
};

/**
 * Get best sellers
 */
exports.getBestSellers = async (req, res, next) => {
  try {
    const { limit = 20, category } = req.query;

    const products = await prisma.product.findMany({
      where: {
        status: 'ACTIVE',
        ...(category && { category: { slug: category } }),
      },
      take: parseInt(limit),
      orderBy: { salesCount: 'desc' },
      include: {
        category: { select: { id: true, name: true, slug: true } },
        store: { select: { id: true, name: true, slug: true } },
      },
    });

    res.json({ products });
  } catch (error) {
    next(error);
  }
};
