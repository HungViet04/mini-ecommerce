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
  chat: jest.fn(),
  clearSession: jest.fn(),
}));

const { response } = require('../../../src/helpers');
const { ValidationError } = require('../../../src/errors');
const chatbotService = require('../../../src/services/chatbot.service');
const chatbotController = require('../../../src/controllers/chatbot.controller');

describe('Chatbot Controller', () => {
  let req;
  let res;
  let next;

  beforeEach(() => {
    jest.clearAllMocks();
    req = { body: {}, params: {} };
    res = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn().mockReturnThis(),
    };
    next = jest.fn();
  });

  describe('sendMessage', () => {
    it('should send message successfully', async () => {
      req.body = { message: 'Xin chào' };
      chatbotService.chat.mockResolvedValueOnce({
        reply: 'Chào bạn!',
        sessionId: 'session_123',
      });

      await chatbotController.sendMessage(req, res, next);

      expect(chatbotService.chat).toHaveBeenCalledWith(
        'Xin chào',
        expect.stringMatching(/^session_/)
      );
      expect(response.success).toHaveBeenCalled();
    });

    it('should throw ValidationError for empty message', async () => {
      req.body = { message: '   ' };

      await expect(chatbotController.sendMessage(req, res, next)).rejects.toThrow(ValidationError);
      expect(chatbotService.chat).not.toHaveBeenCalled();
    });
  });

  describe('clearSession', () => {
    it('should clear chat session successfully', async () => {
      req.params = { sessionId: 'session_abc' };

      await chatbotController.clearSession(req, res, next);

      expect(chatbotService.clearSession).toHaveBeenCalledWith('session_abc');
      expect(response.success).toHaveBeenCalled();
    });
  });
});
