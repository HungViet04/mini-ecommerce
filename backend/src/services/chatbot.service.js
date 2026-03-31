/**
 * Chatbot Service
 * Handles AI chatbot logic using Google Gemini
 * Provides product consultation and shopping assistance
 */
const { GoogleGenerativeAI } = require('@google/generative-ai');
const config = require('../config');
const { productRepository } = require('../repositories');
const { categoryRepository } = require('../repositories');
const logger = require('../utils/logger');

class ChatbotService {
  constructor() {
    this.genAI = null;
    this.model = null;
    this.chatSessions = new Map(); // sessionId -> chat history

    const geminiConfig = config?.gemini || {};
    const apiKey = geminiConfig.apiKey;
    const modelName = geminiConfig.model || 'gemini-2.5-flash';

    if (apiKey) {
      this.genAI = new GoogleGenerativeAI(apiKey);
      this.model = this.genAI.getGenerativeModel({
        model: modelName,
        systemInstruction: this._getSystemPrompt(),
      });
    }
  }

  static MAX_AI_RETRIES = 2;
  static RETRY_DELAY_MS = 600;

  /**
   * Build system prompt with store context
   * @returns {string}
   */
  _getSystemPrompt() {
    return `Bạn là trợ lý AI của cửa hàng Mini E-Commerce. Nhiệm vụ của bạn là:

1. **Tư vấn sản phẩm**: Giới thiệu, so sánh và gợi ý sản phẩm phù hợp với nhu cầu khách hàng.
2. **Hỗ trợ mua hàng**: Hướng dẫn cách đặt hàng, thanh toán, theo dõi đơn hàng.
3. **Trả lời câu hỏi**: Về chính sách cửa hàng, vận chuyển, đổi trả, bảo hành.

Quy tắc:
- Luôn trả lời bằng tiếng Việt, thân thiện và chuyên nghiệp.
- Khi được hỏi về sản phẩm, hãy sử dụng thông tin sản phẩm thực tế được cung cấp.
- Khi nhắc đến sản phẩm cụ thể, luôn gắn link chi tiết theo định dạng markdown: [Xem chi tiết](/products/{id}).
- Giá hiển thị ở dạng VNĐ (ví dụ: 100.000₫).
- Nếu không có thông tin, hãy nói rõ và gợi ý khách liên hệ hỗ trợ.
- Không bịa thông tin sản phẩm nếu không có dữ liệu.
- Trả lời ngắn gọn, dễ hiểu, tập trung vào nhu cầu khách hàng.
- Khi gợi ý sản phẩm, luôn đề cập tên, giá và tình trạng còn hàng.`;
  }

  /**
   * Fetch product context from database for AI
   * @returns {Promise<string>}
   */
  async _getProductContext() {
    try {
      const result = await productRepository.findWithPagination({
        page: 1,
        limit: 100,
        orderBy: 'id',
        order: 'ASC',
      });

      const products = result.items || [];
      const categories = await categoryRepository.findAll();

      if (products.length === 0) {
        return 'Hiện tại cửa hàng chưa có sản phẩm nào.';
      }

      const categoryMap = {};
      if (categories && categories.length > 0) {
        categories.forEach((cat) => {
          categoryMap[cat.id] = cat.name;
        });
      }

      const productList = products
        .map((p) => {
          const category = categoryMap[p.category_id] || 'Chưa phân loại';
          const stock = p.stock > 0 ? `Còn ${p.stock} sản phẩm` : 'Hết hàng';
          const desc = p.description ? ` - ${p.description}` : '';
          return `- ${p.name}: ${Number(p.price).toLocaleString('vi-VN')}₫ | ${category} | ${stock}${desc} | [Xem chi tiết](/products/${p.id})`;
        })
        .join('\n');

      return `Danh sách sản phẩm hiện có trong cửa hàng:\n${productList}`;
    } catch (error) {
      return 'Không thể tải thông tin sản phẩm lúc này.';
    }
  }

