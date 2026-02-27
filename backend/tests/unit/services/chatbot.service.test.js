/**
 * Chatbot Service Unit Tests
 */

const loadChatbotService = ({ apiKey = '', sendError = false } = {}) => {
  jest.resetModules();

  jest.doMock('../../../src/config', () => ({
    gemini: {
      apiKey,
      model: 'gemini-2.5-flash',
    },
  }));

  jest.doMock('../../../src/repositories', () => ({
    productRepository: {
      findWithPagination: jest.fn().mockResolvedValue({
        items: [
          { id: 1, name: 'Áo thun basic', price: 199000, stock: 10 },
          { id: 2, name: 'Quần jean', price: 399000, stock: 0 },
        ],
      }),
    },
    categoryRepository: {
      findAll: jest.fn().mockResolvedValue([]),
    },
  }));

  const sendMessage = sendError
    ? jest.fn().mockRejectedValue(new Error('Gemini unavailable'))
    : jest.fn().mockResolvedValue({
        response: {
          text: () => 'AI response',
        },
      });
  const startChat = jest.fn().mockReturnValue({ sendMessage });

  jest.doMock('@google/generative-ai', () => ({
    GoogleGenerativeAI: jest.fn().mockImplementation(() => ({
      getGenerativeModel: jest.fn().mockReturnValue({ startChat }),
    })),
  }));

  const service = require('../../../src/services/chatbot.service');
  return { service };
};

describe('ChatbotService', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should return fallback reply when Gemini is not configured', async () => {
    const { service } = loadChatbotService({ apiKey: '' });

    const result = await service.chat('Tư vấn sản phẩm giá rẻ', 'session_test_1');

    expect(result).toHaveProperty('sessionId', 'session_test_1');
    expect(result.reply).toContain('hệ thống AI đang bận');
  });

  it('should return fallback reply when Gemini provider fails', async () => {
    const { service } = loadChatbotService({ apiKey: 'test-key', sendError: true });

    const result = await service.chat('Có sản phẩm nào?', 'session_test_2');

    expect(result).toHaveProperty('sessionId', 'session_test_2');
    expect(result.reply).toContain('hệ thống AI đang bận');
  });
});
