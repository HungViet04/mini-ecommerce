/**
 * Product Routes
 * Routes for product endpoints
 */
const express = require('express');
const router = express.Router();

const { productController } = require('../controllers');
const { authenticate, adminOnly } = require('../middlewares');

// Public routes
router.get('/', productController.findAll);
router.get('/search', productController.search);
router.get('/:id', productController.findById);
router.get('/:id/availability', productController.checkAvailability);
router.get('/category/:categoryId', productController.findByCategory);

// Protected routes (Admin only)
router.post('/', authenticate, adminOnly, productController.create);
router.put('/:id', authenticate, adminOnly, productController.update);
router.delete('/:id', authenticate, adminOnly, productController.remove);

module.exports = router;