  /**
   * Send message to chatbot and get response
   * @param {string} message - User message
   * @param {string} sessionId - Chat session ID
   * @returns {Promise<Object>} { reply, sessionId }
   */
  async chat(message, sessionId) {
    if (!message || message.trim().length === 0) {
      throw new Error('Tin nhắn không được để trống.');
    }

    // Get or create chat session
    let history = this.chatSessions.get(sessionId) || [];

    // Fetch product context for the first message or product-related queries
    let contextMessage = '';
    if (history.length === 0 || this._isProductQuery(message)) {
      const productContext = await this._getProductContext();
      contextMessage = `\n\n[Thông tin sản phẩm cửa hàng]:\n${productContext}\n\n`;
    }

    const fullMessage = contextMessage
      ? `${contextMessage}Câu hỏi của khách hàng: ${message}`
      : message;

    if (!this.model) {
      const reply = await this._buildFallbackReply(message);
      this._saveHistory(sessionId, history, fullMessage, reply);
      return {
        reply,
        sessionId,
        fallback: true,
        fallbackReason: 'AI_MODEL_NOT_CONFIGURED',
      };
    }

    try {
      const result = await this._sendMessageWithRetry(history, fullMessage);
      const reply = result.response.text();

      this._saveHistory(sessionId, history, fullMessage, reply);

      return { reply, sessionId, fallback: false, fallbackReason: null };
    } catch (error) {
      logger.error('Gemini chat failed, using fallback response', {
        sessionId,
        message: error.message,
        status: error.status,
        code: error.code,
      });

      const reply = await this._buildFallbackReply(message);
      this._saveHistory(sessionId, history, fullMessage, reply);
      return {
        reply,
        sessionId,
        fallback: true,
        fallbackReason: this._resolveFallbackReason(error),
      };
    }
  }

  async _sendMessageWithRetry(history, message) {
    let lastError = null;

    for (let attempt = 0; attempt <= ChatbotService.MAX_AI_RETRIES; attempt++) {
      try {
        const chat = this.model.startChat({ history });
        return await chat.sendMessage(message);
      } catch (error) {
        lastError = error;
        const canRetry = this._isRetryableGeminiError(error);
        const hasMoreAttempts = attempt < ChatbotService.MAX_AI_RETRIES;

        if (!canRetry || !hasMoreAttempts) {
          throw error;
        }

        const delay = ChatbotService.RETRY_DELAY_MS * (attempt + 1);
        logger.warn('Gemini transient error, retrying', {
          attempt: attempt + 1,
          delay,
          message: error.message,
          status: error.status,
          code: error.code,
        });

        await this._sleep(delay);
      }
    }

    throw lastError;
  }

  _isRetryableGeminiError(error) {
    const status = Number(error?.status || error?.response?.status || 0);
    if ([429, 500, 502, 503, 504].includes(status)) {
      return true;
    }

    const message = String(error?.message || '').toLowerCase();
    return (
      message.includes('overloaded') ||
      message.includes('rate limit') ||
      message.includes('temporarily unavailable')
    );
  }

  _resolveFallbackReason(error) {
    const status = Number(error?.status || error?.response?.status || 0);
    if (status === 429) {
      return 'AI_RATE_LIMITED';
    }
    if ([500, 502, 503, 504].includes(status)) {
      return 'AI_TEMPORARILY_UNAVAILABLE';
    }

    const message = String(error?.message || '').toLowerCase();
    if (message.includes('api key')) {
      return 'AI_INVALID_API_KEY';
    }
    if (message.includes('quota')) {
      return 'AI_QUOTA_EXCEEDED';
    }

    return 'AI_UNKNOWN_ERROR';
  }

  _sleep(ms) {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }

  _saveHistory(sessionId, history, userMessage, botReply) {
    history.push(
      { role: 'user', parts: [{ text: userMessage }] },
      { role: 'model', parts: [{ text: botReply }] }
    );

    if (history.length > 20) {
      history = history.slice(-20);
    }

    this.chatSessions.set(sessionId, history);
    this._cleanupSessions();
  }

  async _buildFallbackReply(message) {
    if (this._isProductQuery(message)) {
      // Try to find a specific product mentioned in the message
      try {
        const candidates = await productRepository.searchByName(message, { limit: 10 });
        if (candidates && candidates.length > 0) {
          const best = this._pickBestProductMatch(candidates, message);
          if (best) {
            const detail = await this._formatProductDetail(best);
            return `Xin lỗi, hệ thống AI đang bận nên mình trả lời tạm thời dựa trên dữ liệu cửa hàng.\n\n${detail}`;
          }
        }
      } catch (err) {
        logger.warn('Fallback product lookup failed', { message: err.message });
      }

      const suggestions = await this._getQuickProductSuggestions();
      return suggestions
        ? `Xin lỗi, hệ thống AI đang bận nên mình trả lời tạm thời dựa trên dữ liệu cửa hàng.\n\n${suggestions}`
        : 'Xin lỗi, hệ thống AI đang bận. Bạn vui lòng thử lại sau ít phút hoặc đặt câu hỏi ngắn gọn hơn.';
    }

    return 'Xin lỗi, hệ thống AI đang bận. Bạn vui lòng thử lại sau ít phút hoặc đặt câu hỏi ngắn gọn hơn.';
  }

