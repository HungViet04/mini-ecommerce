/**
 * API Routes Index
 * Aggregates all route modules with versioning
 */
const express = require('express');
const router = express.Router();

// Import route modules
const authRoutes = require('./auth.routes');
const productRoutes = require('./product.routes');
const orderRoutes = require('./order.routes');
const categoryRoutes = require('./category.routes');
const healthRoutes = require('./health.routes');
const statsRoutes = require('./stats.routes');
const userRoutes = require('./user.routes');
const uploadRoutes = require('./upload.routes');
const chatbotRoutes = require('./chatbot.routes');
const vnpayRoutes = require('./vnpay.routes');

// API v1 routes
router.use('/auth', authRoutes);
router.use('/products', productRoutes);
router.use('/orders', orderRoutes);
router.use('/categories', categoryRoutes);
router.use('/health', healthRoutes);
router.use('/stats', statsRoutes);
router.use('/users', userRoutes);
router.use('/upload', uploadRoutes);
router.use('/chatbot', chatbotRoutes);
router.use('/vnpay', vnpayRoutes);

// API info endpoint
router.get('/', (req, res) => {
  res.json({
    success: true,
    message: 'Mini E-Commerce API',
    version: '1.0.0',
    endpoints: {
      auth: '/api/v1/auth',
      products: '/api/v1/products',
      orders: '/api/v1/orders',
      categories: '/api/v1/categories',
      health: '/api/v1/health',
    },
  });
});

module.exports = router;
