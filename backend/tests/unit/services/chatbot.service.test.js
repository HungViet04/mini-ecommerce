/**
 * Chatbot Service Unit Tests
 */

const loadChatbotService = ({ apiKey = '', sendError = false } = {}) => {
  jest.resetModules();

  jest.doMock('../../../src/config', () => ({
    openai: {
      apiKey,
      model: 'gpt-4o-mini',
    },
  }));

  jest.doMock('../../../src/repositories', () => ({
    productRepository: {
      findWithPagination: jest.fn().mockResolvedValue({ items: [] }),
    },
    categoryRepository: {
      findAll: jest.fn().mockResolvedValue([]),
    },
  }));

  jest.doMock('openai', () => {
    return function OpenAI() {
      return {
        chat: {
          completions: {
            create: sendError
              ? jest.fn().mockRejectedValue(new Error('OpenAI unavailable'))
              : jest.fn().mockResolvedValue({
                  choices: [{ message: { content: 'AI response' } }],
                }),
          },
        },
      };
    };
  });

  const service = require('../../../src/services/chatbot.service');
  return { service };
};

describe('ChatbotService', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should return fallback reply when OpenAI is not configured', async () => {
    const { service } = loadChatbotService({ apiKey: '' });

    const result = await service.chat('Tư vấn sản phẩm giá rẻ', 'session_test_1');

    expect(result).toHaveProperty('sessionId', 'session_test_1');
    expect(result.reply).toContain('hệ thống AI đang bận');
  });

  it('should return fallback reply when OpenAI provider fails', async () => {
    const { service } = loadChatbotService({ apiKey: 'test-key', sendError: true });

    const result = await service.chat('Có sản phẩm nào?', 'session_test_2');

    expect(result).toHaveProperty('sessionId', 'session_test_2');
    expect(result.reply).toContain('hệ thống AI đang bận');
  });
});
