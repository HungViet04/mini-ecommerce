/**
 * Chatbot Controller
 * Handles AI chatbot endpoints
 */
const { response } = require('../helpers');
const { asyncHandler } = require('../helpers/async.helper');
const { ValidationError } = require('../errors');
const chatbotService = require('../services/chatbot.service');

/**
 * Send message to chatbot
 * POST /api/v1/chatbot/message
 */
const sendMessage = asyncHandler(async (req, res) => {
  const { message, sessionId } = req.body || {};

  if (typeof message !== 'string' || message.trim().length === 0) {
    throw new ValidationError('Tin nhắn không được để trống.');
  }

  const chatSessionId =
    sessionId || `session_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;

  const result = await chatbotService.chat(message, chatSessionId);
  const { fallback = false, fallbackReason = null, ...data } = result;

  return response.success(res, {
    data,
    message: fallback ? 'Phản hồi từ chế độ dự phòng' : 'Phản hồi thành công',
    meta: {
      fallback,
      fallbackReason,
    },
  });
});

/**
 * Clear chat session
 * DELETE /api/v1/chatbot/session/:sessionId
 */
const clearSession = asyncHandler(async (req, res) => {
  const { sessionId } = req.params;

  chatbotService.clearSession(sessionId);

  return response.success(res, {
    message: 'Đã xóa phiên chat',
  });
});

module.exports = {
  sendMessage,
  clearSession,
};
