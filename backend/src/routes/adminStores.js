const express = require('express');
const prisma = require('../lib/prisma');
const { authenticate, requireAdmin } = require('../middleware/auth');
const validate = require('../middleware/validate');
const { body } = require('express-validator');

const router = express.Router();

router.post('/stores/:storeId/verify', authenticate, requireAdmin, validate([
  body('reason').optional().isString(),
]), async (req, res, next) => {
  try {
    const { storeId } = req.params;
    const admin = req.user;

    const store = await prisma.store.update({
      where: { id: storeId },
      data: {
        isVerifiedSeller: true,
        verifiedAt: new Date(),
        verifiedByUid: admin.id,
        verifiedByEmail: admin.email || null,
      },
      select: { id: true, isVerifiedSeller: true, verifiedAt: true, verifiedByUid: true, verifiedByEmail: true },
    });

    res.json({ store });
  } catch (error) {
    next(error);
  }
});

router.post('/stores/:storeId/unverify', authenticate, requireAdmin, validate([
  body('reason').optional().isString(),
]), async (req, res, next) => {
  try {
    const { storeId } = req.params;

    const store = await prisma.store.update({
      where: { id: storeId },
      data: {
        isVerifiedSeller: false,
        verifiedAt: null,
        verifiedByUid: null,
        verifiedByEmail: null,
      },
      select: { id: true, isVerifiedSeller: true, verifiedAt: true, verifiedByUid: true, verifiedByEmail: true },
    });

    res.json({ store });
  } catch (error) {
    next(error);
  }
});

module.exports = router;
