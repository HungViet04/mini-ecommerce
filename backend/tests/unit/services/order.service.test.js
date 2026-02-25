/**
 * Order Service Tests
 * Tests for order service
 */

// Mock database transaction
jest.mock('../../../src/config/database', () => ({
  query: jest.fn(),
  execute: jest.fn(),
  getConnection: jest.fn(),
  transaction: jest.fn(async (callback) => {
    const mockConnection = {
      query: jest.fn(),
      execute: jest.fn(),
    };
    return callback(mockConnection);
  }),
}));

// Mock repositories
jest.mock('../../../src/repositories', () => ({
  productRepository: {
    findByIdOrFail: jest.fn(),
    findByIdsForUpdate: jest.fn(),
    decrementStock: jest.fn(),
    incrementStock: jest.fn(),
  },
  orderRepository: {
    findById: jest.fn(),
    findByIdOrFail: jest.fn(),
    getOrderWithItems: jest.fn(),
    getOrdersWithItemsByUser: jest.fn(),
    createOrder: jest.fn(),
    createOrderItem: jest.fn(),
    updateStatus: jest.fn(),
    delete: jest.fn(),
  },
}));

const { orderService } = require('../../../src/services');
const { productRepository, orderRepository } = require('../../../src/repositories');
const {
  NotFoundError,
  OutOfStockError,
  AuthorizationError,
  ValidationError,
} = require('../../../src/errors');

