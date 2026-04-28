/**
 * Chat Service
 * Handles all chatbot-related API calls
 * Pattern: Service Layer
 */
import httpClient from './http.client';

export const chatService = {
  /**
   * Send message to chatbot
   * @param {string} message - User message
   * @param {string|null} sessionId - Chat session ID
   * @returns {Promise<Object>} { reply, sessionId }
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
    return response.data || response;
  },

  /**
   * Clear chat session
   * @param {string} sessionId - Session ID to clear
   * @returns {Promise<void>}
   */
  async clearSession(sessionId) {
    if (!sessionId) return;
    await httpClient.delete(`/chatbot/session/${sessionId}`, {
      skipAuth: true,
      skipLoading: true,
    });
  },
};