  _pickBestProductMatch(products, message) {
    const lowerMsg = message.toLowerCase();
    const tokens = lowerMsg
      .replace(/[^a-z0-9\u00C0-\u017Fa-z\s]/gi, ' ')
      .split(/\s+/)
      .filter(Boolean);

    let best = null;
    let bestScore = -1;

    for (const p of products) {
      const name = (p.name || '').toLowerCase();
      let score = 0;
      for (const t of tokens) {
        if (t.length < 2) continue;
        if (name.includes(t)) score += 1;
      }

      // give bonus if full name appears
      if (name === lowerMsg || lowerMsg.includes(name)) {
        score += 5;
      }

      if (score > bestScore) {
        bestScore = score;
        best = p;
      }
    }

    // If all scores are zero but only one candidate, use it
    if (bestScore <= 0 && products.length === 1) {
      return products[0];
    }

    return bestScore > 0 ? best : null;
  }

  async _formatProductDetail(product) {
    try {
      const category = product.category_id
        ? await categoryRepository.findById(product.category_id)
        : null;

      const priceStr = Number(product.price).toLocaleString('vi-VN') + '₫';
      const stockStr = product.stock > 0 ? `Còn ${product.stock}` : 'Hết hàng';
      const desc = product.description ? product.description : 'Không có mô tả.';
      const categoryName = category ? category.name : 'Chưa phân loại';

      const lines = [];
      lines.push(`Tên: ${product.name}`);
      lines.push(`Giá: ${priceStr}`);
      lines.push(`Tình trạng: ${stockStr}`);
      lines.push(`Danh mục: ${categoryName}`);
      lines.push(`Mô tả: ${desc}`);
      lines.push(`Xem chi tiết: [${product.name}](/products/${product.id})`);
      if (product.image_url) {
        lines.push(`Hình ảnh: ${product.image_url}`);
      }

      return lines.join('\n');
    } catch (err) {
      logger.warn('Format product detail failed', { message: err.message });
      return `- ${product.name}: ${Number(product.price).toLocaleString('vi-VN')}₫ (${product.stock > 0 ? `Còn ${product.stock}` : 'Hết hàng'})`;
    }
  }

  async _getQuickProductSuggestions() {
    try {
      const result = await productRepository.findWithPagination({
        page: 1,
        limit: 5,
        orderBy: 'id',
        order: 'ASC',
      });

      const products = result.items || [];
      if (products.length === 0) {
        return '';
      }

      const lines = products.map((item) => {
        const stock = item.stock > 0 ? `Còn ${item.stock}` : 'Hết hàng';
        return `- ${item.name}: ${Number(item.price).toLocaleString('vi-VN')}₫ (${stock}) - [Xem chi tiết](/products/${item.id})`;
      });

      return `Một số sản phẩm đang có:\n${lines.join('\n')}`;
    } catch (error) {
      return '';
    }
  }

  /**
   * Check if message is product-related
   * @param {string} message
   * @returns {boolean}
   */
  _isProductQuery(message) {
    const productKeywords = [
      'sản phẩm',
      'thông tin',
      'chi tiết',
      'hàng',
      'mua',
      'giá',
      'bao nhiêu',
      'còn không',
      'tìm',
      'gợi ý',
      'tư vấn',
      'so sánh',
      'rẻ',
      'đắt',
      'loại',
      'danh mục',
      'category',
      'product',
      'price',
      'stock',
      'recommend',
    ];
    const lowerMessage = message.toLowerCase();
    return productKeywords.some((keyword) => lowerMessage.includes(keyword));
  }

  /**
   * Cleanup expired chat sessions (older than 30 minutes)
   */
  _cleanupSessions() {
    // Simple cleanup: if too many sessions, remove oldest ones
    if (this.chatSessions.size > 1000) {
      const keys = Array.from(this.chatSessions.keys());
      const removeCount = keys.length - 500;
      for (let i = 0; i < removeCount; i++) {
        this.chatSessions.delete(keys[i]);
      }
    }
  }

  /**
   * Clear a specific chat session
   * @param {string} sessionId
   */
  clearSession(sessionId) {
    this.chatSessions.delete(sessionId);
  }
}

module.exports = new ChatbotService();
