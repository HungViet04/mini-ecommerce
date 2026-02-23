/**
 * useAdminOrders Hook Tests
 * Tests for real useAdminOrders (src/hooks/useAdminOrders.js)
 */
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, waitFor, act } from '@testing-library/react';
import { useAdminOrders } from '../../src/hooks/useAdminOrders';

// Mock orderService
vi.mock('../../src/services', () => ({
  orderService: {
    getAll: vi.fn(),
    updateStatus: vi.fn(),
  },
}));

import { orderService } from '../../src/services';

describe('useAdminOrders', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('Initial state', () => {
    it('should have empty orders initially', () => {
      orderService.getAll.mockResolvedValue({ data: [] });

      const { result } = renderHook(() => useAdminOrders());

      expect(result.current.orders).toEqual([]);
      expect(result.current.error).toBeNull();
      expect(result.current.updating).toBe(false);
      expect(result.current.search).toBe('');
    });
  });

  describe('fetchOrders', () => {
    it('should auto-fetch orders on mount', async () => {
      const mockOrders = [
        { id: 1, status: 'pending', total: 100000 },
        { id: 2, status: 'shipped', total: 200000 },
      ];
      orderService.getAll.mockResolvedValue(mockOrders);

      const { result } = renderHook(() => useAdminOrders());

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      expect(result.current.orders).toEqual(mockOrders);
      expect(orderService.getAll).toHaveBeenCalled();
    });

    it('should not auto-fetch when autoFetch is false', async () => {
      const { result } = renderHook(() => useAdminOrders({ autoFetch: false }));

      // Give it a tick
      await new Promise(r => setTimeout(r, 50));

      expect(orderService.getAll).not.toHaveBeenCalled();
      expect(result.current.orders).toEqual([]);
    });

    it('should pass status param when provided', async () => {
      orderService.getAll.mockResolvedValue([]);

      renderHook(() => useAdminOrders({ status: 'pending' }));

      await waitFor(() => {
        expect(orderService.getAll).toHaveBeenCalledWith(
          expect.objectContaining({ status: 'pending' })
        );
      });
    });

    it('should handle paginated response', async () => {
      orderService.getAll.mockResolvedValue({
        data: [{ id: 1 }, { id: 2 }],
        meta: { pagination: { page: 1, total: 2 } },
      });

      const { result } = renderHook(() => useAdminOrders());

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      expect(result.current.orders).toEqual([{ id: 1 }, { id: 2 }]);
    });

    it('should handle error during fetch', async () => {
      orderService.getAll.mockRejectedValue(new Error('Server error'));

      const { result } = renderHook(() => useAdminOrders());

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      expect(result.current.error).toBeDefined();
      expect(result.current.orders).toEqual([]);
    });
  });

  describe('updateOrderStatus', () => {
    it('should update order status and local state', async () => {
      orderService.getAll.mockResolvedValue([
        { id: 1, status: 'pending' },
        { id: 2, status: 'pending' },
      ]);
      orderService.updateStatus.mockResolvedValue({});

      const { result } = renderHook(() => useAdminOrders());

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      let success;
      await act(async () => {
        success = await result.current.updateOrderStatus(1, 'shipped');
      });

      expect(success).toBe(true);
      expect(orderService.updateStatus).toHaveBeenCalledWith(1, 'shipped');
      // Local state should be updated
      const order1 = result.current.orders.find(o => o.id === 1);
      expect(order1.status).toBe('shipped');
    });

    it('should handle update error', async () => {
      orderService.getAll.mockResolvedValue([{ id: 1, status: 'pending' }]);
      orderService.updateStatus.mockRejectedValue(new Error('Update failed'));

      const { result } = renderHook(() => useAdminOrders());

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      let success;
      await act(async () => {
        success = await result.current.updateOrderStatus(1, 'shipped');
      });

      expect(success).toBe(false);
      expect(result.current.error).toBeDefined();
    });
  });

  describe('search', () => {
    it('should expose setSearch to update search state', async () => {
      orderService.getAll.mockResolvedValue([]);

      const { result } = renderHook(() => useAdminOrders());

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      act(() => {
        result.current.setSearch('test query');
      });

      expect(result.current.search).toBe('test query');
    });
  });

  describe('refetch', () => {
    it('should provide refetch function', async () => {
      orderService.getAll.mockResolvedValue([]);

      const { result } = renderHook(() => useAdminOrders());

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      await act(async () => {
        await result.current.refetch();
      });

      expect(orderService.getAll).toHaveBeenCalledTimes(2);
    });
  });
});

