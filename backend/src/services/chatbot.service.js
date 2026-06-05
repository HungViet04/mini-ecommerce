/**
 * Chatbot Service
 * Trợ lý cửa hàng — truy vấn sản phẩm/danh mục từ database
 */
const { productRepository, categoryRepository } = require('../repositories');
const logger = require('../utils/logger');

class ChatbotService {
  constructor() {
    this.chatSessions = new Map(); // sessionId -> { history, updatedAt }
  }

  static MAX_RAG_PRODUCTS = 8;
  static SEARCH_FALLBACK_LIMIT = 12;
  static MAX_HISTORY_MESSAGES = 12;
  static SESSION_TTL_MS = 30 * 60 * 1000;
  static MAX_SESSIONS = 1000;

  /** Nhóm từ khóa sản phẩm — tránh nhầm "điện" với "Điện tử" */
  static PRODUCT_INTENTS = [
    {
      id: 'phone',
      triggers: ['dien thoai', 'smartphone', 'dtdd', 'di dong', 'mobile phone'],
      searchTerms: ['dien thoai', 'smartphone', 'iphone', 'galaxy', 'phone'],
      categoryNames: ['dien thoai'],
      excludePatterns: [
        'laptop',
        'notebook',
        'macbook',
        'tai nghe',
        'headphone',
        'earphone',
        'airpods',
        'watch',
        'dong ho',
        'loa',
        'speaker',
        'tablet',
        'may tinh',
      ],
    },
    {
      id: 'laptop',
      triggers: ['laptop', 'may tinh', 'notebook', 'macbook'],
      searchTerms: ['laptop', 'notebook', 'macbook'],
      categoryNames: ['laptop', 'may tinh', 'dien tu'],
      excludePatterns: ['dien thoai', 'iphone', 'galaxy', 'tai nghe', 'headphone', 'watch'],
    },
    {
      id: 'headphone',
      triggers: ['tai nghe', 'headphone', 'earphone', 'airpods'],
      searchTerms: ['tai nghe', 'headphone', 'earphone', 'airpods'],
      categoryNames: ['tai nghe', 'am thanh', 'dien tu'],
      excludePatterns: ['laptop', 'dien thoai', 'iphone', 'galaxy', 'watch'],
    },
  ];

  static ANALYSIS_BRANDS = [
    { label: 'Apple', key: 'apple' },
    { label: 'Asus', key: 'asus' },
    { label: 'Acer', key: 'acer' },
    { label: 'Dell', key: 'dell' },
    { label: 'HP', key: 'hp' },
    { label: 'Lenovo', key: 'lenovo' },
    { label: 'MSI', key: 'msi' },
    { label: 'Samsung', key: 'samsung' },
    { label: 'Xiaomi', key: 'xiaomi' },
    { label: 'Oppo', key: 'oppo' },
    { label: 'Vivo', key: 'vivo' },
    { label: 'Realme', key: 'realme' },
    { label: 'Google', key: 'google' },
    { label: 'OnePlus', key: 'oneplus' },
    { label: 'Huawei', key: 'huawei' },
    { label: 'Honor', key: 'honor' },
    { label: 'Nokia', key: 'nokia' },
    { label: 'Motorola', key: 'motorola' },
    { label: 'Tecno', key: 'tecno' },
    { label: 'Infinix', key: 'infinix' },
    { label: 'Nothing', key: 'nothing' },
    { label: 'QCY', key: 'qcy' },
    { label: 'Haylou', key: 'haylou' },
    { label: 'Logitech', key: 'logitech' },
    { label: 'Razer', key: 'razer' },
    { label: 'Corsair', key: 'corsair' },
    { label: 'Sony', key: 'sony' },
    { label: 'JBL', key: 'jbl' },
    { label: 'Bose', key: 'bose' },
    { label: 'Sennheiser', key: 'sennheiser' },
    { label: 'Audio-Technica', key: 'audio technica' },
    { label: 'Audio-Technica', key: 'audio-technica' },
    { label: 'Beats', key: 'beats' },
    { label: 'Marshall', key: 'marshall' },
    { label: 'Skullcandy', key: 'skullcandy' },
    { label: 'Jabra', key: 'jabra' },
    { label: 'AKG', key: 'akg' },
    { label: 'Edifier', key: 'edifier' },
    { label: 'Soundcore', key: 'soundcore' },
    { label: 'Anker', key: 'anker' },
    { label: 'HyperX', key: 'hyperx' },
    { label: 'SteelSeries', key: 'steelseries' },
    { label: 'Baseus', key: 'baseus' },
    { label: 'UGREEN', key: 'ugreen' },
    { label: 'Belkin', key: 'belkin' },
    { label: 'Spigen', key: 'spigen' },
    { label: 'ESR', key: 'esr' },
    { label: 'Aukey', key: 'aukey' },
    { label: 'Gigabyte', key: 'gigabyte' },
    { label: 'Microsoft', key: 'microsoft' },
    { label: 'LG', key: 'lg' },
    { label: 'Garmin', key: 'garmin' },
    { label: 'Fitbit', key: 'fitbit' },
    { label: 'Amazfit', key: 'amazfit' },
    { label: 'Casio', key: 'casio' },
    { label: 'Suunto', key: 'suunto' },
    { label: 'Intel', key: 'intel' },
    { label: 'AMD', key: 'amd' },
    { label: 'Nvidia', key: 'nvidia' },
  ];

