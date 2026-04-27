/**
 * Chatbot Service
 * RAG chatbot with DB retrieval + OpenAI generation
 */
const OpenAI = require('openai');
const config = require('../config');
const { productRepository, categoryRepository } = require('../repositories');
const logger = require('../utils/logger');

class ChatbotService {
  constructor() {
    this.client = null;
    this.modelName = 'gpt-4o-mini';
    this.maxTokens = 700;
    this.temperature = 0.3;
    this.chatSessions = new Map(); // sessionId -> { history, updatedAt }

    const openaiConfig = config?.openai || {};
    const apiKey = openaiConfig.apiKey;

    this.modelName = openaiConfig.model || this.modelName;
    this.maxTokens = Number.isFinite(openaiConfig.maxTokens)
      ? openaiConfig.maxTokens
      : this.maxTokens;
    this.temperature = Number.isFinite(openaiConfig.temperature)
      ? openaiConfig.temperature
      : this.temperature;

    if (apiKey) {
      const clientOptions = { apiKey };
      if (openaiConfig.baseURL) {
        clientOptions.baseURL = openaiConfig.baseURL;
      }
      this.client = new OpenAI(clientOptions);
    }
  }

  static MAX_AI_RETRIES = 2;
  static RETRY_DELAY_MS = 700;
  static MAX_RAG_PRODUCTS = 8;
  static SEARCH_FALLBACK_LIMIT = 12;
  static MAX_HISTORY_MESSAGES = 12;
  static SESSION_TTL_MS = 30 * 60 * 1000;
  static MAX_SESSIONS = 1000;

  /**
   * System prompt for shopping assistant behavior
   * @returns {string}
   */
  _getSystemPrompt() {
    return `Bạn là trợ lý AI của cửa hàng Mini E-Commerce.

Mục tiêu:
1. Tư vấn sản phẩm đúng nhu cầu khách hàng.
2. Trả lời ngắn gọn, rõ ràng, bằng tiếng Việt.
3. Chỉ sử dụng thông tin từ ngữ cảnh truy xuất (RAG) được cung cấp.

Quy tắc bắt buộc:
- Không bịa thông tin sản phẩm.
- Nếu thiếu dữ liệu, nói rõ là chưa có thông tin trong hệ thống.
- Khi đề cập sản phẩm cụ thể, luôn đính kèm link markdown: [Xem chi tiết](/products/{id}).
- Giá hiển thị theo định dạng VNĐ (ví dụ: 1.200.000₫).
- Khi gợi ý sản phẩm, ưu tiên sản phẩm còn hàng.
- Tập trung vào câu hỏi hiện tại, tránh trả lời lan man.`;
  }

  /**
   * Send message to chatbot and get response
   * @param {string} message - User message
   * @param {string} sessionId - Chat session ID
   * @returns {Promise<Object>} { reply, sessionId, fallback, fallbackReason }
   */
  async chat(message, sessionId) {
    const cleanMessage = String(message || '').trim();
    if (!cleanMessage) {
      throw new Error('Tin nhắn không được để trống.');
    }

    this._cleanupSessions();

    const history = this._getSessionHistory(sessionId);
    const ragResult = await this._retrieveContext(cleanMessage);

    if (!this.client) {
      const reply = await this._buildFallbackReply(ragResult);
      this._saveHistory(sessionId, history, cleanMessage, reply);
      return {
        reply,
        sessionId,
        fallback: true,
        fallbackReason: 'AI_MODEL_NOT_CONFIGURED',
      };
    }

    try {
      const reply = await this._askOpenAI({
        message: cleanMessage,
        history,
        ragContext: ragResult.context,
      });

      this._saveHistory(sessionId, history, cleanMessage, reply);
      return { reply, sessionId, fallback: false, fallbackReason: null };
    } catch (error) {
      logger.error('OpenAI chat failed, using fallback response', {
        sessionId,
        message: error.message,
        status: error.status,
        code: error.code,
      });

      const reply = await this._buildFallbackReply(ragResult);
      this._saveHistory(sessionId, history, cleanMessage, reply);
      return {
        reply,
        sessionId,
        fallback: true,
        fallbackReason: this._resolveFallbackReason(error),
      };
    }
  }

