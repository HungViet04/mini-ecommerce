/**
 * Chatbot Service Unit Tests
 */

const sampleProducts = [
  {
    id: 1,
    name: 'T-Shirt Basic',
    description: 'Ao thun cotton',
    price: 199000,
    stock: 10,
    category_id: 1,
    category_name: 'Thoi trang',
  },
  {
    id: 2,
    name: 'Jeans Classic',
    description: 'Quan jeans unisex',
    price: 499000,
    stock: 5,
    category_id: 1,
    category_name: 'Thoi trang',
  },
  {
    id: 3,
    name: 'Wireless Headphones',
    description: 'Tai nghe bluetooth',
    price: 890000,
    stock: 3,
    category_id: 2,
    category_name: 'Dien tu',
  },
];

const loadChatbotService = ({
  products = sampleProducts,
  categories = [
    { id: 1, name: 'Thời trang' },
    { id: 2, name: 'Điện tử' },
  ],
} = {}) => {
  jest.resetModules();

  jest.doMock('../../../src/config', () => ({
    chatbot: {
      rateLimitWindowMs: 60000,
      rateLimitMax: 30,
      messageMaxLength: 1000,
    },
  }));

  const searchByText = jest.fn(async (keyword) => {
    const normalized = String(keyword).toLowerCase();
    return products.filter((product) => {
      const haystack = [product.name, product.description, product.category_name]
        .join(' ')
        .toLowerCase();
      return haystack.includes(normalized);
    });
  });

  jest.doMock('../../../src/repositories', () => ({
    productRepository: {
      findWithPagination: jest.fn().mockResolvedValue({ items: products }),
      searchAndFilter: jest.fn().mockResolvedValue({ items: products }),
      searchByName: jest.fn((q) => searchByText(q)),
      searchByText,
      findByCategory: jest.fn((categoryId) =>
        Promise.resolve(products.filter((p) => p.category_id === categoryId))
      ),
    },
    categoryRepository: {
      findAll: jest.fn().mockResolvedValue(categories),
    },
  }));

  return {
    service: require('../../../src/services/chatbot.service'),
    searchByText,
  };
};

describe('ChatbotService', () => {
  it('should reply from database', async () => {
    const { service } = loadChatbotService();

    const result = await service.processMessage({
      message: 'Tư vấn sản phẩm giá rẻ',
      sessionId: 'session_test_1',
    });

    expect(result.provider).toBe('store');
    expect(result.reply).toContain('T-Shirt Basic');
  });

  it('should answer order help', async () => {
    const { service } = loadChatbotService();

    const result = await service.processMessage({
      message: 'Cách đặt hàng?',
      sessionId: 'session_test_2',
    });

    expect(result.reply).toContain('Thanh toán');
  });

  it('should filter phones when asking dien thoai with price', async () => {
    const products = [
      {
        id: 1,
        name: 'Wireless Headphones',
        price: 2500000,
        stock: 100,
        category_id: 2,
        category_name: 'Dien tu',
      },
      {
        id: 2,
        name: 'Smartphone X1',
        description: 'Dien thoai',
        price: 15000000,
        stock: 50,
        category_id: 1,
        category_name: 'Dien thoai',
      },
      {
        id: 3,
        name: 'Laptop Pro 15',
        price: 25000000,
        stock: 30,
        category_id: 3,
        category_name: 'Laptop',
      },
    ];

    const { service } = loadChatbotService({
      products,
      categories: [
        { id: 1, name: 'Điện thoại' },
        { id: 2, name: 'Điện tử' },
      ],
    });

    const result = await service.processMessage({
      message: 'điện thoại dưới 50 triệu',
      sessionId: 'session_phone',
    });

    expect(result.reply).toContain('Smartphone X1');
    expect(result.reply).not.toContain('Wireless Headphones');
    expect(result.reply).not.toContain('Laptop');
  });
});