  static ANALYSIS_CATEGORY_ALIASES = [
    { label: 'Laptop', key: 'laptop' },
    { label: 'Chuột', key: 'chuot' },
    { label: 'Bàn phím', key: 'ban phim' },
    { label: 'Tai nghe', key: 'tai nghe' },
    { label: 'Tai nghe', key: 'headphone' },
    { label: 'Tai nghe', key: 'headphones' },
    { label: 'Tai nghe', key: 'earphone' },
    { label: 'Tai nghe', key: 'earphones' },
    { label: 'Tai nghe', key: 'earbud' },
    { label: 'Tai nghe', key: 'earbuds' },
    { label: 'Tai nghe', key: 'headset' },
    { label: 'Tai nghe', key: 'tws' },
    { label: 'Tai nghe', key: 'true wireless' },
    { label: 'Tai nghe', key: 'tai nghe bluetooth' },
    { label: 'Tai nghe', key: 'tai nghe khong day' },
    { label: 'Tai nghe', key: 'tai nghe gaming' },
    { label: 'Điện thoại', key: 'dien thoai' },
    { label: 'Màn hình', key: 'man hinh' },
    { label: 'Loa', key: 'loa' },
    { label: 'Máy tính', key: 'may tinh' },
    { label: 'Phụ kiện', key: 'phu kien' },
    { label: 'Phụ kiện', key: 'op lung' },
    { label: 'Phụ kiện', key: 'case' },
    { label: 'Phụ kiện', key: 'cap sac' },
    { label: 'Phụ kiện', key: 'cap' },
    { label: 'Phụ kiện', key: 'charger' },
    { label: 'Phụ kiện', key: 'adapter' },
    { label: 'Phụ kiện', key: 'hub' },
    { label: 'Phụ kiện', key: 'dock' },
    { label: 'Phụ kiện', key: 'pin du phong' },
    { label: 'Phụ kiện', key: 'power bank' },
    { label: 'Phụ kiện', key: 'cu sac' },
    { label: 'Phụ kiện', key: 'sac nhanh' },
    { label: 'Đồng hồ', key: 'dong ho' },
    { label: 'Đồng hồ', key: 'watch' },
    { label: 'Đồng hồ', key: 'smartwatch' },
    { label: 'Đồng hồ', key: 'smart watch' },
    { label: 'Đồng hồ', key: 'dong ho thong minh' },
    { label: 'Đồng hồ', key: 'vong tay thong minh' },
    { label: 'Đồng hồ', key: 'smart band' },
  ];

  static ANALYSIS_GREETING_TERMS = ['xin chao', 'chao ban', 'hello', 'hi', 'hey'];

  static ANALYSIS_PROMOTION_TERMS = [
    'khuyen mai',
    'giam gia',
    'sale',
    'discount',
    'voucher',
    'coupon',
    'deal',
  ];

  static ANALYSIS_STOCK_TERMS = ['con hang', 'co hang', 'available', 'in stock'];

  static ANALYSIS_DETAIL_TERMS = ['chi tiet', 'thong tin', 'spec', 'cau hinh'];

  static ANALYSIS_USAGE_TERMS = {
    gaming: [
      'gaming',
      'choi game',
      'chien game',
      'esport',
      'fps',
      'valorant',
      'lol',
      'csgo',
      'pubg',
    ],
    office: ['van phong', 'office', 'word', 'excel', 'powerpoint', 'pp'],
    study: ['hoc', 'hoc tap', 'sinh vien', 'on thi'],
    programming: ['lap trinh', 'code', 'coding', 'developer', 'dev'],
    designer: [
      'thiet ke',
      'designer',
      'photoshop',
      'illustrator',
      'premiere',
      'after effect',
      '3d',
      'render',
    ],
    streaming: ['stream', 'livestream', 'streaming', 'obs', 'twitch', 'youtube live'],
  };

  static ANALYSIS_RECOMMEND_TERMS = [
    'nen mua',
    'nen chon',
    'goi y',
    'tu van',
    'phu hop',
    'recommend',
    'de xuat',
    'chon gi',
  ];

  static ANALYSIS_CATEGORY_QUERY_TERMS = ['danh muc', 'loai', 'category', 'phan loai'];

  static ANALYSIS_INCLUDE_CUES = [
    'chi thich',
    'chi muon',
    'uu tien',
    'prefer',
    'only',
    'yeu thich',
  ];

  static ANALYSIS_EXCLUDE_CUES = [
    'khong thich',
    'khong muon',
    'khong chon',
    'khong dung',
    'tranh',
    'loai',
    'exclude',
    'avoid',
  ];

