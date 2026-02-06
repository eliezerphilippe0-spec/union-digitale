/**
 * Authentication Controller
 */

const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { PrismaClient } = require('@prisma/client');
const { validationResult } = require('express-validator');
const config = require('../config');
const { AppError } = require('../middleware/errorHandler');

const prisma = new PrismaClient();

/**
 * Generate JWT tokens
 */
const generateTokens = (userId) => {
  const accessToken = jwt.sign(
    { userId },
    config.JWT_SECRET,
    { expiresIn: config.JWT_EXPIRES_IN }
  );
  
  const refreshToken = jwt.sign(
    { userId, type: 'refresh' },
    config.JWT_SECRET,
    { expiresIn: config.JWT_REFRESH_EXPIRES_IN }
  );
  
  return { accessToken, refreshToken };
};

/**
 * Register new user
 */
exports.register = async (req, res, next) => {
  try {
    // Validate input
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      throw new AppError(errors.array()[0].msg, 400);
    }

    const { email, password, firstName, lastName, phone, role = 'BUYER' } = req.body;

    // Check if user exists
    const existingUser = await prisma.user.findFirst({
      where: {
        OR: [
          { email },
          ...(phone ? [{ phone }] : []),
        ],
      },
    });

    if (existingUser) {
      throw new AppError('Un compte existe déjà avec cet email ou téléphone', 409);
    }

    // Hash password
    const passwordHash = await bcrypt.hash(password, config.BCRYPT_ROUNDS);

    // Create user
    const user = await prisma.user.create({
      data: {
        email,
        phone,
        passwordHash,
        firstName,
        lastName,
        role: role === 'SELLER' ? 'SELLER' : 'BUYER',
        status: 'ACTIVE', // Auto-activate for now
      },
      select: {
        id: true,
        email: true,
        firstName: true,
        lastName: true,
        role: true,
        status: true,
        loyaltyPoints: true,
        loyaltyTier: true,
        createdAt: true,
      },
    });

    // If seller, create store
    if (role === 'SELLER') {
      await prisma.store.create({
        data: {
          userId: user.id,
          name: `${firstName} ${lastName}`,
          slug: `${firstName.toLowerCase()}-${lastName.toLowerCase()}-${Date.now()}`,
          status: 'PENDING',
        },
      });
    }

    // Generate tokens
    const tokens = generateTokens(user.id);

    // Update last login
    await prisma.user.update({
      where: { id: user.id },
      data: { lastLoginAt: new Date() },
    });

    res.status(201).json({
      message: 'Compte créé avec succès',
      user,
      ...tokens,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Login user
 */
exports.login = async (req, res, next) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      throw new AppError(errors.array()[0].msg, 400);
    }

    const { email, password } = req.body;

    // Find user
    const user = await prisma.user.findUnique({
      where: { email },
      include: {
        store: {
          select: {
            id: true,
            name: true,
            slug: true,
            status: true,
          },
        },
      },
    });

    if (!user) {
      throw new AppError('Email ou mot de passe incorrect', 401);
    }

    // Check password
    const validPassword = await bcrypt.compare(password, user.passwordHash);
    if (!validPassword) {
      throw new AppError('Email ou mot de passe incorrect', 401);
    }

    // Check status
    if (user.status === 'SUSPENDED' || user.status === 'BANNED') {
      throw new AppError('Votre compte a été suspendu', 403);
    }

    // Generate tokens
    const tokens = generateTokens(user.id);

    // Update last login
    await prisma.user.update({
      where: { id: user.id },
      data: { lastLoginAt: new Date() },
    });

    // Remove sensitive data
    const { passwordHash, ...userData } = user;

    res.json({
      message: 'Connexion réussie',
      user: userData,
      ...tokens,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Refresh token
 */
exports.refreshToken = async (req, res, next) => {
  try {
    const { refreshToken } = req.body;

    if (!refreshToken) {
      throw new AppError('Refresh token requis', 400);
    }

    // Verify refresh token
    const decoded = jwt.verify(refreshToken, config.JWT_SECRET);
    
    if (decoded.type !== 'refresh') {
      throw new AppError('Token invalide', 401);
    }

    // Check user exists
    const user = await prisma.user.findUnique({
      where: { id: decoded.userId },
    });

    if (!user || user.status !== 'ACTIVE') {
      throw new AppError('Utilisateur non trouvé ou inactif', 401);
    }

    // Generate new tokens
    const tokens = generateTokens(user.id);

    res.json(tokens);
  } catch (error) {
    next(error);
  }
};

/**
 * Get current user
 */
exports.me = async (req, res, next) => {
  try {
    const user = await prisma.user.findUnique({
      where: { id: req.user.id },
      select: {
        id: true,
        email: true,
        phone: true,
        firstName: true,
        lastName: true,
        avatar: true,
        role: true,
        status: true,
        loyaltyPoints: true,
        loyaltyTier: true,
        emailVerified: true,
        phoneVerified: true,
        createdAt: true,
        lastLoginAt: true,
        store: {
          select: {
            id: true,
            name: true,
            slug: true,
            status: true,
            isVerified: true,
            rating: true,
            totalSales: true,
          },
        },
        addresses: true,
        _count: {
          select: {
            orders: true,
            favorites: true,
            reviews: true,
          },
        },
      },
    });

    res.json({ user });
  } catch (error) {
    next(error);
  }
};

/**
 * Logout (client-side token removal)
 */
exports.logout = async (req, res) => {
  // In a production app, you might want to invalidate the token
  // by storing it in a blacklist or using short-lived tokens
  res.json({ message: 'Déconnexion réussie' });
};

/**
 * Change password
 */
exports.changePassword = async (req, res, next) => {
  try {
    const { currentPassword, newPassword } = req.body;

    // Get user with password
    const user = await prisma.user.findUnique({
      where: { id: req.user.id },
    });

    // Verify current password
    const validPassword = await bcrypt.compare(currentPassword, user.passwordHash);
    if (!validPassword) {
      throw new AppError('Mot de passe actuel incorrect', 400);
    }

    // Hash new password
    const passwordHash = await bcrypt.hash(newPassword, config.BCRYPT_ROUNDS);

    // Update password
    await prisma.user.update({
      where: { id: req.user.id },
      data: { passwordHash },
    });

    res.json({ message: 'Mot de passe modifié avec succès' });
  } catch (error) {
    next(error);
  }
};
