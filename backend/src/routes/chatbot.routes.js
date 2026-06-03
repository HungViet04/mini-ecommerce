/**
 * Chatbot Routes
 * Trợ lý cửa hàng — tra cứu database
 */
const express = require('express');
const router = express.Router();

const config = require('../config');
const { chatbotController } = require('../controllers');
const { ValidationError } = require('../errors');

const chatRateBuckets = new Map();

const getClientKey = (req) => {
  const forwarded = req.headers['x-forwarded-for'];
  if (typeof forwarded === 'string' && forwarded.length > 0) {
    return forwarded.split(',')[0].trim();
  }

  return req.ip || req.socket?.remoteAddress || 'unknown';
};

const pruneChatRateBuckets = (now, windowMs) => {
  if (chatRateBuckets.size < 500) {
    return;
  }

  for (const [key, bucket] of chatRateBuckets.entries()) {
    if (!bucket || now - bucket.windowStart >= windowMs) {
      chatRateBuckets.delete(key);
    }
  }
};

const chatbotRateLimit = (req, res, next) => {
  const windowMs = config.chatbot.rateLimitWindowMs;
  const maxRequests = config.chatbot.rateLimitMax;
  const now = Date.now();
  const key = getClientKey(req);

  pruneChatRateBuckets(now, windowMs);

  const currentBucket = chatRateBuckets.get(key);

  if (!currentBucket || now - currentBucket.windowStart >= windowMs) {
    chatRateBuckets.set(key, { count: 1, windowStart: now });
    return next();
  }

  if (currentBucket.count >= maxRequests) {
    const retryAfterSeconds = Math.max(
      1,
      Math.ceil((windowMs - (now - currentBucket.windowStart)) / 1000)
    );

    res.setHeader('Retry-After', String(retryAfterSeconds));
    return res.status(429).json({
      success: false,
      error: {
        code: 'RATE_LIMITED',
        message: `Bạn đang gửi quá nhiều yêu cầu chatbot. Vui lòng thử lại sau ${retryAfterSeconds} giây.`,
      },
    });
  }

  currentBucket.count += 1;
  chatRateBuckets.set(key, currentBucket);
  return next();
};

const validateChatMessageLength = (req, res, next) => {
  const message = req.body?.message;

  if (typeof message !== 'string') {
    return next(new ValidationError('Tin nhắn phải là chuỗi ký tự.'));
  }

  const trimmedMessage = message.trim();

  if (trimmedMessage.length === 0) {
    return next(new ValidationError('Tin nhắn không được để trống.'));
  }

  if (trimmedMessage.length > config.chatbot.messageMaxLength) {
    return next(new ValidationError(`Tin nhắn vượt quá ${config.chatbot.messageMaxLength} ký tự.`));
  }

  req.body.message = trimmedMessage;
  return next();
};

router.get('/config', chatbotController.getConfig);
router.post('/message', chatbotRateLimit, validateChatMessageLength, chatbotController.sendMessage);
router.post('/analysis', chatbotRateLimit, validateChatMessageLength, chatbotController.analyzeMessage);
router.delete('/session/:sessionId', chatbotRateLimit, chatbotController.clearSession);

module.exports = router;
