/**
 * useOrders Hook Tests
 * Tests for orders data fetching hook
 */
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, waitFor, act } from '@testing-library/react';
import { useOrders } from '../../src/hooks/useOrders';

// Mock orderService — must match real interface
vi.mock('../../src/services', () => ({
  orderService: {
    getMyOrders: vi.fn(),
    getById: vi.fn(),
    create: vi.fn(),
    cancel: vi.fn(),
    confirmDelivery: vi.fn(),
  },
}));

import { orderService } from '../../src/services';

describe('useOrders', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('Initial state', () => {
    it('should have empty orders initially', () => {
      orderService.getMyOrders.mockResolvedValue([]);

      const { result } = renderHook(() => useOrders());

      expect(result.current.orders).toEqual([]);
      expect(result.current.error).toBeNull();
    });
  });

  describe('fetchOrders', () => {
    it('should fetch user orders', async () => {
      const mockOrders = [
        { id: 1, total: 100000, status: 'pending' },
        { id: 2, total: 200000, status: 'delivered' },
      ];

      orderService.getMyOrders.mockResolvedValue(mockOrders);

      const { result } = renderHook(() => useOrders());

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      expect(result.current.orders).toEqual(mockOrders);
    });

    it('should set loading state during fetch', async () => {
      let resolvePromise;
      orderService.getMyOrders.mockImplementation(
        () =>
          new Promise((resolve) => {
            resolvePromise = resolve;
          })
      );

      const { result } = renderHook(() => useOrders());

      expect(result.current.loading).toBe(true);

      await act(async () => {
        resolvePromise([]);
      });

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });
    });

    it('should handle fetch error', async () => {
      orderService.getMyOrders.mockRejectedValue(new Error('Failed to fetch'));

      const { result } = renderHook(() => useOrders());

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      expect(result.current.error).toBeDefined();
      expect(result.current.orders).toEqual([]);
    });
  });

  describe('refetch', () => {
    it('should refetch orders', async () => {
      orderService.getMyOrders.mockResolvedValue([]);

      const { result } = renderHook(() => useOrders());

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      await act(async () => {
        await result.current.refetch();
      });

      expect(orderService.getMyOrders).toHaveBeenCalledTimes(2);
    });
  });

  describe('Order filtering', () => {
    it('should filter orders by status', async () => {
      const mockOrders = [
        { id: 1, status: 'pending' },
        { id: 2, status: 'delivered' },
        { id: 3, status: 'pending' },
      ];

      orderService.getMyOrders.mockResolvedValue(mockOrders);

      const { result } = renderHook(() => useOrders());

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      const pendingOrders = result.current.orders.filter((o) => o.status === 'pending');
      expect(pendingOrders).toHaveLength(2);
    });
  });

  describe('cancelOrder', () => {
    it('should cancel order and refetch', async () => {
      orderService.getMyOrders.mockResolvedValue([{ id: 1, status: 'pending' }]);
      orderService.cancel.mockResolvedValue({});

      const { result } = renderHook(() => useOrders());

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      let success;
      await act(async () => {
        success = await result.current.cancelOrder(1);
      });

      expect(success).toBe(true);
      expect(orderService.cancel).toHaveBeenCalledWith(1);
      // Should refetch after cancel
      expect(orderService.getMyOrders).toHaveBeenCalledTimes(2);
    });

    it('should return false and set error on cancel failure', async () => {
      orderService.getMyOrders.mockResolvedValue([{ id: 1 }]);
      orderService.cancel.mockRejectedValue(new Error('Cannot cancel'));

      const { result } = renderHook(() => useOrders());

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      let success;
      await act(async () => {
        success = await result.current.cancelOrder(1);
      });

      expect(success).toBe(false);
      expect(result.current.error).toBeDefined();
    });
  });

  describe('confirmDelivery', () => {
    it('should confirm delivery and refetch', async () => {
      orderService.getMyOrders.mockResolvedValue([{ id: 1, status: 'shipped' }]);
      orderService.confirmDelivery.mockResolvedValue({});

      const { result } = renderHook(() => useOrders());

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      let success;
      await act(async () => {
        success = await result.current.confirmDelivery(1);
      });

      expect(success).toBe(true);
      expect(orderService.confirmDelivery).toHaveBeenCalledWith(1);
      expect(orderService.getMyOrders).toHaveBeenCalledTimes(2);
    });

    it('should return false on failure', async () => {
      orderService.getMyOrders.mockResolvedValue([{ id: 1 }]);
      orderService.confirmDelivery.mockRejectedValue(new Error('Failed'));

      const { result } = renderHook(() => useOrders());

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      let success;
      await act(async () => {
        success = await result.current.confirmDelivery(1);
      });

      expect(success).toBe(false);
      expect(result.current.error).toBeDefined();
    });
  });
});
