/**
 * Chat Service
 * Trợ lý cửa hàng — tra cứu sản phẩm từ database
 */
import httpClient from './http.client';

const unwrap = (response) => response?.data ?? response;

export const chatService = {
  /**
   * @returns {Promise<{ provider: string }>}
   */
  async getConfig() {
    const response = await httpClient.get('/chatbot/config', {
      skipAuth: true,
      skipLoading: true,
    });
    return unwrap(response);
  },

  /**
   * @param {string} message
   * @param {string|null} sessionId
   * @returns {Promise<{ reply: string, sessionId: string }>}
   */
  async sendMessage(message, sessionId = null) {
    const body = { message };
    if (sessionId) {
      body.sessionId = sessionId;
    }

    const response = await httpClient.post('/chatbot/message', body, {
      skipAuth: true,
      skipLoading: true,
    });

    return unwrap(response);
  },

  async clearSession(sessionId) {
    if (!sessionId) return;
    await httpClient.delete(`/chatbot/session/${sessionId}`, {
      skipAuth: true,
      skipLoading: true,
    });
  },
};
