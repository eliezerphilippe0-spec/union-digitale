/**
 * Cart Routes
 */

const express = require('express');
const cartController = require('../controllers/cartController');
const { authenticate } = require('../middleware/auth');

const router = express.Router();

router.get('/', authenticate, cartController.getCart);
router.post('/add', authenticate, cartController.addToCart);
router.patch('/item/:id', authenticate, cartController.updateCartItem);
router.delete('/item/:id', authenticate, cartController.removeFromCart);
router.delete('/clear', authenticate, cartController.clearCart);

module.exports = router;
