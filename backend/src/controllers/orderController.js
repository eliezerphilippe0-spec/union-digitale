/**
 * Order Controller
 */

const prisma = require('../lib/prisma');
const { AppError } = require('../middleware/errorHandler');
const { v4: uuidv4 } = require('uuid');
const config = require('../config');
const { assertNonNegative, assertNoDuplicateLedger } = require('../utils/financeGuards');
const { computeRiskLevel } = require('../services/riskEngine');

const calculateTier = (points = 0) => {
  if (points >= 50000) return 'diamond';
  if (points >= 15000) return 'platinum';
  if (points >= 5000) return 'gold';
  if (points >= 1000) return 'silver';
  return 'bronze';
};

/**
 * Generate order number
 */
const generateOrderNumber = () => {
  const timestamp = Date.now().toString(36).toUpperCase();
  const random = Math.random().toString(36).substring(2, 6).toUpperCase();
  return `UD-${timestamp}-${random}`;
};

const calcPointsRedemption = ({ itemsSubtotalHtg, requestedPoints, walletBalance }) => {
  if (itemsSubtotalHtg <= 0) {
    return { pointsApplied: 0, discountHtg: 0, eligibleSubtotalHtg: 0 };
  }

  if (itemsSubtotalHtg < config.POINTS_MIN_ORDER_HTG) {
    return { pointsApplied: 0, discountHtg: 0, eligibleSubtotalHtg: itemsSubtotalHtg };
  }

  const eligibleSubtotalHtg = itemsSubtotalHtg;
  const maxDiscountHtg = Math.floor((eligibleSubtotalHtg * config.POINTS_MAX_PERCENT) / 100);
  const maxPointsByCap = Math.floor(maxDiscountHtg / config.POINTS_VALUE_HTG);
  const effectiveRequested = Math.max(0, Math.floor(requestedPoints || 0));

  const pointsApplied = Math.min(effectiveRequested, walletBalance, maxPointsByCap);
  const discountHtg = pointsApplied * config.POINTS_VALUE_HTG;

  return { pointsApplied, discountHtg, eligibleSubtotalHtg };
};

/**
 * Create order
 */
exports.previewOrder = async (req, res, next) => {
  try {
    const userId = req.user.id;
    const { addressId, usePoints = 0 } = req.body;

    const cartItems = await prisma.cartItem.findMany({
      where: { userId },
      include: { product: true },
    });

    if (cartItems.length === 0) {
      throw new AppError('Votre panier est vide', 400);
    }

    const address = await prisma.address.findFirst({
      where: { id: addressId, userId },
    });

    if (!address) {
      throw new AppError('Adresse non trouvée', 404);
    }

    const subtotal = cartItems.reduce((sum, item) => sum + (item.product.price * item.quantity), 0);
    const shippingCost = subtotal > 5000 ? 0 : 500;

    const wallet = await prisma.pointsWallet.findUnique({ where: { userId } });
    const pending = await prisma.pointsLedger.aggregate({
      _sum: { points: true },
      where: { userId, type: 'REDEEM', status: 'PENDING' },
    });

    const pendingSpend = Math.abs(pending._sum.points || 0);
    const available = Math.max((wallet?.balance || 0) - pendingSpend, 0);

    const pointsCalc = calcPointsRedemption({
      itemsSubtotalHtg: Math.floor(subtotal),
      requestedPoints: usePoints,
      walletBalance: available,
    });

    const totalBeforeDiscount = subtotal + shippingCost;
    const total = Math.max(totalBeforeDiscount - pointsCalc.discountHtg, 0);

    res.json({
      subtotal,
      shippingCost,
      totalBeforeDiscount,
      total,
      maxPointsAllowed: Math.floor((Math.floor(subtotal * config.POINTS_MAX_PERCENT / 100)) / config.POINTS_VALUE_HTG),
      appliedPoints: pointsCalc.pointsApplied,
      pointsDiscountHtg: pointsCalc.discountHtg,
      availablePoints: available,
    });
  } catch (error) {
    next(error);
  }
};

