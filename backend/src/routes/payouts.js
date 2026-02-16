const express = require('express');
const prisma = require('../lib/prisma');
const { authenticate, requireSeller, requireAdmin } = require('../middleware/auth');
const { AppError } = require('../middleware/errorHandler');

const router = express.Router();
const { runWeeklyPayoutBatch } = require('../jobs/payoutBatch');

// Admin run payout batch
router.post('/batch/run', authenticate, requireAdmin, async (req, res, next) => {
  try {
    const dryRun = String(req.query.DRY_RUN || req.body?.DRY_RUN || '').toLowerCase() === 'true';
    const report = await runWeeklyPayoutBatch({ dryRun });
    res.json(report);
  } catch (error) {
    next(error);
  }
});

// Seller requests payout
router.post('/request', authenticate, requireSeller, async (req, res, next) => {
  try {
    const { amountHTG, method, accountInfo } = req.body;
    const amount = Number(amountHTG || 0);

    if (!amount || amount <= 0) {
      throw new AppError('Montant invalide', 400);
    }

    const store = await prisma.store.findUnique({ where: { userId: req.user.id } });
    if (!store) throw new AppError('Boutique non trouvée', 404);

    const balance = await prisma.sellerBalance.upsert({
      where: { storeId: store.id },
      update: {},
      create: { storeId: store.id },
    });

    if (balance.availableHTG < amount) {
      throw new AppError('Solde disponible insuffisant', 400);
    }

    const request = await prisma.payoutRequest.create({
      data: {
        storeId: store.id,
        amountHTG: amount,
        method: method || 'manual',
        status: 'REQUESTED',
        reference: accountInfo ? JSON.stringify(accountInfo) : null,
      },
    });

    res.status(201).json({ request });
  } catch (error) {
    next(error);
  }
});

// Admin list payout requests
router.get('/admin', authenticate, requireAdmin, async (req, res, next) => {
  try {
    const { status } = req.query;
    const where = status ? { status } : {};

    const requests = await prisma.payoutRequest.findMany({
      where,
      include: { store: { select: { id: true, name: true, slug: true } } },
      orderBy: { createdAt: 'desc' },
      take: 50,
    });

    res.json({ requests });
  } catch (error) {
    next(error);
  }
});

// Admin approve payout
router.post('/admin/:id/approve', authenticate, requireAdmin, async (req, res, next) => {
  try {
    const { id } = req.params;

    const request = await prisma.payoutRequest.findUnique({ where: { id } });
    if (!request) throw new AppError('Demande non trouvée', 404);
    if (request.status !== 'REQUESTED') throw new AppError('Demande déjà traitée', 400);

    const result = await prisma.$transaction(async (tx) => {
      const balance = await tx.sellerBalance.upsert({
        where: { storeId: request.storeId },
        update: {},
        create: { storeId: request.storeId },
      });

      if (balance.availableHTG < request.amountHTG) {
        throw new AppError('Solde disponible insuffisant', 400);
      }

      await tx.sellerBalance.update({
        where: { storeId: request.storeId },
        data: {
          availableHTG: { decrement: request.amountHTG },
          payoutPendingHTG: { increment: request.amountHTG },
        },
      });

      await tx.financialLedger.create({
        data: {
          type: 'PAYOUT_LOCK',
          status: 'COMMITTED',
          storeId: request.storeId,
          payoutRequestId: request.id,
          amountHTG: -request.amountHTG,
        },
      });

      return await tx.payoutRequest.update({
        where: { id: request.id },
        data: {
          status: 'APPROVED',
          approvedBy: req.user.id,
        },
      });
    });

    res.json({ request: result });
  } catch (error) {
    next(error);
  }
});

// Admin reject payout
router.post('/admin/:id/reject', authenticate, requireAdmin, async (req, res, next) => {
  try {
    const { id } = req.params;
    const request = await prisma.payoutRequest.findUnique({ where: { id } });
    if (!request) throw new AppError('Demande non trouvée', 404);
    if (request.status !== 'REQUESTED') throw new AppError('Demande déjà traitée', 400);

    const updated = await prisma.payoutRequest.update({
      where: { id },
      data: { status: 'REJECTED', approvedBy: req.user.id },
    });

    res.json({ request: updated });
  } catch (error) {
    next(error);
  }
});

// Admin mark as paid
router.post('/admin/:id/paid', authenticate, requireAdmin, async (req, res, next) => {
  try {
    const { id } = req.params;
    const { reference } = req.body;

    const request = await prisma.payoutRequest.findUnique({ where: { id } });
    if (!request) throw new AppError('Demande non trouvée', 404);
    if (request.status !== 'APPROVED') throw new AppError('Demande non approuvée', 400);

    const result = await prisma.$transaction(async (tx) => {
      await tx.sellerBalance.update({
        where: { storeId: request.storeId },
        data: {
          payoutPendingHTG: { decrement: request.amountHTG },
        },
      });

      await tx.financialLedger.create({
        data: {
          type: 'PAYOUT_PAID',
          status: 'COMMITTED',
          storeId: request.storeId,
          payoutRequestId: request.id,
          amountHTG: -request.amountHTG,
        },
      });

      return await tx.payoutRequest.update({
        where: { id },
        data: { status: 'PAID', paidAt: new Date(), reference: reference || null },
      });
    });

    res.json({ request: result });
  } catch (error) {
    next(error);
  }
});

module.exports = router;
