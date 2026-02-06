/**
 * Order Routes
 */

const express = require('express');
const orderController = require('../controllers/orderController');
const { authenticate, requireSeller } = require('../middleware/auth');

const router = express.Router();

// Customer routes
router.post('/', authenticate, orderController.createOrder);
router.get('/my-orders', authenticate, orderController.getMyOrders);
router.get('/:id', authenticate, orderController.getOrder);
router.post('/:id/cancel', authenticate, orderController.cancelOrder);

// Seller routes
router.get('/store/orders', authenticate, requireSeller, orderController.getStoreOrders);
router.patch('/:id/status', authenticate, requireSeller, orderController.updateOrderStatus);

module.exports = router;