describe('OrderService', () => {
  const mockUser = { id: 1, email: 'user@example.com', role: 'user' };
  const mockAdmin = { id: 2, email: 'admin@example.com', role: 'admin' };

  const validShippingInfo = {
    fullName: 'Nguyễn Văn A',
    phone: '0901234567',
    province: 'Hồ Chí Minh',
    district: 'Quận 1',
    ward: 'Phường Bến Nghé',
    address: '123 Đường ABC',
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('create', () => {
    const validOrderData = {
      items: [
        { productId: 1, quantity: 2 },
        { productId: 2, quantity: 1 },
      ],
      shippingInfo: validShippingInfo,
      paymentMethod: 'cod',
    };

    const mockProducts = [
      { id: 1, name: 'Product 1', price: 100000, stock: 10 },
      { id: 2, name: 'Product 2', price: 200000, stock: 5 },
    ];

    it('should create order successfully', async () => {
      const createdOrder = { id: 1, userId: 1, total: 430000, status: 'pending' };

      productRepository.findByIdsForUpdate.mockResolvedValue(mockProducts);
      orderRepository.createOrder.mockResolvedValue(createdOrder);
      orderRepository.createOrderItem.mockResolvedValue({});
      productRepository.decrementStock.mockResolvedValue({});

      const result = await orderService.create(validOrderData, mockUser);

      expect(result).toHaveProperty('id');
      expect(result).toHaveProperty('items');
      expect(result.items).toHaveLength(2);
      expect(productRepository.findByIdsForUpdate).toHaveBeenCalled();
      expect(orderRepository.createOrder).toHaveBeenCalled();
    });

    it('should throw ValidationError for empty items', async () => {
      const invalidData = {
        items: [],
        shippingInfo: validShippingInfo,
        paymentMethod: 'cod',
      };

      await expect(orderService.create(invalidData, mockUser)).rejects.toThrow(ValidationError);
    });

    it('should throw NotFoundError if product not found', async () => {
      productRepository.findByIdsForUpdate.mockResolvedValue([mockProducts[0]]);
      // Product 2 is missing

      await expect(orderService.create(validOrderData, mockUser)).rejects.toThrow(NotFoundError);
    });

    it('should throw OutOfStockError if product stock is insufficient', async () => {
      const productsWithLowStock = [
        { id: 1, name: 'Product 1', price: 100000, stock: 1 }, // Not enough for quantity 2
        { id: 2, name: 'Product 2', price: 200000, stock: 5 },
      ];

      productRepository.findByIdsForUpdate.mockResolvedValue(productsWithLowStock);

      await expect(orderService.create(validOrderData, mockUser)).rejects.toThrow(OutOfStockError);
    });

    it('should throw AuthorizationError when non-admin creates order for another user', async () => {
      const dataWithUserId = {
        ...validOrderData,
        userId: 99, // Different from mockUser.id
      };

      await expect(orderService.create(dataWithUserId, mockUser)).rejects.toThrow(
        AuthorizationError
      );
    });

    it('should allow admin to create order for another user', async () => {
      const createdOrder = { id: 1, userId: 99, total: 430000, status: 'pending' };
      const dataWithUserId = {
        ...validOrderData,
        userId: 99,
      };

      productRepository.findByIdsForUpdate.mockResolvedValue(mockProducts);
      orderRepository.createOrder.mockResolvedValue(createdOrder);
      orderRepository.createOrderItem.mockResolvedValue({});
      productRepository.decrementStock.mockResolvedValue({});

      const result = await orderService.create(dataWithUserId, mockAdmin);

      expect(result.userId).toBe(99);
    });

    it('should calculate total correctly including shipping fee', async () => {
      const createdOrder = { id: 1, userId: 1, total: 430000, status: 'pending' };

      productRepository.findByIdsForUpdate.mockResolvedValue(mockProducts);
      orderRepository.createOrder.mockResolvedValue(createdOrder);
      orderRepository.createOrderItem.mockResolvedValue({});
      productRepository.decrementStock.mockResolvedValue({});

      const result = await orderService.create(validOrderData, mockUser);

      // 2 * 100000 + 1 * 200000 = 400000 subtotal
      // + 30000 shipping = 430000 total
      expect(result.subtotal).toBe(400000);
      expect(result.shippingFee).toBe(30000);
      expect(result.total).toBe(430000);
    });

    it('should decrement stock for each product', async () => {
      const createdOrder = { id: 1, userId: 1, total: 430000, status: 'pending' };

      productRepository.findByIdsForUpdate.mockResolvedValue(mockProducts);
      orderRepository.createOrder.mockResolvedValue(createdOrder);
      orderRepository.createOrderItem.mockResolvedValue({});
      productRepository.decrementStock.mockResolvedValue({});

      await orderService.create(validOrderData, mockUser);

      expect(productRepository.decrementStock).toHaveBeenCalledTimes(2);
    });
  });

  describe('findById', () => {
    it('should return order for owner', async () => {
      const order = {
        id: 1,
        userId: 1,
        total: 100000,
        items: [{ productId: 1, quantity: 1 }],
      };

      orderRepository.getOrderWithItems.mockResolvedValue(order);

      const result = await orderService.findById(1, mockUser);

      expect(result).toEqual(order);
    });

    it('should return order for admin', async () => {
      const order = {
        id: 1,
        userId: 99, // Different user
        total: 100000,
        items: [],
      };

      orderRepository.getOrderWithItems.mockResolvedValue(order);

      const result = await orderService.findById(1, mockAdmin);

      expect(result).toEqual(order);
    });

    it('should throw NotFoundError if order not found', async () => {
      orderRepository.getOrderWithItems.mockResolvedValue(null);

      await expect(orderService.findById(999, mockUser)).rejects.toThrow(NotFoundError);
    });

    it('should throw AuthorizationError for non-owner non-admin', async () => {
      const order = {
        id: 1,
        userId: 99, // Different user
        total: 100000,
        items: [],
      };

      orderRepository.getOrderWithItems.mockResolvedValue(order);

      await expect(orderService.findById(1, mockUser)).rejects.toThrow(AuthorizationError);
    });

    it('should throw ValidationError for invalid order id', async () => {
      await expect(orderService.findById('invalid', mockUser)).rejects.toThrow(ValidationError);
    });
  });

  describe('findByUser', () => {
    it('should return orders for user', async () => {
      const orders = [
        { id: 1, userId: 1, total: 100000 },
        { id: 2, userId: 1, total: 200000 },
      ];

      orderRepository.getOrdersWithItemsByUser.mockResolvedValue(orders);

      const result = await orderService.findByUser(1);

      expect(result).toEqual(orders);
      expect(orderRepository.getOrdersWithItemsByUser).toHaveBeenCalledWith(1);
    });

    it('should throw ValidationError if userId is not provided', async () => {
      await expect(orderService.findByUser(null)).rejects.toThrow(ValidationError);
    });

    it('should return empty array if user has no orders', async () => {
      orderRepository.getOrdersWithItemsByUser.mockResolvedValue([]);

      const result = await orderService.findByUser(1);

      expect(result).toEqual([]);
    });
  });

  describe('updateStatus', () => {
    it('should update order status successfully', async () => {
      const order = { id: 1, userId: 1, status: 'pending' };
      const updatedOrder = { ...order, status: 'paid' };

      orderRepository.findById.mockResolvedValue(order);
      orderRepository.updateStatus.mockResolvedValue(updatedOrder);

      const result = await orderService.updateStatus(1, { status: 'paid' }, mockAdmin);

      expect(result.status).toBe('paid');
    });

    it('should throw ValidationError for invalid status', async () => {
      await expect(
        orderService.updateStatus(1, { status: 'invalid_status' }, mockAdmin)
      ).rejects.toThrow(ValidationError);
    });

    it('should throw NotFoundError if order not found', async () => {
      orderRepository.findById.mockResolvedValue(null);

      await expect(orderService.updateStatus(999, { status: 'paid' }, mockAdmin)).rejects.toThrow(
        NotFoundError
      );
    });
  });

  describe('cancel', () => {
    it('should cancel pending order and restore stock', async () => {
      const order = {
        id: 1,
        userId: 1,
        status: 'pending',
        items: [
          { productId: 1, quantity: 2 },
          { productId: 2, quantity: 1 },
        ],
      };

      orderRepository.getOrderWithItems.mockResolvedValue(order);
      productRepository.incrementStock.mockResolvedValue({});

      const result = await orderService.cancel(1, mockUser);

      expect(result.message).toContain('hủy');
      expect(result.orderId).toBe(1);
    });

    it('should throw AuthorizationError for non-owner non-admin', async () => {
      const order = {
        id: 1,
        userId: 99,
        status: 'pending',
      };

      orderRepository.getOrderWithItems.mockResolvedValue(order);

      await expect(orderService.cancel(1, mockUser)).rejects.toThrow(AuthorizationError);
    });
  });
});
