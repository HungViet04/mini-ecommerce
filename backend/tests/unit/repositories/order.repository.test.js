/**
 * Order Repository Tests
 * Comprehensive tests for order database operations
 */

jest.mock('../../../src/config/database', () => ({
  query: jest.fn(),
}));

const database = require('../../../src/config/database');
const orderRepository = require('../../../src/repositories/order.repository');

describe('OrderRepository', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('createOrder', () => {
    it('should create order with all shipping info', async () => {
      const mockConnection = {
        query: jest.fn().mockResolvedValueOnce([{ insertId: 1 }]),
      };
      const orderData = {
        userId: 1,
        total: 500000,
        status: 'pending',
        shippingName: 'Nguyễn Văn A',
        shippingPhone: '0901234567',
        shippingAddress: '123 Street',
        shippingCity: 'Hà Nội',
        shippingNotes: 'Call before delivery',
        paymentMethod: 'cod',
        shippingFee: 30000,
      };

      const result = await orderRepository.createOrder(mockConnection, orderData);

      expect(result.id).toBe(1);
      expect(result.userId).toBe(1);
      expect(result.total).toBe(500000);
      expect(result.shippingName).toBe('Nguyễn Văn A');
      expect(mockConnection.query).toHaveBeenCalledWith(
        expect.stringContaining('INSERT INTO'),
        expect.arrayContaining([
          1,
          500000,
          'pending',
          'Nguyễn Văn A',
          '0901234567',
          '123 Street',
          'Hà Nội',
          'Call before delivery',
          'cod',
          30000,
        ])
      );
    });

    it('should use default values for optional fields', async () => {
      const mockConnection = {
        query: jest.fn().mockResolvedValueOnce([{ insertId: 2 }]),
      };
      const orderData = {
        userId: 1,
        total: 100000,
      };

      const result = await orderRepository.createOrder(mockConnection, orderData);

      expect(result.status).toBe('pending');
      expect(result.paymentMethod).toBe('cod');
      expect(result.shippingFee).toBe(30000);
    });

    it('should handle null shipping info', async () => {
      const mockConnection = {
        query: jest.fn().mockResolvedValueOnce([{ insertId: 3 }]),
      };
      const orderData = {
        userId: 1,
        total: 50000,
        shippingName: null,
        shippingPhone: null,
        shippingAddress: null,
      };

      const result = await orderRepository.createOrder(mockConnection, orderData);

      expect(result.shippingName).toBeNull();
      expect(result.shippingPhone).toBeNull();
      expect(result.shippingAddress).toBeNull();
    });
  });

  describe('createOrderItem', () => {
    it('should create order item', async () => {
      const mockConnection = {
        query: jest.fn().mockResolvedValueOnce([{ insertId: 10 }]),
      };
      const itemData = {
        orderId: 1,
        productId: 5,
        quantity: 2,
        price: 100000,
      };

      const result = await orderRepository.createOrderItem(mockConnection, itemData);

      expect(result.id).toBe(10);
      expect(result.orderId).toBe(1);
      expect(result.productId).toBe(5);
      expect(result.quantity).toBe(2);
      expect(result.price).toBe(100000);
      expect(mockConnection.query).toHaveBeenCalledWith(
        expect.stringContaining('INSERT INTO order_items'),
        [1, 5, 2, 100000]
      );
    });
  });

  describe('getOrdersWithItemsByUser', () => {
    it('should return orders with items for user', async () => {
      const mockRows = [
        {
          order_id: 1,
          user_id: 1,
          total: 500000,
          status: 'pending',
          created_at: new Date(),
          shipping_name: 'Test User',
          shipping_phone: '0901234567',
          shipping_address: '123 Street',
          shipping_city: 'HCM',
          shipping_notes: null,
          payment_method: 'cod',
          shipping_fee: 30000,
          item_id: 1,
          product_id: 1,
          quantity: 2,
          price: 100000,
          product_name: 'Product 1',
        },
        {
          order_id: 1,
          user_id: 1,
          total: 500000,
          status: 'pending',
          created_at: new Date(),
          shipping_name: 'Test User',
          shipping_phone: '0901234567',
          shipping_address: '123 Street',
          shipping_city: 'HCM',
          shipping_notes: null,
          payment_method: 'cod',
          shipping_fee: 30000,
          item_id: 2,
          product_id: 2,
          quantity: 1,
          price: 200000,
          product_name: 'Product 2',
        },
      ];
      database.query.mockResolvedValueOnce([mockRows]);

      const result = await orderRepository.getOrdersWithItemsByUser(1);

      expect(result).toHaveLength(1); // 1 order with 2 items
      expect(result[0].items).toHaveLength(2);
      expect(result[0].id).toBe(1);
      expect(result[0].userId).toBe(1);
    });

    it('should return empty array for user with no orders', async () => {
      database.query.mockResolvedValueOnce([[]]);

      const result = await orderRepository.getOrdersWithItemsByUser(999);

      expect(result).toEqual([]);
    });

    it('should order by created_at DESC', async () => {
      database.query.mockResolvedValueOnce([[]]);

      await orderRepository.getOrdersWithItemsByUser(1);

      expect(database.query).toHaveBeenCalledWith(
        expect.stringContaining('ORDER BY o.created_at DESC'),
        [1]
      );
    });

    it('should aggregate items correctly for multiple orders', async () => {
      const mockRows = [
        {
          order_id: 2,
          user_id: 1,
          total: 300000,
          status: 'paid',
          created_at: new Date(),
          item_id: 3,
          product_id: 3,
          quantity: 1,
          price: 300000,
          product_name: 'Product 3',
        },
        {
          order_id: 1,
          user_id: 1,
          total: 100000,
          status: 'pending',
          created_at: new Date(),
          item_id: 1,
          product_id: 1,
          quantity: 1,
          price: 100000,
          product_name: 'Product 1',
        },
      ];
      database.query.mockResolvedValueOnce([mockRows]);

      const result = await orderRepository.getOrdersWithItemsByUser(1);

      expect(result).toHaveLength(2);
      expect(result[0].id).toBe(2); // First order (higher ID)
      expect(result[1].id).toBe(1);
    });
  });

  describe('getOrderWithItems', () => {
    it('should return order with items by ID', async () => {
      const mockRows = [
        {
          order_id: 1,
          user_id: 1,
          total: 500000,
          status: 'pending',
          created_at: new Date(),
          shipping_name: 'Test',
          shipping_phone: '0901234567',
          shipping_address: '123 Street',
          shipping_city: 'HCM',
          shipping_notes: 'Notes',
          payment_method: 'cod',
          shipping_fee: 30000,
          item_id: 1,
          product_id: 1,
          quantity: 2,
          price: 100000,
          product_name: 'Product 1',
        },
      ];
      database.query.mockResolvedValueOnce([mockRows]);

      const result = await orderRepository.getOrderWithItems(1);

      expect(result.id).toBe(1);
      expect(result.items).toHaveLength(1);
      expect(result.items[0].productId).toBe(1);
    });

    it('should return null for non-existent order', async () => {
      database.query.mockResolvedValueOnce([[]]);

      const result = await orderRepository.getOrderWithItems(999);

      expect(result).toBeNull();
    });

    it('should include shipping info in result', async () => {
      const mockRows = [
        {
          order_id: 1,
          user_id: 1,
          total: 100000,
          status: 'pending',
          created_at: new Date(),
          shipping_name: 'Nguyen Van A',
          shipping_phone: '0909090909',
          shipping_address: '456 Avenue',
          shipping_city: 'Da Nang',
          shipping_notes: 'Ring doorbell',
          payment_method: 'bank',
          shipping_fee: 50000,
          item_id: 1,
          product_id: 1,
          quantity: 1,
          price: 50000,
          product_name: 'Test Product',
        },
      ];
      database.query.mockResolvedValueOnce([mockRows]);

      const result = await orderRepository.getOrderWithItems(1);

      // The result uses flat structure: shippingName, shippingPhone, etc.
      expect(result.shippingName).toBe('Nguyen Van A');
      expect(result.shippingPhone).toBe('0909090909');
      expect(result.shippingAddress).toBe('456 Avenue');
      expect(result.shippingCity).toBe('Da Nang');
      expect(result.shippingNotes).toBe('Ring doorbell');
    });
  });

  describe('updateStatus', () => {
    it('should update order status', async () => {
      database.query.mockResolvedValueOnce([{ affectedRows: 1 }]);
      database.query.mockResolvedValueOnce([[{ id: 1, status: 'paid' }]]);

      const result = await orderRepository.updateStatus(1, 'paid');

      expect(database.query).toHaveBeenCalledWith(
        expect.stringContaining('UPDATE'),
        expect.arrayContaining(['paid', 1])
      );
      expect(result.status).toBe('paid');
    });

    it('should handle different status values', async () => {
      const statuses = ['pending', 'paid', 'shipped', 'delivered', 'cancelled'];

      for (const status of statuses) {
        database.query.mockResolvedValueOnce([{ affectedRows: 1 }]);
        database.query.mockResolvedValueOnce([[{ id: 1, status }]]);

        const result = await orderRepository.updateStatus(1, status);
        expect(result.status).toBe(status);
      }
    });
  });

  describe('findAllWithPagination', () => {
    it('should return paginated orders', async () => {
      const mockOrders = [
        { id: 1, total: 500000, status: 'pending' },
        { id: 2, total: 300000, status: 'paid' },
      ];
      const mockRows = [
        {
          order_id: 1,
          user_id: 1,
          total: 500000,
          status: 'pending',
          item_id: 1,
          product_id: 1,
          quantity: 1,
          price: 500000,
          product_name: 'P1',
        },
        {
          order_id: 2,
          user_id: 1,
          total: 300000,
          status: 'paid',
          item_id: 2,
          product_id: 2,
          quantity: 1,
          price: 300000,
          product_name: 'P2',
        },
      ];
      database.query
        .mockResolvedValueOnce([mockOrders]) // subquery for IDs
        .mockResolvedValueOnce([mockRows]) // main query with details
        .mockResolvedValueOnce([[{ total: 50 }]]); // count query

      const result = await orderRepository.findAllWithPagination({ page: 1, limit: 10 });

      expect(result.items).toHaveLength(2);
      expect(result.total).toBe(50);
    });

    it('should apply status filter', async () => {
      const mockOrders = [{ id: 1, status: 'pending' }];
      const mockRows = [
        {
          order_id: 1,
          user_id: 1,
          total: 100000,
          status: 'pending',
          item_id: 1,
          product_id: 1,
          quantity: 1,
          price: 100000,
          product_name: 'P1',
        },
      ];
      database.query
        .mockResolvedValueOnce([mockOrders])
        .mockResolvedValueOnce([mockRows])
        .mockResolvedValueOnce([[{ total: 1 }]]);

      await orderRepository.findAllWithPagination({ status: 'pending' });

      expect(database.query).toHaveBeenCalledWith(
        expect.stringContaining('status = ?'),
        expect.arrayContaining(['pending'])
      );
    });

    it('should apply search filter', async () => {
      const mockOrders = [{ id: 1, status: 'pending' }];
      const mockRows = [
        {
          order_id: 1,
          user_id: 1,
          total: 100000,
          status: 'pending',
          item_id: 1,
          product_id: 1,
          quantity: 1,
          price: 100000,
          product_name: 'P1',
        },
      ];
      database.query
        .mockResolvedValueOnce([mockOrders])
        .mockResolvedValueOnce([mockRows])
        .mockResolvedValueOnce([[{ total: 1 }]]);

      await orderRepository.findAllWithPagination({
        search: 'test',
      });

      expect(database.query).toHaveBeenCalledWith(
        expect.stringContaining('shipping_name LIKE'),
        expect.any(Array)
      );
    });

    it('should order by created_at DESC by default', async () => {
      // When no orders match, it returns early
      database.query.mockResolvedValueOnce([[]]);

      await orderRepository.findAllWithPagination({});

      expect(database.query).toHaveBeenCalledWith(
        expect.stringContaining('ORDER BY'),
        expect.any(Array)
      );
    });
  });

  describe('aggregateOrderItems', () => {
    it('should aggregate order rows into orders with items array', async () => {
      const date1 = new Date('2024-01-02');
      const date2 = new Date('2024-01-01');
      const mockRows = [
        {
          order_id: 1,
          user_id: 1,
          total: 200000,
          status: 'pending',
          created_at: date1,
          shipping_name: 'Test',
          shipping_phone: '0901234567',
          shipping_address: '123',
          shipping_city: 'HCM',
          shipping_notes: null,
          payment_method: 'cod',
          shipping_fee: 30000,
          item_id: 1,
          product_id: 1,
          quantity: 1,
          price: 100000,
          product_name: 'P1',
        },
        {
          order_id: 1,
          user_id: 1,
          total: 200000,
          status: 'pending',
          created_at: date1,
          shipping_name: 'Test',
          shipping_phone: '0901234567',
          shipping_address: '123',
          shipping_city: 'HCM',
          shipping_notes: null,
          payment_method: 'cod',
          shipping_fee: 30000,
          item_id: 2,
          product_id: 2,
          quantity: 1,
          price: 100000,
          product_name: 'P2',
        },
        {
          order_id: 2,
          user_id: 1,
          total: 50000,
          status: 'paid',
          created_at: date2,
          shipping_name: 'Test2',
          shipping_phone: '0901234568',
          shipping_address: '456',
          shipping_city: 'HN',
          shipping_notes: null,
          payment_method: 'cod',
          shipping_fee: 30000,
          item_id: 3,
          product_id: 3,
          quantity: 1,
          price: 50000,
          product_name: 'P3',
        },
      ];
      database.query.mockResolvedValueOnce([mockRows]);

      const result = await orderRepository.getOrdersWithItemsByUser(1);

      expect(result).toHaveLength(2);
      expect(result[0].items).toHaveLength(2);
      expect(result[1].items).toHaveLength(1);
    });

    it('should handle order without items', async () => {
      const mockRows = [
        {
          order_id: 1,
          user_id: 1,
          total: 0,
          status: 'pending',
          created_at: new Date(),
          shipping_name: 'Test',
          shipping_phone: '0901234567',
          shipping_address: '123',
          shipping_city: 'HCM',
          shipping_notes: null,
          payment_method: 'cod',
          shipping_fee: 30000,
          item_id: null,
          product_id: null,
          quantity: null,
          price: null,
          product_name: null,
        },
      ];
      database.query.mockResolvedValueOnce([mockRows]);

      const result = await orderRepository.getOrdersWithItemsByUser(1);

      expect(result).toHaveLength(1);
      expect(result[0].items).toHaveLength(0);
    });
  });

  describe('cancelOrder', () => {
    it('should cancel order and restore stock', async () => {
      // updateStatus calls query twice: UPDATE and then findById
      database.query
        .mockResolvedValueOnce([{ affectedRows: 1 }]) // Update status query
        .mockResolvedValueOnce([[{ id: 1, status: 'cancelled' }]]); // findById query

      const result = await orderRepository.updateStatus(1, 'cancelled');

      expect(result.status).toBe('cancelled');
    });
  });

  describe('getOrdersByStatus', () => {
    it('should return orders filtered by status', async () => {
      const mockOrders = [
        { id: 1, status: 'pending' },
        { id: 2, status: 'pending' },
      ];
      const mockRows = [
        {
          order_id: 1,
          user_id: 1,
          total: 100000,
          status: 'pending',
          item_id: 1,
          product_id: 1,
          quantity: 1,
          price: 100000,
          product_name: 'P1',
        },
        {
          order_id: 2,
          user_id: 1,
          total: 100000,
          status: 'pending',
          item_id: 2,
          product_id: 2,
          quantity: 1,
          price: 100000,
          product_name: 'P2',
        },
      ];
      database.query
        .mockResolvedValueOnce([mockOrders])
        .mockResolvedValueOnce([mockRows])
        .mockResolvedValueOnce([[{ total: 2 }]]);

      await orderRepository.findAllWithPagination({ status: 'pending' });

      expect(database.query).toHaveBeenCalledWith(
        expect.stringContaining('status = ?'),
        expect.arrayContaining(['pending'])
      );
    });
  });

  describe('getUserOrderCount', () => {
    it('should count orders for a user', async () => {
      database.query.mockResolvedValueOnce([[{ count: 10 }]]);

      const result = await orderRepository.count({ user_id: 1 });

      expect(result).toBe(10);
    });
  });
});
