/**
 * Upload Routes
 * Routes for file upload endpoints
 */
const express = require('express');
const router = express.Router();

const uploadController = require('../controllers/upload.controller');
const { authenticate, adminOnly } = require('../middlewares');
const { handleUpload } = require('../middlewares/upload.middleware');

// Protected routes (Admin only)
router.post('/image', authenticate, adminOnly, handleUpload, uploadController.uploadImage);
router.delete('/image/:filename', authenticate, adminOnly, uploadController.deleteImage);

module.exports = router;
