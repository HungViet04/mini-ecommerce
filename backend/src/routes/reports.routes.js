/**
 * Reports Routes
 * Admin-only reporting endpoints
 */
const express = require('express');
const router = express.Router();

const { reportsController } = require('../controllers');
const { authenticate, adminOnly } = require('../middlewares');

// All report routes require admin
router.use(authenticate, adminOnly);

// GET /api/v1/reports/top-products
// Returns top products by quantity + revenue (and supports product filtering)
router.get('/top-products', reportsController.getTopProductsReport);

// GET /api/v1/reports/top-products/export
// Streams CSV download
router.get('/top-products/export', reportsController.exportTopProductsCsv);

// GET /api/v1/reports/products
// Lists products for dropdown
router.get('/products', reportsController.listProductsForReport);

module.exports = router;

