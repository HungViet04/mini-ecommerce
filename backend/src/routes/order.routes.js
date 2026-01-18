/**
 * Order Routes
 * Routes for order endpoints
 */
const express = require('express');
const router = express.Router();

const { orderController } = require('../controllers');
const { authenticate, adminOnly } = require('../middlewares');

// All order routes require authentication
router.use(authenticate);

// User routes
router.post('/', orderController.create);
router.get('/my', orderController.getMyOrders);
router.get('/:id', orderController.findById);
router.post('/:id/cancel', orderController.cancel);
router.post('/:id/confirm-delivery', orderController.confirmDelivery);

// Admin only routes
router.get('/', adminOnly, orderController.findAll);
router.get('/admin/export', adminOnly, orderController.exportOrders);
router.patch('/:id/status', adminOnly, orderController.updateStatus);

module.exports = router;
