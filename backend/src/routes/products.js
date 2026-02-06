/**
 * Product Routes
 */

const express = require('express');
const productController = require('../controllers/productController');
const { authenticate, optionalAuth, requireSeller } = require('../middleware/auth');

const router = express.Router();

// Public routes
router.get('/', optionalAuth, productController.getProducts);
router.get('/featured', productController.getFeatured);
router.get('/best-sellers', productController.getBestSellers);
router.get('/:id', optionalAuth, productController.getProduct);

// Protected routes (seller)
router.post('/', authenticate, requireSeller, productController.createProduct);
router.put('/:id', authenticate, requireSeller, productController.updateProduct);
router.delete('/:id', authenticate, requireSeller, productController.deleteProduct);

module.exports = router;