exports.createOrder = async (req, res, next) => {
  try {
    const userId = req.user.id;
    const {
      addressId,
      paymentMethod,
      customerNote,
      usePoints = 0,
    } = req.body;

    const result = await prisma.$transaction(async (tx) => {
      // Get user's cart
      const cartItems = await tx.cartItem.findMany({
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
      const address = await tx.address.findFirst({
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

      const orders = [];

      // Ensure wallet exists
      let wallet = await tx.pointsWallet.findUnique({ where: { userId } });
      if (!wallet) {
        wallet = await tx.pointsWallet.create({ data: { userId, balance: 0 } });
      }

      const pending = await tx.pointsLedger.aggregate({
        _sum: { points: true },
        where: { userId, type: 'REDEEM', status: 'PENDING' },
      });

      const pendingSpend = Math.abs(pending._sum.points || 0);
      let availablePoints = Math.max(wallet.balance - pendingSpend, 0);

      let remainingPoints = Math.max(0, Math.floor(usePoints || 0));

      // Stock validation + decrement inside transaction
      for (const item of cartItems) {
        const updated = await tx.product.updateMany({
          where: {
            id: item.product.id,
            stock: { gte: item.quantity },
          },
          data: {
            stock: { decrement: item.quantity },
            salesCount: { increment: item.quantity },
          },
        });

        if (updated.count === 0) {
          throw new AppError(`Stock insuffisant pour ${item.product.title}`, 400);
        }
      }

      // Create orders for each store
      for (const storeId of Object.keys(ordersByStore)) {
        const orderData = ordersByStore[storeId];
        const shippingCost = orderData.subtotal > 5000 ? 0 : 500; // Free shipping over 5000 HTG

        const pointsCalc = calcPointsRedemption({
          itemsSubtotalHtg: Math.floor(orderData.subtotal),
          requestedPoints: remainingPoints,
          walletBalance: availablePoints,
        });

        availablePoints = Math.max(availablePoints - pointsCalc.pointsApplied, 0);

        remainingPoints = Math.max(0, remainingPoints - pointsCalc.pointsApplied);

        const totalBeforeDiscount = orderData.subtotal + shippingCost;
        const total = Math.max(totalBeforeDiscount - pointsCalc.discountHtg, 0);

        const pointsEarned = Math.floor(totalBeforeDiscount / 100);

        const commissionRate = orderData.store?.commissionRate ?? 0.10;
        const commissionBase = Math.max(orderData.subtotal - pointsCalc.discountHtg, 0);
        const commissionAmount = commissionBase * commissionRate;
        const sellerGross = Math.max(commissionBase, 0);
        const sellerNet = Math.max(sellerGross - commissionAmount, 0);

        const order = await tx.order.create({
          data: {
            orderNumber: generateOrderNumber(),
            userId,
            storeId,
            addressId,
            paymentMethod,
            subtotal: orderData.subtotal,
            subtotalProductsHTG: orderData.subtotal,
            shippingCost,
            total,
            customerNote,
            commissionRate,
            commissionAmountHTG: commissionAmount,
            sellerGrossHTG: sellerGross,
            sellerNetHTG: sellerNet,
            escrowStatus: 'NONE',
            pointsEarned,
            pointsUsed: pointsCalc.pointsApplied,
            pointsApplied: pointsCalc.pointsApplied,
            pointsDiscountHtg: pointsCalc.discountHtg,
            pointsValueHtgAtRedemption: config.POINTS_VALUE_HTG,
            pointsMaxPercent: config.POINTS_MAX_PERCENT,
            pointsEligibleSubtotalHtg: pointsCalc.eligibleSubtotalHtg,
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

        if (pointsCalc.pointsApplied > 0) {
          await tx.pointsLedger.create({
            data: {
              userId,
              walletId: wallet.id,
              type: 'REDEEM',
              status: 'PENDING',
              points: -pointsCalc.pointsApplied,
              amountHtg: pointsCalc.discountHtg,
              orderId: order.id,
              idempotencyKey: `order:${order.id}:redeem`,
              committedAt: null,
            },
          });
        }

        orders.push(order);
      }

      // Clear cart
      await tx.cartItem.deleteMany({ where: { userId } });

      const totalPointsEarned = orders.reduce((sum, o) => sum + o.pointsEarned, 0);

      return { orders, totalPointsEarned };
    });

    res.status(201).json({
      message: 'Commande créée avec succès',
      orders: result.orders,
      pointsEarned: result.totalPointsEarned,
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

    // Cancel pending points redemption if any
    await prisma.pointsLedger.updateMany({
      where: { orderId: order.id, type: 'REDEEM', status: 'PENDING' },
      data: { status: 'CANCELED' },
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
    const { status, trackingNumber, reason } = req.body;
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

    if (status === 'CANCELLED' || status === 'REFUNDED') {
      updateData.sellerNote = reason || updateData.sellerNote;
    }

    const updatedOrder = await prisma.order.update({
      where: { id },
      data: updateData,
      include: {
        items: true,
        user: { select: { email: true, phone: true } },
      },
    });

    if (status === 'DELIVERED' && updatedOrder.escrowStatus === 'HELD') {
      await prisma.$transaction(async (tx) => {
        await tx.sellerBalance.upsert({
          where: { storeId: updatedOrder.storeId },
          update: {},
          create: { storeId: updatedOrder.storeId },
        });

        const balance = await tx.sellerBalance.findUnique({ where: { storeId: updatedOrder.storeId } });
        if (!balance) throw new AppError('Solde vendeur introuvable', 404);
        assertNonNegative('escrowHTG', (balance.escrowHTG || 0) - (updatedOrder.sellerNetHTG || 0));

        await tx.sellerBalance.update({
          where: { storeId: updatedOrder.storeId },
          data: {
            escrowHTG: { decrement: updatedOrder.sellerNetHTG || 0 },
            availableHTG: { increment: updatedOrder.sellerNetHTG || 0 },
          },
        });

        await assertNoDuplicateLedger(tx, { type: 'ESCROW_RELEASE', orderId: updatedOrder.id, storeId: updatedOrder.storeId });
        await assertNoDuplicateLedger(tx, { type: 'SELLER_EARN', orderId: updatedOrder.id, storeId: updatedOrder.storeId });

        await tx.financialLedger.create({
          data: {
            type: 'ESCROW_RELEASE',
            status: 'COMMITTED',
            orderId: updatedOrder.id,
            storeId: updatedOrder.storeId,
            amountHTG: updatedOrder.sellerNetHTG || 0,
          },
        });

        await tx.financialLedger.create({
          data: {
            type: 'SELLER_EARN',
            status: 'COMMITTED',
            orderId: updatedOrder.id,
            storeId: updatedOrder.storeId,
            amountHTG: updatedOrder.sellerNetHTG || 0,
          },
        });

        await tx.order.update({
          where: { id: updatedOrder.id },
          data: { escrowStatus: 'RELEASED' },
        });
      });

      console.log(JSON.stringify({ event: 'escrow_release', orderId: updatedOrder.id, storeId: updatedOrder.storeId, amountHTG: updatedOrder.sellerNetHTG || 0 }));
      console.log(JSON.stringify({ event: 'metric', name: 'escrow_release_totalHTG', value: updatedOrder.sellerNetHTG || 0 }));
    }

    if (status === 'DELIVERED') {
      const existingEarn = await prisma.pointsLedger.findUnique({
        where: { idempotencyKey: `order:${updatedOrder.id}:earn` },
      });

      if (!existingEarn && updatedOrder.pointsEarned > 0) {
        const wallet = await prisma.pointsWallet.upsert({
          where: { userId: updatedOrder.userId },
          update: { balance: { increment: updatedOrder.pointsEarned }, version: { increment: 1 } },
          create: { userId: updatedOrder.userId, balance: updatedOrder.pointsEarned },
        });

        const expiresAt = new Date(Date.now() + config.POINTS_EXPIRY_DAYS * 24 * 60 * 60 * 1000);

        await prisma.pointsLedger.create({
          data: {
            userId: updatedOrder.userId,
            walletId: wallet.id,
            type: 'EARN',
            status: 'COMMITTED',
            points: updatedOrder.pointsEarned,
            amountHtg: updatedOrder.pointsEarned * config.POINTS_VALUE_HTG,
            orderId: updatedOrder.id,
            idempotencyKey: `order:${updatedOrder.id}:earn`,
            committedAt: new Date(),
            expiresAt,
          },
        });

        const user = await prisma.user.findUnique({ where: { id: updatedOrder.userId } });
        const newPoints = (user?.loyaltyPoints || 0) + updatedOrder.pointsEarned;
        const newTier = calculateTier(newPoints);

        await prisma.user.update({
          where: { id: updatedOrder.userId },
          data: { loyaltyPoints: { increment: updatedOrder.pointsEarned }, loyaltyTier: newTier },
        });
      }
    }

    if (status === 'CANCELLED' || status === 'REFUNDED') {
      await prisma.pointsLedger.updateMany({
        where: { orderId: updatedOrder.id, type: 'REDEEM', status: 'PENDING' },
        data: { status: 'CANCELED' },
      });

      if (updatedOrder.escrowStatus === 'HELD') {
        await prisma.$transaction(async (tx) => {
          await tx.sellerBalance.upsert({
            where: { storeId: updatedOrder.storeId },
            update: {},
            create: { storeId: updatedOrder.storeId },
          });

          const balance = await tx.sellerBalance.findUnique({ where: { storeId: updatedOrder.storeId } });
          if (!balance) throw new AppError('Solde vendeur introuvable', 404);
          assertNonNegative('escrowHTG', (balance.escrowHTG || 0) - (updatedOrder.sellerNetHTG || 0));

          await tx.sellerBalance.update({
            where: { storeId: updatedOrder.storeId },
            data: {
              escrowHTG: { decrement: updatedOrder.sellerNetHTG || 0 },
            },
          });

          await assertNoDuplicateLedger(tx, { type: 'REVERSAL', orderId: updatedOrder.id, storeId: updatedOrder.storeId });
          await assertNoDuplicateLedger(tx, { type: 'REFUND', orderId: updatedOrder.id, storeId: updatedOrder.storeId });

          await tx.financialLedger.create({
            data: {
              type: 'REVERSAL',
              status: 'COMMITTED',
              orderId: updatedOrder.id,
              storeId: updatedOrder.storeId,
              amountHTG: updatedOrder.sellerNetHTG ? -updatedOrder.sellerNetHTG : 0,
            },
          });

          await tx.financialLedger.create({
            data: {
              type: 'REFUND',
              status: 'COMMITTED',
              orderId: updatedOrder.id,
              storeId: updatedOrder.storeId,
              amountHTG: updatedOrder.commissionAmountHTG ? -updatedOrder.commissionAmountHTG : 0,
            },
          });

          await tx.order.update({
            where: { id: updatedOrder.id },
            data: { escrowStatus: 'REVERSED' },
          });
        });

        console.log(JSON.stringify({ event: 'escrow_reversal', orderId: updatedOrder.id, storeId: updatedOrder.storeId, amountHTG: updatedOrder.sellerNetHTG || 0 }));
        console.log(JSON.stringify({ event: 'metric', name: 'refund_spike_count', value: 1 }));
        console.log(JSON.stringify({ event: 'alert', name: 'refundSpike', value: updatedOrder.sellerNetHTG || 0 }));
      }

      if (updatedOrder.escrowStatus === 'RELEASED') {
        await prisma.$transaction(async (tx) => {
          const balance = await tx.sellerBalance.findUnique({ where: { storeId: updatedOrder.storeId } });
          if (!balance) throw new AppError('Solde vendeur introuvable', 404);
          assertNonNegative('availableHTG', (balance.availableHTG || 0) - (updatedOrder.sellerNetHTG || 0));

          await tx.sellerBalance.update({
            where: { storeId: updatedOrder.storeId },
            data: {
              availableHTG: { decrement: updatedOrder.sellerNetHTG || 0 },
            },
          });

          await assertNoDuplicateLedger(tx, { type: 'REFUND', orderId: updatedOrder.id, storeId: updatedOrder.storeId });

          await assertNoDuplicateLedger(tx, { type: 'REFUND', orderId: updatedOrder.id, storeId: updatedOrder.storeId });

          await tx.financialLedger.create({
            data: {
              type: 'REFUND',
              status: 'COMMITTED',
              orderId: updatedOrder.id,
              storeId: updatedOrder.storeId,
              amountHTG: updatedOrder.sellerNetHTG ? -updatedOrder.sellerNetHTG : 0,
            },
          });
        });

        console.log(JSON.stringify({ event: 'refund_after_release', orderId: updatedOrder.id, storeId: updatedOrder.storeId, amountHTG: updatedOrder.sellerNetHTG || 0 }));
        console.log(JSON.stringify({ event: 'metric', name: 'refund_spike_count', value: 1 }));
      }
    }

    if (status === 'REFUNDED') {
      await computeRiskLevel(updatedOrder.storeId);
    }

    // TODO: Send notification to customer

    res.json({
      message: 'Statut mis à jour',
      order: updatedOrder,
    });
  } catch (error) {
    next(error);
  }
};
