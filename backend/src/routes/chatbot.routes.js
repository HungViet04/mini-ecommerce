/**
 * Chatbot Routes
 * Routes for AI chatbot endpoints
 */
const express = require('express');
const router = express.Router();

const { chatbotController } = require('../controllers');

router.post('/message', chatbotController.sendMessage);
router.delete('/session/:sessionId', chatbotController.clearSession);

module.exports = router;
