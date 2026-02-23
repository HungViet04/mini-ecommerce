/**
 * Order Controller Unit Tests
 * Tests for order HTTP request handling
 */

// Mock asyncHandler FIRST - must be before requiring controller
jest.mock('../../../src/helpers/async.helper', () => ({
  asyncHandler: fn => async (req, res, next) => {
    try {
      await fn(req, res, next);
    } catch (error) {
      next(error);
    }
  },
}));

// Mock helpers
jest.mock('../../../src/helpers', () => ({
  response: {
    success: jest.fn((res, data) => res.status(200).json(data)),
    created: jest.fn((res, data, message) =>
      res.status(201).json({ success: true, data, message })
    ),
    noContent: jest.fn(res => res.status(204).send()),
    paginated: jest.fn((res, data) => res.status(200).json({ success: true, ...data })),
  },
}));

// Mock pagination helper
jest.mock('../../../src/helpers/pagination.helper', () => ({
  parsePagination: jest.fn(query => ({
    page: query.page || 1,
    limit: query.limit || 10,
  })),
}));

// Mock services
jest.mock('../../../src/services', () => ({
  orderService: {
    create: jest.fn(),
    findById: jest.fn(),
    findByUser: jest.fn(),
    findAll: jest.fn(),
    updateStatus: jest.fn(),
    cancel: jest.fn(),
    confirmDelivery: jest.fn(),
  },
}));

// Mock repositories (used by exportOrders)
jest.mock('../../../src/repositories', () => ({
  orderRepository: {
    getOrdersForExport: jest.fn(),
  },
}));

const { orderService } = require('../../../src/services');
const { response } = require('../../../src/helpers');
const orderController = require('../../../src/controllers/order.controller');

