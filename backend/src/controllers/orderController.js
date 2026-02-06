/**
 * Order Controller
 */

const { PrismaClient } = require('@prisma/client');
const { AppError } = require('../middleware/errorHandler');
const { v4: uuidv4 } = require('uuid');

const prisma = new PrismaClient();

/**
 * Generate order number
 */
const generateOrderNumber = () => {
  const timestamp = Date.now().toString(36).toUpperCase();
  const random = Math.random().toString(36).substring(2, 6).toUpperCase();
  return `UD-${timestamp}-${random}`;
};

/**
 * Create order
 */
exports.createOrder = async (req, res, next) => {
  try {
    const userId = req.user.id;
    const {
      addressId,
      paymentMethod,
      customerNote,
      usePoints = 0,
    } = req.body;

    // Get user's cart
    const cartItems = await prisma.cartItem.findMany({
      where: { userId },
      include: {
        product: {
          include: {
            store: true,
          },
        },
      },
    });

    if (cartItems.length === 0) {
      throw new AppError('Votre panier est vide', 400);
    }

    // Validate address
    const address = await prisma.address.findFirst({
      where: { id: addressId, userId },
    });

    if (!address) {
      throw new AppError('Adresse non trouvée', 404);
    }

    // Group items by store
    const ordersByStore = {};
    for (const item of cartItems) {
      const storeId = item.product.storeId;
      if (!ordersByStore[storeId]) {
        ordersByStore[storeId] = {
          store: item.product.store,
          items: [],
          subtotal: 0,
        };
      }
      ordersByStore[storeId].items.push(item);
      ordersByStore[storeId].subtotal += item.product.price * item.quantity;
    }

    // Create orders for each store
    const orders = [];
    for (const storeId of Object.keys(ordersByStore)) {
      const orderData = ordersByStore[storeId];
      const shippingCost = orderData.subtotal > 5000 ? 0 : 500; // Free shipping over 5000 HTG
      const total = orderData.subtotal + shippingCost;

      // Calculate loyalty points (1 point per 100 HTG)
      const pointsEarned = Math.floor(total / 100);

      const order = await prisma.order.create({
        data: {
          orderNumber: generateOrderNumber(),
          userId,
          storeId,
          addressId,
          paymentMethod,
          subtotal: orderData.subtotal,
          shippingCost,
          total,
          customerNote,
          pointsEarned,
          pointsUsed: usePoints,
          items: {
            create: orderData.items.map(item => ({
              productId: item.product.id,
              title: item.product.title,
              price: item.product.price,
              quantity: item.quantity,
              total: item.product.price * item.quantity,
            })),
          },
        },
        include: {
          items: true,
          store: { select: { name: true, slug: true } },
          address: true,
        },
      });

      // Update product stock and sales
      for (const item of orderData.items) {
        await prisma.product.update({
          where: { id: item.product.id },
          data: {
            stock: { decrement: item.quantity },
            salesCount: { increment: item.quantity },
          },
        });
      }

      orders.push(order);
    }

    // Clear cart
    await prisma.cartItem.deleteMany({ where: { userId } });

    // Add loyalty points to user
    const totalPointsEarned = orders.reduce((sum, o) => sum + o.pointsEarned, 0);
    await prisma.user.update({
      where: { id: userId },
      data: {
        loyaltyPoints: { increment: totalPointsEarned },
      },
    });

    res.status(201).json({
      message: 'Commande créée avec succès',
      orders,
      pointsEarned: totalPointsEarned,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Get user's orders
 */
exports.getMyOrders = async (req, res, next) => {
  try {
    const userId = req.user.id;
    const { status, page = 1, limit = 10 } = req.query;

    const where = {
      userId,
      ...(status && { status }),
    };

    const [orders, total] = await Promise.all([
      prisma.order.findMany({
        where,
        skip: (parseInt(page) - 1) * parseInt(limit),
        take: parseInt(limit),
        orderBy: { createdAt: 'desc' },
        include: {
          items: {
            include: {
              product: { select: { images: true, slug: true } },
            },
          },
          store: { select: { name: true, slug: true, logo: true } },
        },
      }),
      prisma.order.count({ where }),
    ]);

    res.json({
      orders,
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
};

/**
 * Get single order
 */
exports.getOrder = async (req, res, next) => {
  try {
    const { id } = req.params;
    const userId = req.user.id;

    const order = await prisma.order.findFirst({
      where: {
        OR: [{ id }, { orderNumber: id }],
        ...(req.user.role !== 'ADMIN' && { userId }),
      },
      include: {
        items: {
          include: {
            product: { select: { images: true, slug: true } },
          },
        },
        store: { select: { name: true, slug: true, logo: true, phone: true } },
        address: true,
        user: { select: { firstName: true, lastName: true, email: true, phone: true } },
      },
    });

    if (!order) {
      throw new AppError('Commande non trouvée', 404);
    }

    res.json({ order });
  } catch (error) {
    next(error);
  }
};

/**
 * Cancel order
 */
exports.cancelOrder = async (req, res, next) => {
  try {
    const { id } = req.params;
    const userId = req.user.id;

    const order = await prisma.order.findFirst({
      where: {
        id,
        userId,
        status: { in: ['PENDING', 'CONFIRMED'] },
      },
      include: { items: true },
    });

    if (!order) {
      throw new AppError('Commande non trouvée ou ne peut pas être annulée', 404);
    }

    // Restore stock
    for (const item of order.items) {
      await prisma.product.update({
        where: { id: item.productId },
        data: {
          stock: { increment: item.quantity },
          salesCount: { decrement: item.quantity },
        },
      });
    }

    // Remove loyalty points
    await prisma.user.update({
      where: { id: userId },
      data: {
        loyaltyPoints: { decrement: order.pointsEarned },
      },
    });

    // Update order status
    const updatedOrder = await prisma.order.update({
      where: { id },
      data: { status: 'CANCELLED' },
    });

    res.json({
      message: 'Commande annulée',
      order: updatedOrder,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Get store orders (seller)
 */
exports.getStoreOrders = async (req, res, next) => {
  try {
    const userId = req.user.id;
    const { status, page = 1, limit = 20 } = req.query;

    const store = await prisma.store.findUnique({ where: { userId } });
    if (!store) {
      throw new AppError('Boutique non trouvée', 404);
    }

    const where = {
      storeId: store.id,
      ...(status && { status }),
    };

    const [orders, total] = await Promise.all([
      prisma.order.findMany({
        where,
        skip: (parseInt(page) - 1) * parseInt(limit),
        take: parseInt(limit),
        orderBy: { createdAt: 'desc' },
        include: {
          items: true,
          user: { select: { firstName: true, lastName: true, phone: true } },
          address: true,
        },
      }),
      prisma.order.count({ where }),
    ]);

    res.json({
      orders,
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
};

/**
 * Update order status (seller)
 */
exports.updateOrderStatus = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { status, trackingNumber } = req.body;
    const userId = req.user.id;

    const store = await prisma.store.findUnique({ where: { userId } });
    
    const order = await prisma.order.findFirst({
      where: {
        id,
        ...(req.user.role !== 'ADMIN' && { storeId: store?.id }),
      },
    });

    if (!order) {
      throw new AppError('Commande non trouvée', 404);
    }

    const updateData = { status };
    if (status === 'SHIPPED') {
      updateData.shippedAt = new Date();
      if (trackingNumber) updateData.trackingNumber = trackingNumber;
    }
    if (status === 'DELIVERED') {
      updateData.deliveredAt = new Date();
    }

    const updatedOrder = await prisma.order.update({
      where: { id },
      data: updateData,
      include: {
        items: true,
        user: { select: { email: true, phone: true } },
      },
    });

    // TODO: Send notification to customer

    res.json({
      message: 'Statut mis à jour',
      order: updatedOrder,
    });
  } catch (error) {
    next(error);
  }
};
