/**
 * Cart Controller
 */

const { PrismaClient } = require('@prisma/client');
const { AppError } = require('../middleware/errorHandler');

const prisma = new PrismaClient();

/**
 * Get cart
 */
exports.getCart = async (req, res, next) => {
  try {
    const userId = req.user.id;

    const items = await prisma.cartItem.findMany({
      where: { userId },
      include: {
        product: {
          include: {
            store: { select: { id: true, name: true, slug: true } },
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    // Calculate totals
    const subtotal = items.reduce((sum, item) => {
      return sum + (item.product.price * item.quantity);
    }, 0);

    const itemCount = items.reduce((sum, item) => sum + item.quantity, 0);

    res.json({
      items,
      subtotal,
      itemCount,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Add to cart
 */
exports.addToCart = async (req, res, next) => {
  try {
    const userId = req.user.id;
    const { productId, quantity = 1 } = req.body;

    // Check product exists and has stock
    const product = await prisma.product.findUnique({
      where: { id: productId },
    });

    if (!product) {
      throw new AppError('Produit non trouvé', 404);
    }

    if (product.status !== 'ACTIVE') {
      throw new AppError('Produit non disponible', 400);
    }

    if (product.stock < quantity) {
      throw new AppError('Stock insuffisant', 400);
    }

    // Check if already in cart
    const existingItem = await prisma.cartItem.findUnique({
      where: {
        userId_productId: { userId, productId },
      },
    });

    let cartItem;
    if (existingItem) {
      // Update quantity
      const newQuantity = existingItem.quantity + quantity;
      if (newQuantity > product.stock) {
        throw new AppError('Stock insuffisant', 400);
      }

      cartItem = await prisma.cartItem.update({
        where: { id: existingItem.id },
        data: { quantity: newQuantity },
        include: { product: true },
      });
    } else {
      // Create new cart item
      cartItem = await prisma.cartItem.create({
        data: {
          userId,
          productId,
          quantity,
        },
        include: { product: true },
      });
    }

    res.json({
      message: 'Produit ajouté au panier',
      item: cartItem,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Update cart item quantity
 */
exports.updateCartItem = async (req, res, next) => {
  try {
    const userId = req.user.id;
    const { id } = req.params;
    const { quantity } = req.body;

    const item = await prisma.cartItem.findFirst({
      where: { id, userId },
      include: { product: true },
    });

    if (!item) {
      throw new AppError('Article non trouvé', 404);
    }

    if (quantity < 1) {
      // Remove item
      await prisma.cartItem.delete({ where: { id } });
      return res.json({ message: 'Article supprimé du panier' });
    }

    if (quantity > item.product.stock) {
      throw new AppError('Stock insuffisant', 400);
    }

    const updatedItem = await prisma.cartItem.update({
      where: { id },
      data: { quantity },
      include: { product: true },
    });

    res.json({
      message: 'Panier mis à jour',
      item: updatedItem,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Remove from cart
 */
exports.removeFromCart = async (req, res, next) => {
  try {
    const userId = req.user.id;
    const { id } = req.params;

    const item = await prisma.cartItem.findFirst({
      where: { id, userId },
    });

    if (!item) {
      throw new AppError('Article non trouvé', 404);
    }

    await prisma.cartItem.delete({ where: { id } });

    res.json({ message: 'Article supprimé du panier' });
  } catch (error) {
    next(error);
  }
};

/**
 * Clear cart
 */
exports.clearCart = async (req, res, next) => {
  try {
    const userId = req.user.id;

    await prisma.cartItem.deleteMany({ where: { userId } });

    res.json({ message: 'Panier vidé' });
  } catch (error) {
    next(error);
  }
};
