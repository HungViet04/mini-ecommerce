/**
 * Auth Routes
 * Routes for authentication endpoints
 */
const express = require('express');
const router = express.Router();

const { authController } = require('../controllers');
const { authenticate } = require('../middlewares');

// Public routes
router.post('/register', authController.register);
router.post('/login', authController.login);

// Protected routes
router.get('/profile', authenticate, authController.getProfile);
router.put('/password', authenticate, authController.changePassword);

module.exports = router;