  /**
   * Xử lý tin nhắn — tra cứu DB và trả lời
   * @param {Object} params
   * @param {string} params.message
   * @param {string} [params.sessionId]
   * @returns {Promise<Object>}
   */
  async processMessage({ message, sessionId = null }) {
    const cleanMessage = String(message || '').trim();
    if (!cleanMessage) {
      throw new Error('Tin nhắn không được để trống.');
    }

    const ragResult = await this._retrieveContext(cleanMessage);
    const chatSessionId =
      sessionId || `session_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;

    return this._chatWithDatabase(cleanMessage, chatSessionId, ragResult);
  }

  async chat(message, sessionId) {
    return this.processMessage({ message, sessionId });
  }

  async analyzeMessage({ message }) {
    const cleanMessage = String(message || '').trim();
    if (!cleanMessage) {
      throw new Error('Tin nhắn không được để trống.');
    }

    let categories = [];
    try {
      categories = await categoryRepository.findAll();
    } catch (error) {
      logger.error('Chatbot analysis category load failed', { message: error.message });
    }

    return this._analyzeMessage(cleanMessage, categories);
  }

  async _chatWithDatabase(message, sessionId, ragResult) {
    const cleanMessage = String(message || '').trim();
    this._cleanupSessions();
    const history = this._getSessionHistory(sessionId);
    const reply = await this._buildDatabaseReply(cleanMessage, ragResult);

    this._saveHistory(sessionId, history, cleanMessage, reply);
    return {
      reply,
      sessionId,
      provider: 'store',
    };
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

  /**
   * Retrieve relevant products/categories from DB
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

      const searchPlan = this._buildSearchPlan(message, categories);
      const {
        tokens,
        phrases,
        categoryHints,
        categoryIds,
        priceRange,
        hasSpecificQuery,
        productIntent,
        productSearchTerms,
        brandHint,
      } = searchPlan;

      const normalizedMessage = this._normalizeText(message);
      const explicitCategory = this._findExactCategoryMatch(normalizedMessage, categories);
      const explicitCategoryQuery = explicitCategory
        ? this._isExplicitCategoryQuery(
            normalizedMessage,
            this._normalizeText(explicitCategory.name)
          )
        : false;

      let explicitProductName = this._extractExplicitProductName(message);
      if (!explicitProductName && message.trim().length <= 40) {
        explicitProductName = this._extractProductName(message, normalizedMessage, {
          category: explicitCategory?.name || '',
          brand: '',
          priceRange,
        });
      }

      if (explicitProductName) {
        const exactProducts = await productRepository.findByExactName(explicitProductName, {
          limit: 10,
        });

        if (exactProducts.length > 0) {
          const matchedKeywords = [explicitProductName];
          const context = this._buildRagContext(exactProducts, categoryNameById, {
            tokens,
            phrases,
            categoryHints,
            priceRange,
            matchedKeywords,
          });

          return {
            products: exactProducts,
            context,
            matchedKeywords,
            categoryHints,
            hasSpecificQuery: true,
            noMatch: false,
          };
        }
      }

      if (explicitCategoryQuery && explicitCategory) {
        const categoryProducts = await productRepository.findByCategory(explicitCategory.id, {
          limit: 20,
          orderBy: 'id',
          order: 'DESC',
        });
        const filteredCategoryProducts = brandHint
          ? this._filterByBrand(categoryProducts, brandHint)
          : categoryProducts;
        const matchedKeywords = [explicitCategory.name];
        const context = this._buildRagContext(filteredCategoryProducts, categoryNameById, {
          tokens,
          phrases,
          categoryHints: [explicitCategory],
          priceRange,
          matchedKeywords,
        });

        return {
          products: filteredCategoryProducts,
          context,
          matchedKeywords,
          categoryHints: [explicitCategory],
          hasSpecificQuery: true,
          noMatch: filteredCategoryProducts.length === 0,
        };
      }

      const intentCategoryIds = this._resolveIntentCategoryIds(productIntent, categories);
      const effectiveCategoryIds =
        intentCategoryIds.length > 0
          ? intentCategoryIds
          : categoryIds.length > 0
            ? categoryIds
            : [];

      const candidates = [];
      const searchedTerms = new Set();

      const runTextSearch = async (term, limit = 12) => {
        const key = String(term || '')
          .trim()
          .toLowerCase();
        if (!key || key.length < 3 || searchedTerms.has(key)) {
          return;
        }
        if (this._isPriceOrNoiseTerm(key)) {
          return;
        }
        searchedTerms.add(key);
        const rows = await productRepository.searchByText(term, { limit });
        candidates.push(...rows);
      };

      const termsToSearch =
        productSearchTerms.length > 0 ? productSearchTerms : [...phrases, ...tokens];

      if (brandHint?.label && !termsToSearch.some((term) => term === brandHint.label)) {
        termsToSearch.unshift(brandHint.label);
      }

      for (const term of termsToSearch) {
        await runTextSearch(term, 15);
      }

      for (const categoryId of effectiveCategoryIds) {
        const rows = await productRepository.findByCategory(categoryId, {
          limit: 20,
          orderBy: 'id',
          order: 'DESC',
        });
        candidates.push(...rows);
      }

      const hasProductTerms = productSearchTerms.length > 0 || effectiveCategoryIds.length > 0;
      const brandKeyword = brandHint?.label || null;
      const productKeyword =
        brandKeyword && effectiveCategoryIds.length > 0
          ? brandKeyword
          : productSearchTerms[0] || phrases.find((p) => p.length >= 3);

      if (hasSpecificQuery && (hasProductTerms || !productIntent)) {
        const filterTargets =
          effectiveCategoryIds.length > 0 ? effectiveCategoryIds : productIntent ? [] : [null];

        if (filterTargets.length === 0 && productIntent) {
          // Chỉ lọc theo tên/mô tả khi có intent nhưng chưa khớp danh mục
          for (const term of productSearchTerms) {
            const result = await productRepository.searchAndFilter({
              keyword: term,
              minPrice: priceRange.min !== null ? priceRange.min : undefined,
              maxPrice: priceRange.max !== null ? priceRange.max : undefined,
              page: 1,
              limit: 20,
              orderBy: 'price',
              order: 'ASC',
            });
            candidates.push(...(result.items || []));
          }
        } else {
          for (const categoryId of filterTargets) {
            const result = await productRepository.searchAndFilter({
              keyword: productKeyword || undefined,
              categoryId: categoryId || undefined,
              minPrice: priceRange.min !== null ? priceRange.min : undefined,
              maxPrice: priceRange.max !== null ? priceRange.max : undefined,
              page: 1,
              limit: 20,
              orderBy: 'price',
              order: 'ASC',
            });
            candidates.push(...(result.items || []));
          }
        }
      } else if (hasSpecificQuery && priceRange.min === null && priceRange.max === null) {
        const combinedKeyword = productKeyword || tokens.slice(0, 3).join(' ');
        if (combinedKeyword) {
          const result = await productRepository.searchAndFilter({
            keyword: combinedKeyword,
            page: 1,
            limit: 20,
            orderBy: 'id',
            order: 'DESC',
          });
          candidates.push(...(result.items || []));
        }
      }

      // Chỉ hiện sản phẩm ngẫu nhiên khi người dùng không hỏi cụ thể
      if (candidates.length === 0 && !hasSpecificQuery) {
        const result = await productRepository.findWithPagination({
          page: 1,
          limit: ChatbotService.SEARCH_FALLBACK_LIMIT,
          orderBy: 'id',
          order: 'DESC',
        });
        candidates.push(...(result.items || []));
      }

      let uniqueCandidates = this._dedupeProducts(candidates);
      uniqueCandidates = this._applyPriceFilter(uniqueCandidates, priceRange);
      uniqueCandidates = this._filterByProductIntent(uniqueCandidates, productIntent, categories);
      uniqueCandidates = this._filterByBrand(uniqueCandidates, brandHint);

      const rankedProducts = this._rankProducts(uniqueCandidates, {
        message,
        tokens,
        phrases,
        categoryIds: effectiveCategoryIds,
        priceRange,
        productIntent,
        productSearchTerms,
      });

      const products = rankedProducts.slice(0, ChatbotService.MAX_RAG_PRODUCTS);
      const matchedKeywords = [...phrases, ...tokens].slice(0, 6);
      const context = this._buildRagContext(products, categoryNameById, {
        tokens,
        phrases,
        categoryHints,
        priceRange,
        matchedKeywords,
      });

      return {
        products,
        context,
        matchedKeywords,
        categoryHints,
        hasSpecificQuery,
        noMatch: hasSpecificQuery && products.length === 0,
      };
    } catch (error) {
      logger.error('RAG retrieval failed', { message: error.message });
      return {
        products: [],
        context: 'Không thể truy xuất dữ liệu sản phẩm từ hệ thống ở thời điểm hiện tại.',
        matchedKeywords: [],
        hasSpecificQuery: true,
        noMatch: true,
      };
    }
  }

  /**
   * Build search tokens/phrases from user message + category catalog
   * @param {string} message
   * @param {Array} categories
   * @returns {Object}
   */
  _buildSearchPlan(message, categories) {
    const normalizedMessage = this._normalizeText(message);
    const tokens = this._extractSearchTokens(message);
    const phrases = this._extractSearchPhrases(message, tokens);
    const categoryHints = this._detectCategoryHints(message, categories);
    const categoryIds = categoryHints.map((item) => item.id);
    const priceRange = this._extractPriceRange(message);
    const productIntent = this._resolveProductIntent(message);
    const productSearchTerms = productIntent ? [...productIntent.searchTerms] : [];
    const brandHint = this._matchBrand(normalizedMessage);

    const hasSpecificQuery =
      tokens.length > 0 ||
      phrases.length > 0 ||
      categoryIds.length > 0 ||
      productIntent !== null ||
      brandHint !== null ||
      priceRange.min !== null ||
      priceRange.max !== null;

    return {
      tokens,
      phrases,
      categoryHints,
      categoryIds,
      priceRange,
      hasSpecificQuery,
      productIntent,
      productSearchTerms,
      brandHint,
    };
  }

  _resolveProductIntent(message) {
    const normalized = this._normalizeText(message);

    for (const intent of ChatbotService.PRODUCT_INTENTS) {
      const matched = intent.triggers.some((trigger) => normalized.includes(trigger));
      if (matched) {
        return intent;
      }
    }

    return null;
  }

  _resolveIntentCategoryIds(productIntent, categories) {
    if (!productIntent) {
      return [];
    }

    return categories
      .filter((category) => {
        const normalizedCategoryName = this._normalizeText(category.name || '');
        return productIntent.categoryNames.some(
          (name) =>
            normalizedCategoryName === name ||
            normalizedCategoryName.includes(name) ||
            name.includes(normalizedCategoryName)
        );
      })
      .map((category) => category.id);
  }

  _filterByProductIntent(products, productIntent, categories) {
    if (!productIntent || !Array.isArray(products)) {
      return products;
    }

    const categoryNameById = {};
    categories.forEach((c) => {
      categoryNameById[c.id] = this._normalizeText(c.name || '');
    });

    return products.filter((product) => {
      const name = this._normalizeText(product.name || '');
      const desc = this._normalizeText(product.description || '');
      const categoryName =
        this._normalizeText(product.category_name || '') ||
        categoryNameById[product.category_id] ||
        '';
      const haystack = `${name} ${desc} ${categoryName}`;

      const excluded = productIntent.excludePatterns.some((pattern) => haystack.includes(pattern));
      if (excluded) {
        return false;
      }

      const matchesCategory = productIntent.categoryNames.some((cn) => categoryName.includes(cn));
      const matchesName = productIntent.searchTerms.some((term) => haystack.includes(term));

      return matchesCategory || matchesName;
    });
  }

  _applyPriceFilter(products, priceRange) {
    if (!Array.isArray(products)) {
      return [];
    }

    return products.filter((product) => {
      const price = Number(product.price);
      if (priceRange.min !== null && price < priceRange.min) {
        return false;
      }
      if (priceRange.max !== null && price > priceRange.max) {
        return false;
      }
      return true;
    });
  }

  _filterByBrand(products, brandHint) {
    if (!brandHint || !Array.isArray(products)) {
      return products;
    }

    const brandKey = this._normalizeText(brandHint.label || brandHint.key || '');
    if (!brandKey) {
      return products;
    }

    return products.filter((product) => {
      const name = this._normalizeText(product.name || '');
      const desc = this._normalizeText(product.description || '');
      const brand = this._normalizeText(product.brand || '');

      if (brand && this._containsExactPhrase(brand, brandKey)) {
        return true;
      }

      if (this._containsExactPhrase(name, brandKey)) {
        return true;
      }

      return this._containsExactPhrase(desc, brandKey);
    });
  }

  _isPriceOrNoiseTerm(term) {
    const noise = new Set([
      'duoi',
      'tren',
      'trieu',
      'tr',
      'nghin',
      'ngan',
      'dong',
      'vnd',
      'den',
      'khoang',
      'lon',
      'nho',
      'hon',
      'it',
      'nhat',
      'toi',
      'da',
      'gia',
      'bao',
      'nhieu',
      'dien',
      'thoai',
    ]);
    return noise.has(term) || /^\d+$/.test(term);
  }

  /**
   * Extract multi-word phrases likely to be product or category names
   * @param {string} message
   * @param {string[]} tokens
   * @returns {string[]}
   */
  _extractSearchPhrases(message, tokens) {
    const normalized = this._normalizeText(message).replace(/[^a-z0-9\s-]/g, ' ');
    const compact = normalized.replace(/\s+/g, ' ').trim();
    const phrases = new Set();

    // Cụm 2–4 từ liên tiếp từ tokens (không dùng cả câu có giá)
    for (let size = Math.min(4, tokens.length); size >= 2; size--) {
      for (let i = 0; i <= tokens.length - size; i++) {
        const phrase = tokens.slice(i, i + size).join(' ');
        if (!this._isPricePhrase(phrase)) {
          phrases.add(phrase);
        }
      }
    }

    const productIntent = this._resolveProductIntent(message);
    if (productIntent) {
      productIntent.triggers.forEach((trigger) => {
        if (compact.includes(trigger)) {
          phrases.add(trigger);
        }
      });
    }

    tokens.forEach((token) => {
      if (token.includes('-') && token.length >= 3) {
        phrases.add(token);
      }
    });

    return Array.from(phrases)
      .filter((p) => p.length >= 3 && !this._isPricePhrase(p))
      .slice(0, 8);
  }

  _isPricePhrase(phrase) {
    const normalized = this._normalizeText(phrase);
    if (/\d/.test(normalized)) {
      return true;
    }
    const priceWords = ['duoi', 'tren', 'trieu', 'tr', 'nghin', 'gia'];
    const words = normalized.split(/\s+/);
    return words.length > 0 && words.every((w) => priceWords.includes(w) || /^\d+$/.test(w));
  }

  _buildRagContext(products, categoryNameById, retrievalSignals) {
    const lines = [];

    const keywords =
      retrievalSignals.matchedKeywords?.length > 0
        ? retrievalSignals.matchedKeywords
        : retrievalSignals.phrases?.length > 0
          ? retrievalSignals.phrases
          : retrievalSignals.tokens;

    if (keywords.length > 0) {
      lines.push(`Từ khóa truy vấn: ${keywords.slice(0, 6).join(', ')}`);
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
      'cua',
      've',
      'thong',
      'tin',
      'chi',
      'tiet',
      'minh',
      'biet',
      'khong',
      'nao',
      'mot',
      'nhung',
      'vay',
      'duoi',
      'tren',
      'trieu',
      'tr',
      'nghin',
      'ngan',
      'dong',
      'vnd',
      'den',
      'khoang',
      'lon',
      'nho',
      'hon',
      'it',
      'nhat',
      'toi',
      'da',
      'a',
      'o',
      'u',
      'uh',
    ]);

    const normalized = this._normalizeText(message).replace(/[^a-z0-9\s]/g, ' ');

    const tokens = normalized
      .split(/\s+/)
      .map((token) => token.trim())
      .filter((token) => token.length >= 3 && !stopWords.has(token));

    return Array.from(new Set(tokens));
  }

  _detectCategoryHints(message, categories) {
    const normalizedMessage = this._normalizeText(message);
    const tokens = this._extractSearchTokens(message);

    return categories.filter((category) => {
      const normalizedCategoryName = this._normalizeText(category.name || '');
      if (normalizedCategoryName.length < 2) {
        return false;
      }

      if (normalizedMessage.includes(normalizedCategoryName)) {
        return true;
      }

      const categoryWords = normalizedCategoryName.split(/\s+/).filter((word) => word.length >= 3);

      if (categoryWords.some((word) => normalizedMessage.includes(word))) {
        return true;
      }

      return categoryWords.some((word) => tokens.includes(word));
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
    const normalized = this._normalizeText(message);
    const regex = /(\d+(?:[.,]\d+)*)\s*(trieu|tr|m|nghin|ngan|k|vnd|dong|d|cu|chai|lit)?/gi;

    let match;
    while ((match = regex.exec(normalized)) !== null) {
      const rawNumber = match[1] || '';
      const unit = (match[2] || '').toLowerCase();

      const numericText = rawNumber.replace(/[.,](?=\d{3}(\D|$))/g, '').replace(',', '.');

      let amount = Number(numericText);
      if (!Number.isFinite(amount) || amount <= 0) {
        continue;
      }

      if (['trieu', 'tr', 'm', 'cu', 'chai', 'lit'].includes(unit)) {
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
      .replace(/đ/g, 'd')
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
    const phrases = signals.phrases || [];

    const ranked = products
      .map((product) => {
        const normalizedName = this._normalizeText(product.name || '');
        const normalizedDesc = this._normalizeText(product.description || '');
        const normalizedCategory = this._normalizeText(product.category_name || '');

        let score = 0;

        phrases.forEach((phrase) => {
          if (phrase.length < 2) {
            return;
          }
          if (normalizedName.includes(phrase)) {
            score += 8;
          } else if (normalizedCategory.includes(phrase)) {
            score += 5;
          } else if (normalizedDesc.includes(phrase)) {
            score += 3;
          }
        });

        signals.tokens.forEach((token) => {
          if (normalizedName.includes(token)) {
            score += 3;
          } else if (normalizedCategory.includes(token)) {
            score += 2;
          } else if (normalizedDesc.includes(token)) {
            score += 1;
          }
        });

        if (signals.categoryIds.includes(product.category_id)) {
          score += 4;
        }

        if (signals.productIntent) {
          const haystack = `${normalizedName} ${normalizedDesc} ${normalizedCategory}`;
          if (signals.productIntent.searchTerms.some((term) => haystack.includes(term))) {
            score += 6;
          }
          if (signals.productIntent.excludePatterns.some((pattern) => haystack.includes(pattern))) {
            score -= 20;
          }
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

  _formatProductLines(products, limit = 5) {
    return products.slice(0, limit).map((product) => {
      const stock = Number(product.stock) > 0 ? `Còn ${product.stock}` : 'Hết hàng';
      return `- **${product.name}**: ${this._toVnd(product.price)} (${stock}) — [Xem chi tiết](/products/${product.id})`;
    });
  }

  _analyzeMessage(message, categories) {
    const normalized = this._normalizeText(message);
    const priceRange = this._extractPriceRange(message);
    const categoryCandidates = this._collectCategoryCandidates(categories);
    const categoryMatch = this._matchCategory(normalized, categories);
    const brandMatch = this._matchBrand(normalized);
    const preferences = this._extractPreferences(normalized, {
      brandCandidates: ChatbotService.ANALYSIS_BRANDS,
      categoryCandidates,
    });
    const inStock = this._detectInStock(normalized);
    const usage = this._detectUsage(normalized);
    const recommendation = this._isRecommendationMessage(normalized);
    const compareResult = this._extractCompareTargets(message, categoryCandidates);
    const primaryCategory = categoryMatch?.label || preferences.includeCategories[0] || '';
    const primaryBrand = brandMatch?.label || preferences.includeBrands[0] || '';
    const productName =
      compareResult.products.length > 0
        ? ''
        : this._extractProductName(message, normalized, {
            category: primaryCategory,
            brand: primaryBrand,
            priceRange,
          });

    const intent = this._detectAnalysisIntent({
      normalized,
      hasCategory: Boolean(primaryCategory),
      hasBrand: Boolean(primaryBrand),
      productName,
      priceRange,
      inStock,
      usage,
      recommendation,
      compareProducts: compareResult.products,
      compareSameCategory: compareResult.sameCategory,
    });

    return {
      intent,
      category: primaryCategory,
      brand: primaryBrand,
      product_name: productName || '',
      min_price: priceRange.min !== null ? priceRange.min : null,
      max_price: priceRange.max !== null ? priceRange.max : null,
      in_stock: inStock,
      usage: usage || '',
      recommendation,
      compare_products: compareResult.products,
      compare_category: compareResult.category || '',
      compare_same_category: compareResult.sameCategory === true,
      include_brands: preferences.includeBrands,
      exclude_brands: preferences.excludeBrands,
      include_categories: preferences.includeCategories,
      exclude_categories: preferences.excludeCategories,
    };
  }

  _detectAnalysisIntent({
    normalized,
    hasCategory,
    hasBrand,
    productName,
    priceRange,
    inStock,
    usage,
    recommendation,
    compareProducts,
    compareSameCategory,
  }) {
    if (this._isGreetingMessage(normalized)) {
      return 'greeting';
    }

    if (this._isPromotionMessage(normalized)) {
      return 'promotion';
    }

    if (compareProducts.length >= 2 && compareSameCategory !== false) {
      return 'compare_products';
    }

    if (recommendation) {
      return 'recommendation';
    }

    if (usage) {
      return 'usage';
    }

    const hasPrice = priceRange.min !== null || priceRange.max !== null;
    const hasProductSignals = hasCategory || hasBrand || Boolean(productName);
    const isAvailabilityQuery = inStock || this._looksLikeAvailabilityQuery(normalized);

    if (isAvailabilityQuery && hasProductSignals) {
      return 'check_stock';
    }

    if (hasPrice && !hasProductSignals) {
      return 'search_by_price';
    }

    if (
      productName &&
      this._looksLikeProductDetailQuery(normalized, productName, hasCategory, hasBrand, hasPrice)
    ) {
      return 'product_detail';
    }

    if (hasProductSignals) {
      return 'search_product';
    }

    if (hasPrice) {
      return 'search_by_price';
    }

    return 'unknown';
  }

  _detectUsage(normalizedMessage) {
    const entries = Object.entries(ChatbotService.ANALYSIS_USAGE_TERMS);
    for (const [usage, terms] of entries) {
      if (this._containsAny(normalizedMessage, terms)) {
        return usage;
      }
    }
    return '';
  }

  _isRecommendationMessage(normalizedMessage) {
    return this._containsAny(normalizedMessage, ChatbotService.ANALYSIS_RECOMMEND_TERMS);
  }

  _extractCompareTargets(message, categoryCandidates) {
    const normalized = this._normalizeText(message);
    const compareRegex = /(.+?)\s+(?:vs|v\.s\.|so\s+sanh|so\s+voi|tot\s+hon|better)\s+(.+)/i;
    const rawMatch = message.match(compareRegex);
    const fallbackMatch = rawMatch ? null : normalized.match(compareRegex);

    if (!rawMatch && !fallbackMatch) {
      return { products: [], category: '', sameCategory: null };
    }

    const leftRaw = (rawMatch?.[1] || fallbackMatch?.[1] || '').trim();
    const rightRaw = (rawMatch?.[2] || fallbackMatch?.[2] || '').trim();

    const leftName = this._extractCompareProductName(leftRaw, categoryCandidates);
    const rightName = this._extractCompareProductName(rightRaw, categoryCandidates);

    const leftCategory =
      this._matchCategory(this._normalizeText(leftRaw), categoryCandidates)?.label || '';
    const rightCategory =
      this._matchCategory(this._normalizeText(rightRaw), categoryCandidates)?.label || '';

    const sameCategory =
      leftCategory && rightCategory
        ? leftCategory === rightCategory
        : leftCategory === rightCategory;

    return {
      products: [leftName, rightName].filter(Boolean),
      category: sameCategory ? leftCategory : '',
      sameCategory: leftCategory && rightCategory ? leftCategory === rightCategory : null,
    };
  }

  _extractCompareProductName(segment, categoryCandidates) {
    const cleaned = String(segment || '')
      .replace(/\b(vs|v\.s\.|so\s+sanh|so\s+voi|tot\s+hon|better)\b/gi, ' ')
      .replace(/\s+/g, ' ')
      .trim();

    const normalizedSegment = this._normalizeText(cleaned);
    const categoryMatch = this._matchCategory(normalizedSegment, categoryCandidates);
    const brandMatch = this._matchBrand(normalizedSegment);
    const priceRange = this._extractPriceRange(cleaned);

    const extracted = this._extractProductName(cleaned, normalizedSegment, {
      category: categoryMatch?.label || '',
      brand: brandMatch?.label || '',
      priceRange,
    });

    if (extracted) {
      return extracted;
    }

    return cleaned;
  }

  _collectCategoryCandidates(categories) {
    const byKey = new Map();

    (categories || []).forEach((category) => {
      const label = category?.name ? String(category.name).trim() : '';
      if (!label) {
        return;
      }
      const key = this._normalizeText(label);
      if (!byKey.has(key)) {
        byKey.set(key, { label, key });
      }
    });

    ChatbotService.ANALYSIS_CATEGORY_ALIASES.forEach((alias) => {
      if (!byKey.has(alias.key)) {
        byKey.set(alias.key, alias);
      }
    });

    return Array.from(byKey.values());
  }

  _extractPreferences(normalizedMessage, { brandCandidates, categoryCandidates }) {
    const includeBrands = new Set();
    const excludeBrands = new Set();
    const includeCategories = new Set();
    const excludeCategories = new Set();

    (brandCandidates || []).forEach((candidate) => {
      if (!candidate?.key) {
        return;
      }

      if (
        this._matchesPreferenceCue(
          normalizedMessage,
          candidate.key,
          ChatbotService.ANALYSIS_EXCLUDE_CUES
        )
      ) {
        excludeBrands.add(candidate.label);
      }

      if (
        this._matchesPreferenceCue(
          normalizedMessage,
          candidate.key,
          ChatbotService.ANALYSIS_INCLUDE_CUES
        )
      ) {
        includeBrands.add(candidate.label);
      }
    });

    (categoryCandidates || []).forEach((candidate) => {
      if (!candidate?.key) {
        return;
      }

      if (
        this._matchesPreferenceCue(
          normalizedMessage,
          candidate.key,
          ChatbotService.ANALYSIS_EXCLUDE_CUES
        )
      ) {
        excludeCategories.add(candidate.label);
      }

      if (
        this._matchesPreferenceCue(
          normalizedMessage,
          candidate.key,
          ChatbotService.ANALYSIS_INCLUDE_CUES
        )
      ) {
        includeCategories.add(candidate.label);
      }
    });

    excludeBrands.forEach((label) => includeBrands.delete(label));
    excludeCategories.forEach((label) => includeCategories.delete(label));

    return {
      includeBrands: Array.from(includeBrands),
      excludeBrands: Array.from(excludeBrands),
      includeCategories: Array.from(includeCategories),
      excludeCategories: Array.from(excludeCategories),
    };
  }

  _matchesPreferenceCue(normalizedMessage, key, cues) {
    return (cues || []).some((cue) => {
      const cueIdx = normalizedMessage.indexOf(cue);
      if (cueIdx === -1) {
        return false;
      }

      const keyIdx = normalizedMessage.indexOf(key, cueIdx);
      if (keyIdx === -1) {
        return false;
      }

      return keyIdx - cueIdx <= 30;
    });
  }

  _findExactCategoryMatch(normalizedMessage, categories) {
    let best = null;

    (categories || []).forEach((category) => {
      const label = category?.name ? String(category.name).trim() : '';
      if (!label) {
        return;
      }

      const key = this._normalizeText(label);
      if (!this._containsExactPhrase(normalizedMessage, key)) {
        return;
      }

      if (!best || key.length > best.key.length) {
        best = { id: category.id, name: label, key };
      }
    });

    return best;
  }

  _isExplicitCategoryQuery(normalizedMessage, categoryKey) {
    if (!categoryKey) {
      return false;
    }

    if (normalizedMessage === categoryKey) {
      return true;
    }

    if (
      this._containsAny(normalizedMessage, ChatbotService.ANALYSIS_CATEGORY_QUERY_TERMS) &&
      this._containsExactPhrase(normalizedMessage, categoryKey)
    ) {
      return true;
    }

    return false;
  }

  _containsExactPhrase(normalizedMessage, phrase) {
    if (!phrase) {
      return false;
    }

    const escaped = phrase.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    const regex = new RegExp(`(^|\\s)${escaped}(\\s|$)`);
    return regex.test(normalizedMessage);
  }

  _extractExplicitProductName(message) {
    const quotedMatch = message.match(/"([^"]+)"/);
    if (quotedMatch?.[1]) {
      return quotedMatch[1].trim();
    }

    const singleQuoteMatch = message.match(/'([^']+)'/);
    if (singleQuoteMatch?.[1]) {
      return singleQuoteMatch[1].trim();
    }

    const explicitRegex = /(san pham|sp|product|chi tiet|xem chi tiet|thong tin)\s+(.+)/i;
    const explicitMatch = message.match(explicitRegex);
    if (explicitMatch?.[2]) {
      return explicitMatch[2].trim().replace(/[?!.,]+$/g, '');
    }

    return '';
  }

  _matchCategory(normalizedMessage, categories) {
    const categoryCandidates = (categories || [])
      .map((category) => {
        const label = category?.name
          ? String(category.name).trim()
          : category?.label
            ? String(category.label).trim()
            : '';
        if (!label) {
          return null;
        }
        return {
          label,
          key: this._normalizeText(label),
        };
      })
      .filter(Boolean);

    const categoryMatch = this._findBestMatch(normalizedMessage, categoryCandidates);
    if (categoryMatch) {
      return categoryMatch;
    }

    return this._findBestMatch(normalizedMessage, ChatbotService.ANALYSIS_CATEGORY_ALIASES);
  }

  _matchBrand(normalizedMessage) {
    return this._findBestMatch(normalizedMessage, ChatbotService.ANALYSIS_BRANDS);
  }

  _detectInStock(normalizedMessage) {
    if (this._containsAny(normalizedMessage, ChatbotService.ANALYSIS_STOCK_TERMS)) {
      return true;
    }

    return this._looksLikeAvailabilityQuery(normalizedMessage);
  }

  _looksLikeAvailabilityQuery(normalizedMessage) {
    return (
      /(^|\s)co\s+.+\s+khong(\s|$)/.test(normalizedMessage) ||
      /(^|\s)con\s+.+\s+khong(\s|$)/.test(normalizedMessage)
    );
  }

  _extractProductName(message, normalizedMessage, context) {
    if (this._isGreetingMessage(normalizedMessage) || this._isPromotionMessage(normalizedMessage)) {
      return '';
    }

    const quotedMatch = message.match(/"([^"]+)"/);
    if (quotedMatch?.[1]) {
      return quotedMatch[1].trim();
    }

    const singleQuoteMatch = message.match(/'([^']+)'/);
    if (singleQuoteMatch?.[1]) {
      return singleQuoteMatch[1].trim();
    }

    const modelMatch = message.match(/([A-Za-z]{2,}[A-Za-z0-9\s-]{0,20}\d{2,}[A-Za-z0-9\s-]*)/);
    if (modelMatch?.[1]) {
      const candidate = modelMatch[1].trim();
      const normalizedCandidate = this._normalizeText(candidate);
      if (
        !this._looksLikePriceReference(normalizedCandidate) &&
        !this._looksLikeCategoryOrBrand(candidate, context)
      ) {
        return candidate;
      }
    }

    const tokens = this._extractSearchTokens(message);
    const hasPrice = context?.priceRange
      ? context.priceRange.min !== null || context.priceRange.max !== null
      : false;
    const hasOtherSignals = Boolean(context?.category) || Boolean(context?.brand);

    if (!hasOtherSignals && tokens.length > 0 && tokens.length <= 4 && !hasPrice) {
      const compact = message.trim();
      if (compact.length <= 40) {
        return compact;
      }
    }

    return '';
  }

  _looksLikePriceReference(normalizedText) {
    if (!normalizedText) {
      return false;
    }

    if (/^\d[\d\s.,]*$/.test(normalizedText)) {
      return true;
    }

    return this._containsAny(normalizedText, [
      'trieu',
      'tr',
      'nghin',
      'ngan',
      'k',
      'vnd',
      'dong',
      'gia',
    ]);
  }

  _looksLikeCategoryOrBrand(candidate, context) {
    const normalizedCandidate = this._normalizeText(candidate);
    const categoryKey = context?.category ? this._normalizeText(context.category) : '';
    const brandKey = context?.brand ? this._normalizeText(context.brand) : '';

    if (categoryKey && normalizedCandidate.includes(categoryKey)) {
      return true;
    }

    if (brandKey && normalizedCandidate.includes(brandKey)) {
      return true;
    }

    return false;
  }

  _looksLikeProductDetailQuery(normalizedMessage, productName, hasCategory, hasBrand, hasPrice) {
    if (this._containsAny(normalizedMessage, ChatbotService.ANALYSIS_DETAIL_TERMS)) {
      return true;
    }

    const normalizedName = this._normalizeText(productName);
    if (!hasPrice && /\d/.test(normalizedName) && /[a-z]/.test(normalizedName)) {
      return true;
    }

    return !hasPrice && !hasCategory && !hasBrand && productName.trim().length <= 30;
  }

  _isGreetingMessage(normalizedMessage) {
    return this._containsAny(normalizedMessage, ChatbotService.ANALYSIS_GREETING_TERMS);
  }

  _isPromotionMessage(normalizedMessage) {
    return this._containsAny(normalizedMessage, ChatbotService.ANALYSIS_PROMOTION_TERMS);
  }

  _findBestMatch(normalizedMessage, candidates) {
    let best = null;

    (candidates || []).forEach((candidate) => {
      if (!candidate?.key) {
        return;
      }

      const idx = normalizedMessage.indexOf(candidate.key);
      if (idx === -1) {
        return;
      }

      if (!best || idx < best.idx || (idx === best.idx && candidate.key.length > best.key.length)) {
        best = {
          label: candidate.label,
          key: candidate.key,
          idx,
        };
      }
    });

    return best ? { label: best.label, key: best.key } : null;
  }

  _detectIntent(message) {
    const text = this._normalizeText(message);

    if (this._containsAny(text, ['xin chao', 'chao ban', 'hello', 'hi', 'hey'])) {
      return 'greeting';
    }
    if (
      this._containsAny(text, [
        'cach dat hang',
        'huong dan mua',
        'dat hang',
        'mua hang',
        'thanh toan',
        'don hang',
        'gio hang',
        'checkout',
        'vnpay',
      ])
    ) {
      return 'order_help';
    }
    if (this._containsAny(text, ['danh muc', 'loai san pham', 'category', 'phan loai'])) {
      return 'categories';
    }
    if (this._containsAny(text, ['gia re', 're nhat', 'tiet kiem', 'khuyen mai', 'giam gia'])) {
      return 'cheap';
    }
    if (this._containsAny(text, ['dang ban', 'co gi', 'san pham nao', 'ban gi', 'tat ca'])) {
      return 'catalog';
    }
    if (this._containsAny(text, ['cam on', 'thanks', 'thank'])) {
      return 'thanks';
    }

    return 'product_search';
  }

  _buildSingleProductReply(product, categoryName) {
    const stock = Number(product.stock) > 0 ? `Còn **${product.stock}** sản phẩm` : '**Hết hàng**';
    const desc = product.description
      ? `\n\n📝 ${String(product.description).slice(0, 200)}${product.description.length > 200 ? '...' : ''}`
      : '';

    return [
      `### ${product.name}`,
      `- **Giá:** ${this._toVnd(product.price)}`,
      `- **Danh mục:** ${categoryName || 'Chưa phân loại'}`,
      `- **Tồn kho:** ${stock}`,
      desc,
      '',
      `[Xem chi tiết và đặt hàng](/products/${product.id})`,
    ].join('\n');
  }

  async _buildDatabaseReply(message, ragResult) {
    const products = ragResult?.products || [];
    const intent = this._detectIntent(message);
    const inStock = products.filter((p) => Number(p.stock) > 0);
    const displayProducts = (inStock.length > 0 ? inStock : products).slice(0, 5);
    const matchedLabel = (ragResult?.matchedKeywords || []).slice(0, 3).join(', ');

    switch (intent) {
      case 'greeting':
        return [
          'Xin chào! Mình là trợ lý cửa hàng **Mini E-Commerce**.',
          'Mình tra cứu trực tiếp từ cơ sở dữ liệu sản phẩm — bạn có thể hỏi:',
          '- Tên sản phẩm hoặc danh mục (ví dụ: áo, tai nghe)',
          '- Khoảng giá (ví dụ: dưới 500k)',
          '- *"Cách đặt hàng?"*',
        ].join('\n');

      case 'order_help':
        return [
          '**Cách mua hàng:**',
          '1. Chọn sản phẩm → **Xem chi tiết** → thêm vào giỏ.',
          '2. Mở giỏ hàng → **Thanh toán**.',
          '3. Điền thông tin giao hàng và chọn VNPay (nếu có).',
          '4. Sau khi thanh toán, xem đơn trong mục **Đơn hàng**.',
          '',
          'Bạn muốn mình gợi ý sản phẩm nào không?',
        ].join('\n');

      case 'categories': {
        try {
          const categories = await categoryRepository.findAll();
          if (!categories.length) {
            return 'Hiện chưa có danh mục trong hệ thống.';
          }
          const lines = categories.map((c) => `- **${c.name}** (id: ${c.id})`);
          return [
            '**Danh mục đang có:**',
            '',
            ...lines,
            '',
            'Gõ tên danh mục để xem sản phẩm.',
          ].join('\n');
        } catch {
          return 'Không tải được danh mục lúc này. Bạn thử hỏi tên sản phẩm cụ thể nhé.';
        }
      }

      case 'thanks':
        return 'Không có gì! Nếu cần tìm sản phẩm khác, cứ nhắn mình nhé.';

      case 'cheap':
      case 'catalog':
      case 'product_search':
      default:
        break;
    }

    if (displayProducts.length === 0) {
      const keywordHint = matchedLabel ? ` cho từ khóa **"${matchedLabel}"**` : '';
      return [
        `Không tìm thấy sản phẩm hoặc danh mục phù hợp${keywordHint} trong cơ sở dữ liệu.`,
        'Bạn thử:',
        '- Gõ đúng tên sản phẩm (vd: T-Shirt, Jeans, Tai nghe)',
        '- Gõ tên danh mục (vd: Thời trang, Điện tử)',
        '- Hỏi *"danh mục"* để xem tất cả loại hàng',
      ].join('\n');
    }

    if (displayProducts.length === 1 && ragResult?.hasSpecificQuery) {
      const product = displayProducts[0];
      const categoryName =
        ragResult.categoryHints?.find((c) => c.id === product.category_id)?.name ||
        product.category_name;
      return this._buildSingleProductReply(product, categoryName);
    }

    const lines = this._formatProductLines(displayProducts, 5);
    return lines.join('\n');
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