describe('Order Controller', () => {
  let req, res, next;

  beforeEach(() => {
    jest.clearAllMocks();

    req = {
      body: {},
      params: {},
      query: {},
      user: { id: 1, role: 'user' },
    };

    res = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn().mockReturnThis(),
      send: jest.fn().mockReturnThis(),
      set: jest.fn().mockReturnThis(),
      setHeader: jest.fn().mockReturnThis(),
    };

    next = jest.fn();
  });

  describe('create', () => {
    it('should create order successfully', async () => {
      const orderData = {
        items: [
          { productId: 1, quantity: 2 },
          { productId: 2, quantity: 1 },
        ],
      };
      const createdOrder = {
        id: 1,
        userId: 1,
        total: 300000,
        status: 'pending',
        items: orderData.items,
      };

      req.body = orderData;
      orderService.create.mockResolvedValueOnce(createdOrder);

      await orderController.create(req, res, next);

      expect(orderService.create).toHaveBeenCalledWith(orderData, req.user);
      expect(response.created).toHaveBeenCalled();
    });

    it('should pass user from authenticated request', async () => {
      req.user = { id: 42, role: 'user' };
      req.body = { items: [{ productId: 1, quantity: 1 }] };
      orderService.create.mockResolvedValueOnce({ id: 1 });

      await orderController.create(req, res, next);

      expect(orderService.create).toHaveBeenCalledWith(expect.any(Object), req.user);
    });

    it('should handle insufficient stock', async () => {
      req.body = { items: [{ productId: 1, quantity: 1000 }] };
      orderService.create.mockRejectedValueOnce(new Error('Insufficient stock'));

      await orderController.create(req, res, next);

      expect(next).toHaveBeenCalledWith(expect.any(Error));
    });

    it('should handle product not found', async () => {
      req.body = { items: [{ productId: 999, quantity: 1 }] };
      orderService.create.mockRejectedValueOnce(new Error('Product not found'));

      await orderController.create(req, res, next);

      expect(next).toHaveBeenCalled();
    });

    it('should handle empty items', async () => {
      req.body = { items: [] };
      orderService.create.mockRejectedValueOnce(new Error('Items required'));

      await orderController.create(req, res, next);

      expect(next).toHaveBeenCalled();
    });
  });

  describe('findById', () => {
    it('should return order by ID for owner', async () => {
      const order = {
        id: 1,
        userId: 1,
        total: 100000,
        status: 'pending',
        items: [],
      };

      req.params = { id: 1 };
      req.user = { id: 1, role: 'user' };
      orderService.findById.mockResolvedValueOnce(order);

      await orderController.findById(req, res, next);

      expect(orderService.findById).toHaveBeenCalledWith(1, req.user);
      expect(response.success).toHaveBeenCalled();
    });

    it('should allow admin to access any order', async () => {
      const order = { id: 1, userId: 999, total: 100000 };

      req.params = { id: 1 };
      req.user = { id: 1, role: 'admin' };
      orderService.findById.mockResolvedValueOnce(order);

      await orderController.findById(req, res, next);

      expect(orderService.findById).toHaveBeenCalledWith(1, req.user);
    });

    it('should handle order not found', async () => {
      req.params = { id: 999 };
      orderService.findById.mockRejectedValueOnce(new Error('Order not found'));

      await orderController.findById(req, res, next);

      expect(next).toHaveBeenCalled();
    });

    it('should handle unauthorized access', async () => {
      req.params = { id: 1 };
      req.user = { id: 2, role: 'user' }; // Different user
      orderService.findById.mockRejectedValueOnce(new Error('Unauthorized'));

      await orderController.findById(req, res, next);

      expect(next).toHaveBeenCalled();
    });
  });

  describe('getMyOrders', () => {
    it('should return user orders', async () => {
      const orders = [
        { id: 1, total: 100000, status: 'pending' },
        { id: 2, total: 200000, status: 'shipped' },
      ];

      req.user = { id: 1 };
      orderService.findByUser.mockResolvedValueOnce(orders);

      await orderController.getMyOrders(req, res, next);

      expect(orderService.findByUser).toHaveBeenCalledWith(1);
      expect(response.success).toHaveBeenCalled();
    });

    it('should return empty array for new user', async () => {
      req.user = { id: 999 };
      orderService.findByUser.mockResolvedValueOnce([]);

      await orderController.getMyOrders(req, res, next);

      expect(response.success).toHaveBeenCalled();
    });
  });

  describe('findAll (Admin)', () => {
    it('should return all orders for admin', async () => {
      const orders = {
        items: [{ id: 1 }, { id: 2 }],
        total: 2,
      };

      req.user = { id: 1, role: 'admin' };
      orderService.findAll.mockResolvedValueOnce(orders);

      await orderController.findAll(req, res, next);

      expect(orderService.findAll).toHaveBeenCalled();
    });

    it('should filter by status', async () => {
      req.query = { status: 'pending' };
      orderService.findAll.mockResolvedValueOnce({ items: [], total: 0 });

      await orderController.findAll(req, res, next);

      expect(orderService.findAll).toHaveBeenCalledWith(
        expect.objectContaining({ status: 'pending' })
      );
    });

    it('should handle search query', async () => {
      req.query = { search: 'test' };
      orderService.findAll.mockResolvedValueOnce({ items: [], total: 0 });

      await orderController.findAll(req, res, next);

      expect(orderService.findAll).toHaveBeenCalledWith(
        expect.objectContaining({ search: 'test' })
      );
    });
  });

  describe('updateStatus (Admin)', () => {
    it('should update order status', async () => {
      const updatedOrder = { id: 1, status: 'shipped' };

      req.params = { id: 1 };
      req.body = { status: 'shipped' };
      orderService.updateStatus.mockResolvedValueOnce(updatedOrder);

      await orderController.updateStatus(req, res, next);

      expect(orderService.updateStatus).toHaveBeenCalledWith(1, req.body, req.user);
      expect(response.success).toHaveBeenCalled();
    });

    it('should handle invalid status transition', async () => {
      req.params = { id: 1 };
      req.body = { status: 'delivered' }; // Invalid transition from pending
      orderService.updateStatus.mockRejectedValueOnce(new Error('Invalid status transition'));

      await orderController.updateStatus(req, res, next);

      expect(next).toHaveBeenCalled();
    });

    it('should handle order not found', async () => {
      req.params = { id: 999 };
      req.body = { status: 'shipped' };
      orderService.updateStatus.mockRejectedValueOnce(new Error('Order not found'));

      await orderController.updateStatus(req, res, next);

      expect(next).toHaveBeenCalled();
    });
  });

  describe('cancel', () => {
    it('should cancel order for owner', async () => {
      req.params = { id: 1 };
      req.user = { id: 1, role: 'user' };
      orderService.cancel.mockResolvedValueOnce({ id: 1, status: 'cancelled' });

      await orderController.cancel(req, res, next);

      expect(orderService.cancel).toHaveBeenCalledWith(1, req.user);
    });

    it('should allow admin to cancel any order', async () => {
      req.params = { id: 1 };
      req.user = { id: 99, role: 'admin' };
      orderService.cancel.mockResolvedValueOnce({ id: 1, status: 'cancelled' });

      await orderController.cancel(req, res, next);

      expect(orderService.cancel).toHaveBeenCalledWith(1, req.user);
    });

    it('should reject cancelling shipped order', async () => {
      req.params = { id: 1 };
      orderService.cancel.mockRejectedValueOnce(new Error('Cannot cancel shipped order'));

      await orderController.cancel(req, res, next);

      expect(next).toHaveBeenCalled();
    });
  });

  describe('confirmDelivery', () => {
    it('should confirm delivery for owner', async () => {
      req.params = { id: 1 };
      req.user = { id: 1 };
      orderService.confirmDelivery.mockResolvedValueOnce({ id: 1, status: 'delivered' });

      await orderController.confirmDelivery(req, res, next);

      expect(orderService.confirmDelivery).toHaveBeenCalledWith(1, req.user);
    });

    it('should handle order not shipped yet', async () => {
      req.params = { id: 1 };
      orderService.confirmDelivery.mockRejectedValueOnce(new Error('Order not shipped'));

      await orderController.confirmDelivery(req, res, next);

      expect(next).toHaveBeenCalled();
    });
  });
});

