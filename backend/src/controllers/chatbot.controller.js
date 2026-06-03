/**
 * Chatbot Controller
 * Trợ lý cửa hàng — tra cứu dữ liệu từ database
 */
const { response } = require('../helpers');
const { asyncHandler } = require('../helpers/async.helper');
const { ValidationError } = require('../errors');
const chatbotService = require('../services/chatbot.service');

/**
 * GET /api/v1/chatbot/config
 */
const getConfig = asyncHandler(async (req, res) => {
  return response.success(res, {
    data: {
      provider: 'store',
      requiresApiKey: false,
    },
    message: 'Lấy cấu hình chatbot thành công',
  });
});

/**
 * POST /api/v1/chatbot/message
 */
const sendMessage = asyncHandler(async (req, res) => {
  const { message, sessionId } = req.body || {};

  if (typeof message !== 'string' || message.trim().length === 0) {
    throw new ValidationError('Tin nhắn không được để trống.');
  }

  const result = await chatbotService.processMessage({
    message: message.trim(),
    sessionId: sessionId || null,
  });

  return response.success(res, {
    data: {
      reply: result.reply,
      sessionId: result.sessionId,
    },
    message: 'Tra cứu từ cơ sở dữ liệu thành công',
    meta: {
      provider: result.provider || 'store',
    },
  });
});

/**
 * POST /api/v1/chatbot/analysis
 */
const analyzeMessage = asyncHandler(async (req, res) => {
  const { message } = req.body || {};

  if (typeof message !== 'string' || message.trim().length === 0) {
    throw new ValidationError('Tin nhắn không được để trống.');
  }

  const analysis = await chatbotService.analyzeMessage({ message: message.trim() });

  return res.json(analysis);
});

/**
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
  getConfig,
  sendMessage,
  analyzeMessage,
  clearSession,
};
