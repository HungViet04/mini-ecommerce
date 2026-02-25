/**
 * Order Service Tests
 * Comprehensive tests for order API service
 */
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { orderService } from '../../src/services/order.service';
import httpClient from '../../src/services/http.client';

// Mock http client
vi.mock('../../src/services/http.client', () => ({
  default: {
    get: vi.fn(),
    post: vi.fn(),
    put: vi.fn(),
    patch: vi.fn(),
    addRequestInterceptor: vi.fn(),
    addResponseInterceptor: vi.fn(),
  },
}));

describe('OrderService', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('getMyOrders', () => {
    it('should get current user orders', async () => {
      const mockOrders = {
        data: [
          { id: 1, total: 500000, status: 'pending' },
          { id: 2, total: 300000, status: 'delivered' },
        ],
      };
      httpClient.get.mockResolvedValueOnce(mockOrders);

      const result = await orderService.getMyOrders();

      expect(httpClient.get).toHaveBeenCalledWith('/orders/my');
      expect(result).toHaveLength(2);
    });

    it('should require authentication', async () => {
      httpClient.get.mockResolvedValueOnce({ data: [] });

      await orderService.getMyOrders();

      // Should call without skipAuth
      expect(httpClient.get).toHaveBeenCalledWith('/orders/my');
    });
  });

  describe('getById', () => {
    it('should get order by ID', async () => {
      const mockOrder = {
        data: {
          id: 1,
          total: 500000,
          status: 'pending',
          items: [{ productId: 1, quantity: 2, price: 250000 }],
        },
      };
      httpClient.get.mockResolvedValueOnce(mockOrder);

      const result = await orderService.getById(1);

      expect(httpClient.get).toHaveBeenCalledWith('/orders/1');
      expect(result.id).toBe(1);
      expect(result.items).toHaveLength(1);
    });

    it('should throw error when order not found', async () => {
      httpClient.get.mockRejectedValueOnce(new Error('Order not found'));

      await expect(orderService.getById(999)).rejects.toThrow('Order not found');
    });
  });

  describe('create', () => {
    it('should create new order', async () => {
      const orderData = {
        items: [
          { productId: 1, quantity: 2 },
          { productId: 2, quantity: 1 },
        ],
        shippingInfo: {
          name: 'Nguyễn Văn A',
          phone: '0901234567',
          address: '123 Street',
          city: 'Hà Nội',
        },
        paymentMethod: 'cod',
      };
      const mockResponse = {
        data: { id: 1, total: 500000, status: 'pending' },
      };
      httpClient.post.mockResolvedValueOnce(mockResponse);

      const result = await orderService.create(orderData);

      expect(httpClient.post).toHaveBeenCalledWith('/orders', {
        items: [
          { productId: 1, quantity: 2 },
          { productId: 2, quantity: 1 },
        ],
        shippingInfo: orderData.shippingInfo,
        paymentMethod: 'cod',
      });
      expect(result.id).toBe(1);
    });

    it('should require authentication', async () => {
      httpClient.post.mockResolvedValueOnce({ data: { id: 1 } });

      await orderService.create({
        items: [{ productId: 1, quantity: 1 }],
      });

      expect(httpClient.post).toHaveBeenCalledWith('/orders', expect.any(Object));
    });

    it('should throw error on order creation failure', async () => {
      httpClient.post.mockRejectedValueOnce(new Error('Out of stock'));

      await expect(orderService.create({ items: [{ productId: 1, quantity: 1 }] })).rejects.toThrow(
        'Out of stock'
      );
    });
  });

  describe('cancel', () => {
    it('should cancel order', async () => {
      const mockResponse = { data: { id: 1, status: 'cancelled' } };
      httpClient.post.mockResolvedValueOnce(mockResponse);

      const result = await orderService.cancel(1);

      expect(httpClient.post).toHaveBeenCalledWith('/orders/1/cancel');
      expect(result.status).toBe('cancelled');
    });

    it('should throw error if order cannot be cancelled', async () => {
      httpClient.post.mockRejectedValueOnce(new Error('Order already shipped'));

      await expect(orderService.cancel(1)).rejects.toThrow('Order already shipped');
    });
  });

  describe('confirmDelivery', () => {
    it('should confirm order delivery', async () => {
      const mockResponse = { data: { id: 1, status: 'delivered' } };
      httpClient.post.mockResolvedValueOnce(mockResponse);

      const result = await orderService.confirmDelivery(1);

      expect(httpClient.post).toHaveBeenCalledWith('/orders/1/confirm-delivery');
      expect(result.status).toBe('delivered');
    });
  });

  describe('Admin operations', () => {
    describe('getAll', () => {
      it('should get all orders with pagination', async () => {
        const mockOrders = {
          data: {
            items: [{ id: 1 }, { id: 2 }],
            total: 50,
          },
        };
        httpClient.get.mockResolvedValueOnce(mockOrders);

        const result = await orderService.getAll({ page: 1, limit: 10 });

        expect(httpClient.get).toHaveBeenCalledWith('/orders?page=1&limit=10');
        expect(result.items).toHaveLength(2);
      });

      it('should filter by status', async () => {
        httpClient.get.mockResolvedValueOnce({ data: { items: [] } });

        await orderService.getAll({ status: 'pending' });

        expect(httpClient.get).toHaveBeenCalledWith(expect.stringContaining('status=pending'));
      });

      it('should get all orders without params', async () => {
        httpClient.get.mockResolvedValueOnce({ data: { items: [] } });

        await orderService.getAll();

        expect(httpClient.get).toHaveBeenCalledWith('/orders');
      });
    });

    describe('updateStatus', () => {
      it('should update order status', async () => {
        const mockResponse = { data: { id: 1, status: 'shipped' } };
        httpClient.patch.mockResolvedValueOnce(mockResponse);

        const result = await orderService.updateStatus(1, 'shipped');

        expect(httpClient.patch).toHaveBeenCalledWith('/orders/1/status', { status: 'shipped' });
        expect(result.status).toBe('shipped');
      });

      it('should handle all status transitions', async () => {
        const statuses = ['pending', 'paid', 'shipped', 'delivered', 'cancelled'];

        for (const status of statuses) {
          httpClient.patch.mockResolvedValueOnce({ data: { status } });
          const result = await orderService.updateStatus(1, status);
          expect(result.status).toBe(status);
        }
      });

      it('should throw error for invalid status transition', async () => {
        httpClient.patch.mockRejectedValueOnce(new Error('Invalid status transition'));

        await expect(orderService.updateStatus(1, 'invalid')).rejects.toThrow();
      });
    });
  });

  describe('response handling', () => {
    it('should handle response with data wrapper', async () => {
      httpClient.get.mockResolvedValueOnce({ data: [{ id: 1 }] });

      const result = await orderService.getMyOrders();

      expect(result).toHaveLength(1);
    });

    it('should handle response without data wrapper', async () => {
      httpClient.get.mockResolvedValueOnce([{ id: 1 }]);

      const result = await orderService.getMyOrders();

      expect(result).toHaveLength(1);
    });
  });
});
