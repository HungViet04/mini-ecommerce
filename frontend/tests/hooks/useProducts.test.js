/**
 * useProducts Hook Tests
 * Tests for products data fetching hook
 */
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, waitFor, act } from '@testing-library/react';
import { useProducts, useProduct } from '../../src/hooks/useProducts';

// Mock productService
vi.mock('../../src/services', () => ({
  productService: {
    getAll: vi.fn(),
    getById: vi.fn(),
  },
}));

import { productService } from '../../src/services';

describe('useProducts', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('Initial fetch', () => {
    it('should fetch products on mount when autoFetch is true', async () => {
      const mockProducts = {
        items: [
          { id: 1, name: 'Product 1', price: 100000 },
          { id: 2, name: 'Product 2', price: 200000 },
        ],
        total: 2,
      };

      productService.getAll.mockResolvedValue(mockProducts);

      const { result } = renderHook(() => useProducts({ autoFetch: true }));

      expect(result.current.loading).toBe(true);

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      expect(productService.getAll).toHaveBeenCalled();
      expect(result.current.products).toEqual(mockProducts.items);
    });

    it('should not fetch on mount when autoFetch is false', async () => {
      const { result } = renderHook(() => useProducts({ autoFetch: false }));

      expect(result.current.loading).toBe(false);
      expect(productService.getAll).not.toHaveBeenCalled();
    });

    it('should use default autoFetch as true', async () => {
      productService.getAll.mockResolvedValue({ items: [], total: 0 });

      renderHook(() => useProducts());

      await waitFor(() => {
        expect(productService.getAll).toHaveBeenCalled();
      });
    });
  });

  describe('fetchProducts', () => {
    it('should fetch products with pagination params', async () => {
      productService.getAll.mockResolvedValue({ items: [], total: 0 });

      const { result } = renderHook(() => useProducts({ autoFetch: false, page: 1, limit: 10 }));

      await act(async () => {
        await result.current.fetchProducts({ page: 2, limit: 20 });
      });

      expect(productService.getAll).toHaveBeenCalledWith({
        page: 2,
        limit: 20,
      });
    });

    it('should handle array response format', async () => {
      const mockProducts = [
        { id: 1, name: 'Product 1' },
        { id: 2, name: 'Product 2' },
      ];

      productService.getAll.mockResolvedValue(mockProducts);

      const { result } = renderHook(() => useProducts({ autoFetch: true }));

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      expect(result.current.products).toEqual(mockProducts);
      expect(result.current.pagination.total).toBe(2);
    });

    it('should handle different response formats', async () => {
      const mockResponse = {
        data: [{ id: 1, name: 'Product 1' }],
        total: 10,
        page: 1,
        limit: 20,
      };

      productService.getAll.mockResolvedValue(mockResponse);

      const { result } = renderHook(() => useProducts({ autoFetch: true }));

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      expect(result.current.products).toEqual(mockResponse.data);
    });
  });

  describe('Error handling', () => {
    it('should set error state on fetch failure', async () => {
      productService.getAll.mockRejectedValue(new Error('Network error'));

      const { result } = renderHook(() => useProducts({ autoFetch: true }));

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      expect(result.current.error).toBe('Network error');
      expect(result.current.products).toEqual([]);
    });

    it('should use default error message if none provided', async () => {
      productService.getAll.mockRejectedValue({});

      const { result } = renderHook(() => useProducts({ autoFetch: true }));

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      expect(result.current.error).toBe('Không thể tải danh sách sản phẩm');
    });

    it('should clear error on successful fetch', async () => {
      productService.getAll
        .mockRejectedValueOnce(new Error('Error'))
        .mockResolvedValueOnce({ items: [], total: 0 });

      const { result } = renderHook(() => useProducts({ autoFetch: true }));

      await waitFor(() => {
        expect(result.current.error).not.toBeNull();
      });

      await act(async () => {
        await result.current.fetchProducts();
      });

      expect(result.current.error).toBeNull();
    });
  });

  describe('refetch', () => {
    it('should refetch products', async () => {
      productService.getAll.mockResolvedValue({ items: [], total: 0 });

      const { result } = renderHook(() => useProducts({ autoFetch: true }));

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      expect(productService.getAll).toHaveBeenCalledTimes(1);

      await act(async () => {
        result.current.refetch();
      });

      await waitFor(() => {
        expect(productService.getAll).toHaveBeenCalledTimes(2);
      });
    });
  });

  describe('Loading state', () => {
    it('should set loading true during fetch', async () => {
      let resolvePromise;
      productService.getAll.mockImplementation(
        () =>
          new Promise((resolve) => {
            resolvePromise = resolve;
          })
      );

      const { result } = renderHook(() => useProducts({ autoFetch: true }));

      expect(result.current.loading).toBe(true);

      await act(async () => {
        resolvePromise({ items: [], total: 0 });
      });

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });
    });
  });
});

describe('useProduct', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should fetch single product by id', async () => {
    const mockProduct = { id: 1, name: 'Test Product', price: 100000 };
    productService.getById.mockResolvedValue(mockProduct);

    const { result } = renderHook(() => useProduct(1));

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    expect(productService.getById).toHaveBeenCalledWith(1);
    expect(result.current.product).toEqual(mockProduct);
  });

  it('should handle product not found', async () => {
    productService.getById.mockRejectedValue(new Error('Product not found'));

    const { result } = renderHook(() => useProduct(999));

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    expect(result.current.error).toBeDefined();
    expect(result.current.product).toBeNull();
  });

  it('should not fetch if productId is falsy', async () => {
    const { result } = renderHook(() => useProduct(null));

    expect(productService.getById).not.toHaveBeenCalled();
    expect(result.current.product).toBeNull();
  });
});
