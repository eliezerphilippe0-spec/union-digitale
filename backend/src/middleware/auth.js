/**
 * Authentication Middleware
 */

const jwt = require('jsonwebtoken');
const { PrismaClient } = require('@prisma/client');
const config = require('../config');
const { AppError } = require('./errorHandler');

const prisma = new PrismaClient();

/**
 * Verify JWT token and attach user to request
 */
const authenticate = async (req, res, next) => {
  try {
    // Get token from header
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      throw new AppError('Token d\'authentification requis', 401);
    }

    const token = authHeader.split(' ')[1];

    // Verify token
    const decoded = jwt.verify(token, config.JWT_SECRET);

    // Get user from database
    const user = await prisma.user.findUnique({
      where: { id: decoded.userId },
      select: {
        id: true,
        email: true,
        firstName: true,
        lastName: true,
        role: true,
        status: true,
        loyaltyPoints: true,
        loyaltyTier: true,
      },
    });

    if (!user) {
      throw new AppError('Utilisateur non trouvé', 401);
    }

    if (user.status === 'SUSPENDED' || user.status === 'BANNED') {
      throw new AppError('Compte suspendu ou banni', 403);
    }

    // Attach user to request
    req.user = user;
    next();
  } catch (error) {
    next(error);
  }
};

/**
 * Optional authentication - doesn't fail if no token
 */
const optionalAuth = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    if (authHeader && authHeader.startsWith('Bearer ')) {
      const token = authHeader.split(' ')[1];
      const decoded = jwt.verify(token, config.JWT_SECRET);
      const user = await prisma.user.findUnique({
        where: { id: decoded.userId },
        select: {
          id: true,
          email: true,
          firstName: true,
          lastName: true,
          role: true,
          status: true,
        },
      });
      if (user && user.status === 'ACTIVE') {
        req.user = user;
      }
    }
    next();
  } catch (error) {
    // Silently continue without user
    next();
  }
};

/**
 * Require specific role(s)
 */
const requireRole = (...roles) => {
  return (req, res, next) => {
    if (!req.user) {
      return next(new AppError('Authentification requise', 401));
    }
    if (!roles.includes(req.user.role)) {
      return next(new AppError('Accès non autorisé', 403));
    }
    next();
  };
};

/**
 * Require seller role
 */
const requireSeller = requireRole('SELLER', 'ADMIN');

/**
 * Require admin role
 */
const requireAdmin = requireRole('ADMIN');

module.exports = {
  authenticate,
  optionalAuth,
  requireRole,
  requireSeller,
  requireAdmin,
};
