/**
 * Health Routes
 * Routes for health check endpoints
 */
const express = require('express');
const router = express.Router();

const { healthController } = require('../controllers');

router.get('/', healthController.check);
router.get('/ping', healthController.ping);
router.get('/db', healthController.db);

module.exports = router;
