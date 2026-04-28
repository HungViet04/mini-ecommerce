/**
 * Chat Service Tests
 */
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { chatService } from '../../src/services/chat.service';
import httpClient from '../../src/services/http.client';

vi.mock('../../src/services/http.client', () => ({
  default: {
    post: vi.fn(),
    delete: vi.fn(),
  },
}));

describe('ChatService', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should send message without session id', async () => {
    httpClient.post.mockResolvedValueOnce({ data: { reply: 'hi', sessionId: 'abc' } });

    const result = await chatService.sendMessage('hello');

    expect(httpClient.post).toHaveBeenCalledWith(
      '/chatbot/message',
      { message: 'hello' },
      { skipAuth: true }
    );
    expect(result.reply).toBe('hi');
  });

  it('should send message with session id', async () => {
    httpClient.post.mockResolvedValueOnce({ data: { reply: 'ok' } });

    await chatService.sendMessage('hello', 'session-1');

    expect(httpClient.post).toHaveBeenCalledWith(
      '/chatbot/message',
      { message: 'hello', sessionId: 'session-1' },
      { skipAuth: true }
    );
  });

  it('should clear session when id provided', async () => {
    httpClient.delete.mockResolvedValueOnce({});

    await chatService.clearSession('session-1');

    expect(httpClient.delete).toHaveBeenCalledWith('/chatbot/session/session-1', {
      skipAuth: true,
    });
  });

  it('should not call clear when session id missing', async () => {
    await chatService.clearSession();

    expect(httpClient.delete).not.toHaveBeenCalled();
  });
});