  _getSessionHistory(sessionId) {
    const existing = this.chatSessions.get(sessionId);
    if (!existing || !Array.isArray(existing.history)) {
      return [];
    }

    this.chatSessions.set(sessionId, {
      history: existing.history,
      updatedAt: Date.now(),
    });

    return existing.history;
  }

  async _askOpenAI({ message, history, ragContext }) {
    const conversationHistory = history.slice(-ChatbotService.MAX_HISTORY_MESSAGES);

    const messages = [
      { role: 'system', content: this._getSystemPrompt() },
      {
        role: 'system',
        content: `Ngữ cảnh truy xuất từ cơ sở dữ liệu (RAG):\n${ragContext}`,
      },
      ...conversationHistory,
      { role: 'user', content: message },
    ];

    const result = await this._sendCompletionWithRetry(messages);
    const reply = result?.choices?.[0]?.message?.content?.trim();

    if (!reply) {
      throw new Error('EMPTY_OPENAI_RESPONSE');
    }

    return reply;
  }

  async _sendCompletionWithRetry(messages) {
    let lastError = null;

    for (let attempt = 0; attempt <= ChatbotService.MAX_AI_RETRIES; attempt++) {
      try {
        return await this.client.chat.completions.create({
          model: this.modelName,
          messages,
          temperature: this.temperature,
          max_tokens: this.maxTokens,
        });
      } catch (error) {
        lastError = error;
        const canRetry = this._isRetryableOpenAIError(error);
        const hasMoreAttempts = attempt < ChatbotService.MAX_AI_RETRIES;

        if (!canRetry || !hasMoreAttempts) {
          throw error;
        }

        const delay = ChatbotService.RETRY_DELAY_MS * (attempt + 1);
        logger.warn('OpenAI transient error, retrying', {
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

  /**
   * Retrieve relevant products/categories from DB (RAG retrieval)
   * @param {string} message
   * @returns {Promise<{products: Array, context: string}>}
   */
  async _retrieveContext(message) {
    try {
      const categories = await categoryRepository.findAll();
      const categoryNameById = {};
      categories.forEach((category) => {
        categoryNameById[category.id] = category.name;
      });

      const tokens = this._extractSearchTokens(message);
      const categoryHints = this._detectCategoryHints(message, categories);
      const categoryIds = categoryHints.map((item) => item.id);
      const priceRange = this._extractPriceRange(message);

      const candidates = [];

      const hasSearchSignal =
        tokens.length > 0 ||
        categoryIds.length > 0 ||
        priceRange.min !== null ||
        priceRange.max !== null;

      if (hasSearchSignal) {
        const keyword = tokens.slice(0, 6).join(' ');
        const targetCategoryIds = categoryIds.length > 0 ? categoryIds.slice(0, 2) : [null];

        for (const categoryId of targetCategoryIds) {
          const result = await productRepository.searchAndFilter({
            keyword: keyword || undefined,
            categoryId: categoryId || undefined,
            minPrice: priceRange.min !== null ? priceRange.min : undefined,
            maxPrice: priceRange.max !== null ? priceRange.max : undefined,
            page: 1,
            limit: 20,
            orderBy: 'id',
            order: 'DESC',
          });

          candidates.push(...(result.items || []));
        }
      }

      if (candidates.length === 0 && tokens.length > 0) {
        const terms = tokens.slice(0, 3);
        for (const term of terms) {
          const rows = await productRepository.searchByName(term, { limit: 8 });
          candidates.push(...rows);
        }
      }

      if (candidates.length === 0 && categoryIds.length > 0) {
        for (const categoryId of categoryIds.slice(0, 2)) {
          const rows = await productRepository.findByCategory(categoryId, {
            limit: 8,
            orderBy: 'id',
            order: 'DESC',
          });
          candidates.push(...rows);
        }
      }

      if (candidates.length === 0) {
        const result = await productRepository.findWithPagination({
          page: 1,
          limit: ChatbotService.SEARCH_FALLBACK_LIMIT,
          orderBy: 'id',
          order: 'DESC',
        });
        candidates.push(...(result.items || []));
      }

      const uniqueCandidates = this._dedupeProducts(candidates);
      const rankedProducts = this._rankProducts(uniqueCandidates, {
        message,
        tokens,
        categoryIds,
        priceRange,
      });

      const products = rankedProducts.slice(0, ChatbotService.MAX_RAG_PRODUCTS);
      const context = this._buildRagContext(products, categoryNameById, {
        tokens,
        categoryHints,
        priceRange,
      });

      return { products, context };
    } catch (error) {
      logger.error('RAG retrieval failed', { message: error.message });
      return {
        products: [],
        context: 'Không thể truy xuất dữ liệu sản phẩm từ hệ thống ở thời điểm hiện tại.',
      };
    }
  }

  _buildRagContext(products, categoryNameById, retrievalSignals) {
    const lines = [];

    if (retrievalSignals.tokens.length > 0) {
      lines.push(`Từ khóa truy vấn: ${retrievalSignals.tokens.slice(0, 6).join(', ')}`);
    }

    if (retrievalSignals.categoryHints.length > 0) {
      lines.push(
        `Danh mục quan tâm: ${retrievalSignals.categoryHints.map((item) => item.name).join(', ')}`
      );
    }

    if (retrievalSignals.priceRange.min !== null || retrievalSignals.priceRange.max !== null) {
      const minLabel =
        retrievalSignals.priceRange.min !== null
          ? this._toVnd(retrievalSignals.priceRange.min)
          : 'không giới hạn';
      const maxLabel =
        retrievalSignals.priceRange.max !== null
          ? this._toVnd(retrievalSignals.priceRange.max)
          : 'không giới hạn';
      lines.push(`Khoảng giá mong muốn: ${minLabel} - ${maxLabel}`);
    }

    if (!products || products.length === 0) {
      lines.push('Không tìm thấy sản phẩm phù hợp trong cơ sở dữ liệu.');
      return lines.join('\n');
    }

    lines.push('Danh sách sản phẩm truy xuất từ DB:');
    products.forEach((product) => {
      lines.push(this._buildProductContextLine(product, categoryNameById));
    });

    return lines.join('\n');
  }

  _buildProductContextLine(product, categoryNameById) {
    const category =
      categoryNameById[product.category_id] || product.category_name || 'Chưa phân loại';
    const stock = Number(product.stock) > 0 ? `Còn ${product.stock}` : 'Hết hàng';
    const desc = product.description ? ` | Mô tả: ${product.description}` : '';

    return [
      `- ID: ${product.id}`,
      `Tên: ${product.name}`,
      `Giá: ${this._toVnd(product.price)}`,
      `Danh mục: ${category}`,
      `${stock}${desc}`,
      `Link: /products/${product.id}`,
    ].join(' | ');
  }

  _toVnd(value) {
    return `${Number(value || 0).toLocaleString('vi-VN')}₫`;
  }

  _extractSearchTokens(message) {
    const stopWords = new Set([
      'toi',
      'minh',
      'ban',
      'shop',
      'cho',
      'xin',
      'hay',
      'la',
      'va',
      'voi',
      'de',
      'duoc',
      'nhe',
      'giup',
      'tu',
      'van',
      'san',
      'pham',
      'gia',
      'bao',
      'nhieu',
      'can',
      'tim',
      'mua',
      'co',
      'khong',
      'nao',
      'mot',
      'nhung',
      'vay',
      'a',
      'o',
      'u',
      'uh',
    ]);

    const normalized = this._normalizeText(message).replace(/[^a-z0-9\s]/g, ' ');

    const tokens = normalized
      .split(/\s+/)
      .map((token) => token.trim())
      .filter((token) => token.length >= 2 && !stopWords.has(token));

    return Array.from(new Set(tokens));
  }

  _detectCategoryHints(message, categories) {
    const normalizedMessage = this._normalizeText(message);
    return categories.filter((category) => {
      const normalizedCategoryName = this._normalizeText(category.name || '');
      return (
        normalizedCategoryName.length > 1 && normalizedMessage.includes(normalizedCategoryName)
      );
    });
  }

  _extractPriceRange(message) {
    const normalized = this._normalizeText(message);
    const values = this._extractMoneyValues(message);

    if (values.length === 0) {
      return { min: null, max: null };
    }

    const first = values[0];
    const second = values[1] || null;
    const hasUpperBound = this._containsAny(normalized, [
      'duoi',
      'nho hon',
      'it hon',
      'toi da',
      'max',
      'under',
      'khong qua',
      '<=',
    ]);
    const hasLowerBound = this._containsAny(normalized, [
      'tren',
      'lon hon',
      'toi thieu',
      'it nhat',
      'min',
      'from',
      '>=',
    ]);
    const hasBetween =
      second !== null &&
      (this._containsAny(normalized, ['den', 'between']) ||
        (normalized.includes('tu ') && normalized.includes(' den ')));

    if (hasBetween) {
      return {
        min: Math.min(first, second),
        max: Math.max(first, second),
      };
    }

    if (hasUpperBound) {
      return { min: null, max: first };
    }

    if (hasLowerBound) {
      return { min: first, max: null };
    }

    if (second !== null) {
      return {
        min: Math.min(first, second),
        max: Math.max(first, second),
      };
    }

    if (this._containsAny(normalized, ['khoang', 'tam', 'gan'])) {
      return {
        min: Math.round(first * 0.8),
        max: Math.round(first * 1.2),
      };
    }

    return { min: null, max: null };
  }

  _extractMoneyValues(message) {
    const values = [];
    const regex = /(\d+(?:[.,]\d+)*)\s*(trieu|tr|m|nghin|ngan|k|vnd|dong|đ)?/gi;

    let match;
    while ((match = regex.exec(message)) !== null) {
      const rawNumber = match[1] || '';
      const unit = (match[2] || '').toLowerCase();

      const numericText = rawNumber.replace(/[.,](?=\d{3}(\D|$))/g, '').replace(',', '.');

      let amount = Number(numericText);
      if (!Number.isFinite(amount) || amount <= 0) {
        continue;
      }

      if (['trieu', 'tr', 'm'].includes(unit)) {
        amount *= 1000000;
      } else if (['nghin', 'ngan', 'k'].includes(unit)) {
        amount *= 1000;
      } else if (!unit && amount < 1000) {
        continue;
      }

      values.push(Math.round(amount));

      if (values.length >= 3) {
        break;
      }
    }

    return values;
  }

  _containsAny(text, phrases) {
    return phrases.some((phrase) => text.includes(phrase));
  }

  _normalizeText(text) {
    return String(text || '')
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '');
  }

  _dedupeProducts(products) {
    const map = new Map();
    products.forEach((product) => {
      if (!product || !product.id) {
        return;
      }
      if (!map.has(product.id)) {
        map.set(product.id, product);
      }
    });
    return Array.from(map.values());
  }

  _rankProducts(products, signals) {
    const normalizedMessage = this._normalizeText(signals.message);

    const ranked = products
      .map((product) => {
        const normalizedName = this._normalizeText(product.name || '');
        const normalizedDesc = this._normalizeText(product.description || '');

        let score = 0;

        signals.tokens.forEach((token) => {
          if (normalizedName.includes(token)) {
            score += 3;
          } else if (normalizedDesc.includes(token)) {
            score += 1;
          }
        });

        if (signals.categoryIds.includes(product.category_id)) {
          score += 4;
        }

        if (signals.priceRange.min !== null && Number(product.price) >= signals.priceRange.min) {
          score += 2;
        }
        if (signals.priceRange.max !== null && Number(product.price) <= signals.priceRange.max) {
          score += 2;
        }
        if (
          signals.priceRange.min !== null &&
          signals.priceRange.max !== null &&
          (Number(product.price) < signals.priceRange.min ||
            Number(product.price) > signals.priceRange.max)
        ) {
          score -= 2;
        }

        if (normalizedName && normalizedMessage.includes(normalizedName)) {
          score += 5;
        }

        if (Number(product.stock) > 0) {
          score += 1;
        } else {
          score -= 1;
        }

        return { product, score };
      })
      .sort((a, b) => {
        if (b.score !== a.score) {
          return b.score - a.score;
        }

        return Number(b.product.stock || 0) - Number(a.product.stock || 0);
      });

    return ranked.map((item) => item.product);
  }

  _isRetryableOpenAIError(error) {
    const status = Number(error?.status || 0);
    if ([408, 409, 429, 500, 502, 503, 504].includes(status)) {
      return true;
    }

    const code = String(error?.code || '').toLowerCase();
    const message = String(error?.message || '').toLowerCase();

    return (
      code.includes('rate_limit') ||
      code.includes('timeout') ||
      code.includes('temporarily_unavailable') ||
      message.includes('rate limit') ||
      message.includes('overloaded') ||
      message.includes('timed out')
    );
  }

  _resolveFallbackReason(error) {
    const status = Number(error?.status || 0);
    if (status === 401 || status === 403) {
      return 'AI_INVALID_API_KEY';
    }
    if (status === 429) {
      return 'AI_RATE_LIMITED';
    }
    if ([500, 502, 503, 504].includes(status)) {
      return 'AI_TEMPORARILY_UNAVAILABLE';
    }

    const code = String(error?.code || '').toLowerCase();
    if (code.includes('insufficient_quota')) {
      return 'AI_QUOTA_EXCEEDED';
    }

    return 'AI_UNKNOWN_ERROR';
  }

  _sleep(ms) {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }

  _saveHistory(sessionId, history, userMessage, botReply) {
    const nextHistory = [
      ...history,
      { role: 'user', content: userMessage },
      { role: 'assistant', content: botReply },
    ];

    const boundedHistory = nextHistory.slice(-ChatbotService.MAX_HISTORY_MESSAGES);

    this.chatSessions.set(sessionId, {
      history: boundedHistory,
      updatedAt: Date.now(),
    });

    this._cleanupSessions();
  }

  async _buildFallbackReply(ragResult) {
    const products = ragResult?.products || [];
    if (products.length > 0) {
      const topProducts = products.slice(0, 3).map((product) => {
        const stock = Number(product.stock) > 0 ? `Còn ${product.stock}` : 'Hết hàng';
        return `- ${product.name}: ${this._toVnd(product.price)} (${stock}) - [Xem chi tiết](/products/${product.id})`;
      });

      return [
        'Xin lỗi, OpenAI đang tạm thời gián đoạn. Mình gửi bạn gợi ý nhanh từ dữ liệu hệ thống:',
        '',
        ...topProducts,
      ].join('\n');
    }

    return 'Xin lỗi, hệ thống AI đang bận. Bạn vui lòng thử lại sau ít phút.';
  }

  /**
   * Cleanup expired chat sessions
   */
  _cleanupSessions() {
    const now = Date.now();

    for (const [sessionId, session] of this.chatSessions.entries()) {
      if (!session?.updatedAt || now - session.updatedAt > ChatbotService.SESSION_TTL_MS) {
        this.chatSessions.delete(sessionId);
      }
    }

    if (this.chatSessions.size > ChatbotService.MAX_SESSIONS) {
      const sortedByUpdatedAt = Array.from(this.chatSessions.entries()).sort(
        (a, b) => (a[1].updatedAt || 0) - (b[1].updatedAt || 0)
      );

      const removeCount = this.chatSessions.size - Math.floor(ChatbotService.MAX_SESSIONS / 2);
      for (let i = 0; i < removeCount; i++) {
        this.chatSessions.delete(sortedByUpdatedAt[i][0]);
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
