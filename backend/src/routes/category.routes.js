/**
 * Category Routes
 * Routes for category endpoints
 */
const express = require('express');
const router = express.Router();

const { categoryController } = require('../controllers');
const { authenticate, adminOnly } = require('../middlewares');

// Public routes
router.get('/', categoryController.findAll);
router.get('/:id', categoryController.findById);

// Protected routes (Admin only)
router.post('/', authenticate, adminOnly, categoryController.create);
router.put('/:id', authenticate, adminOnly, categoryController.update);
router.delete('/:id', authenticate, adminOnly, categoryController.remove);

module.exports = router;
