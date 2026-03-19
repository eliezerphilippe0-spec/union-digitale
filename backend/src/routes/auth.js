/**
 * Authentication Routes
 */

const express = require('express');
const { body } = require('express-validator');
const authController = require('../controllers/authController');
const { authenticate } = require('../middleware/auth');

const router = express.Router();

// Validation rules
const registerValidation = [
  body('email').isEmail().normalizeEmail().withMessage('Email invalide'),
  body('password').isLength({ min: 8 }).withMessage('Mot de passe minimum 8 caractères'),
  body('firstName').trim().notEmpty().withMessage('Prénom requis'),
  body('lastName').trim().notEmpty().withMessage('Nom requis'),
  body('phone').optional().isMobilePhone('any').withMessage('Numéro de téléphone invalide'),
];

const loginValidation = [
  body('email').isEmail().normalizeEmail().withMessage('Email invalide'),
  body('password').notEmpty().withMessage('Mot de passe requis'),
];

// Routes
router.post('/register', registerValidation, authController.register);
router.post('/login', loginValidation, authController.login);
router.post('/refresh', authController.refreshToken);
router.get('/me', authenticate, authController.me);
router.post('/logout', authenticate, authController.logout);
router.post('/change-password', authenticate, authController.changePassword);

module.exports = router;
