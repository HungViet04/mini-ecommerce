/**
 * User Routes
 * User management endpoints (admin only)
 */
const express = require('express');
const router = express.Router();
const userController = require('../controllers/user.controller');
const { authenticate, adminOnly } = require('../middlewares');

// All user management routes require admin
router.use(authenticate, adminOnly);

// GET /api/v1/users - Get all users with pagination
router.get('/', userController.getAll);

// GET /api/v1/users/:id - Get user by ID
router.get('/:id', userController.getById);

// GET /api/v1/users/:id/orders - Get user's orders
router.get('/:id/orders', userController.getUserOrders);

// PATCH /api/v1/users/:id/role - Update user role
router.patch('/:id/role', userController.updateRole);

// DELETE /api/v1/users/:id - Delete user
router.delete('/:id', userController.deleteUser);

module.exports = router;
