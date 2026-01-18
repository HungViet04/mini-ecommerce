/**
 * Stats Routes
 * Dashboard statistics endpoints
 */
const express = require('express');
const router = express.Router();
const statsController = require('../controllers/stats.controller');
const { authenticate, adminOnly } = require('../middlewares');

// All stats routes require admin
router.use(authenticate, adminOnly);

// GET /api/v1/stats/dashboard - Get dashboard statistics
router.get('/dashboard', statsController.getDashboardStats);

module.exports = router;
