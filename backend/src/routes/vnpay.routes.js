/**
 * VNPay Routes
 * Routes for VNPay payment endpoints
 */
const express = require('express');
const router = express.Router();

const vnpayController = require('../controllers/vnpay.controller');
const { authenticate } = require('../middlewares');

// Create payment URL - requires authentication
router.post('/create-payment-url', authenticate, vnpayController.createPaymentUrl);

// VNPay return URL - public (called after payment redirect)
router.get('/return', vnpayController.vnpayReturn);

// VNPay IPN - public (called by VNPay server)
router.get('/ipn', vnpayController.vnpayIpn);

// Get payment status - requires authentication
router.get('/status/:orderId', authenticate, vnpayController.getPaymentStatus);

module.exports = router;
