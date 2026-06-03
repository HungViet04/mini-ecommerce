/**
 * Chatbot Controller Unit Tests
 */

jest.mock('../../../src/helpers/async.helper', () => ({
  asyncHandler: (fn) => fn,
}));

jest.mock('../../../src/helpers', () => ({
  response: {
    success: jest.fn((res, payload) => res.status(200).json(payload)),
  },
}));

jest.mock('../../../src/services/chatbot.service', () => ({
  processMessage: jest.fn(),
  clearSession: jest.fn(),
}));

const { response } = require('../../../src/helpers');
const { ValidationError } = require('../../../src/errors');
const chatbotService = require('../../../src/services/chatbot.service');
const chatbotController = require('../../../src/controllers/chatbot.controller');

describe('Chatbot Controller', () => {
  let req;
  let res;

  beforeEach(() => {
    jest.clearAllMocks();
    req = { body: {}, params: {} };
    res = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn().mockReturnThis(),
    };
  });

  describe('getConfig', () => {
    it('should return store provider', async () => {
      await chatbotController.getConfig(req, res);

      expect(response.success).toHaveBeenCalledWith(
        res,
        expect.objectContaining({
          data: { provider: 'store', requiresApiKey: false },
        })
      );
    });
  });

  describe('sendMessage', () => {
    it('should send message via processMessage', async () => {
      req.body = { message: 'Xin chào' };
      chatbotService.processMessage.mockResolvedValueOnce({
        reply: 'Chào bạn!',
        sessionId: 'session_123',
        provider: 'store',
      });

      await chatbotController.sendMessage(req, res);

      expect(chatbotService.processMessage).toHaveBeenCalledWith({
        message: 'Xin chào',
        sessionId: null,
      });
      expect(response.success).toHaveBeenCalled();
    });

    it('should throw ValidationError for empty message', async () => {
      req.body = { message: '   ' };

      await expect(chatbotController.sendMessage(req, res)).rejects.toThrow(ValidationError);
    });
  });

  describe('clearSession', () => {
    it('should clear chat session', async () => {
      req.params = { sessionId: 'session_abc' };

      await chatbotController.clearSession(req, res);

      expect(chatbotService.clearSession).toHaveBeenCalledWith('session_abc');
    });
  });
});
