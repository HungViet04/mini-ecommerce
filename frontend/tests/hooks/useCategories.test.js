/**
 * useCategories & useAdminCategories Hook Tests
 * Tests for categories data fetching hooks
 */
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, waitFor, act } from '@testing-library/react';
import { useCategories, useAdminCategories } from '../../src/hooks/useCategories';

// Mock categoryService — must match real interface
vi.mock('../../src/services', () => ({
  categoryService: {
    getAll: vi.fn(),
    getById: vi.fn(),
    create: vi.fn(),
    update: vi.fn(),
    delete: vi.fn(),
  },
}));

import { categoryService } from '../../src/services';

describe('useCategories', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('Initial fetch', () => {
    it('should fetch categories on mount', async () => {
      const mockCategories = [
        { id: 1, name: 'Điện thoại' },
        { id: 2, name: 'Laptop' },
      ];

      categoryService.getAll.mockResolvedValue(mockCategories);

      const { result } = renderHook(() => useCategories());

      expect(result.current.loading).toBe(true);

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      expect(result.current.categories).toEqual(mockCategories);
    });

    it('should handle empty categories', async () => {
      categoryService.getAll.mockResolvedValue([]);

      const { result } = renderHook(() => useCategories());

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      expect(result.current.categories).toEqual([]);
    });
  });

  describe('Error handling', () => {
    it('should set error on fetch failure', async () => {
      categoryService.getAll.mockRejectedValue(new Error('Network error'));

      const { result } = renderHook(() => useCategories());

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      expect(result.current.error).toBeDefined();
      expect(result.current.categories).toEqual([]);
    });
  });

  describe('refetch', () => {
    it('should refetch categories', async () => {
      categoryService.getAll.mockResolvedValue([]);

      const { result } = renderHook(() => useCategories());

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      await act(async () => {
        await result.current.refetch();
      });

      expect(categoryService.getAll).toHaveBeenCalledTimes(2);
    });
  });

  describe('Loading state', () => {
    it('should manage loading state correctly', async () => {
      let resolvePromise;
      categoryService.getAll.mockImplementation(
        () =>
          new Promise((resolve) => {
            resolvePromise = resolve;
          })
      );

      const { result } = renderHook(() => useCategories());

      expect(result.current.loading).toBe(true);

      await act(async () => {
        resolvePromise([{ id: 1, name: 'Test' }]);
      });

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      expect(result.current.categories).toHaveLength(1);
    });
  });

  describe('Category helpers', () => {
    it('should provide findById helper', async () => {
      const mockCategories = [
        { id: 1, name: 'Điện thoại' },
        { id: 2, name: 'Laptop' },
      ];

      categoryService.getAll.mockResolvedValue(mockCategories);

      const { result } = renderHook(() => useCategories());

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      const found = result.current.categories.find((c) => c.id === 1);
      expect(found).toEqual({ id: 1, name: 'Điện thoại' });
    });
  });
});

// ─── useAdminCategories ─────────────────────────────────────────

describe('useAdminCategories', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('Initial fetch', () => {
    it('should auto-fetch categories on mount', async () => {
      categoryService.getAll.mockResolvedValue([{ id: 1, name: 'Tech' }]);

      const { result } = renderHook(() => useAdminCategories());

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      expect(result.current.categories).toEqual([{ id: 1, name: 'Tech' }]);
    });

    it('should not fetch when autoFetch is false', async () => {
      const { result } = renderHook(() => useAdminCategories({ autoFetch: false }));

      await new Promise((r) => setTimeout(r, 50));

      expect(categoryService.getAll).not.toHaveBeenCalled();
      expect(result.current.categories).toEqual([]);
    });
  });

  describe('createCategory', () => {
    it('should create and add to local state', async () => {
      categoryService.getAll.mockResolvedValue([]);
      categoryService.create.mockResolvedValue({ id: 10, name: 'New Cat' });

      const { result } = renderHook(() => useAdminCategories());

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      let created;
      await act(async () => {
        created = await result.current.createCategory({ name: 'New Cat' });
      });

      expect(created).toEqual({ id: 10, name: 'New Cat' });
      expect(categoryService.create).toHaveBeenCalledWith({ name: 'New Cat' });
      expect(result.current.categories).toContainEqual({ id: 10, name: 'New Cat' });
    });

    it('should return null and set error on failure', async () => {
      categoryService.getAll.mockResolvedValue([]);
      categoryService.create.mockRejectedValue(new Error('Create failed'));

      const { result } = renderHook(() => useAdminCategories());

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      let created;
      await act(async () => {
        created = await result.current.createCategory({ name: 'Bad' });
      });

      expect(created).toBeNull();
      expect(result.current.error).toBeDefined();
    });
  });

  describe('updateCategory', () => {
    it('should update and modify local state', async () => {
      categoryService.getAll.mockResolvedValue([{ id: 1, name: 'Old' }]);
      categoryService.update.mockResolvedValue({ id: 1, name: 'Updated' });

      const { result } = renderHook(() => useAdminCategories());

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      let updated;
      await act(async () => {
        updated = await result.current.updateCategory(1, { name: 'Updated' });
      });

      expect(updated).toEqual({ id: 1, name: 'Updated' });
      expect(result.current.categories[0].name).toBe('Updated');
    });

    it('should return null on failure', async () => {
      categoryService.getAll.mockResolvedValue([{ id: 1, name: 'Old' }]);
      categoryService.update.mockRejectedValue(new Error('Update failed'));

      const { result } = renderHook(() => useAdminCategories());

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      let updated;
      await act(async () => {
        updated = await result.current.updateCategory(1, { name: 'X' });
      });

      expect(updated).toBeNull();
      expect(result.current.error).toBeDefined();
    });
  });

  describe('deleteCategory', () => {
    it('should delete and remove from local state', async () => {
      categoryService.getAll.mockResolvedValue([
        { id: 1, name: 'A' },
        { id: 2, name: 'B' },
      ]);
      categoryService.delete.mockResolvedValue();

      const { result } = renderHook(() => useAdminCategories());

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      let success;
      await act(async () => {
        success = await result.current.deleteCategory(1);
      });

      expect(success).toBe(true);
      expect(result.current.categories).toEqual([{ id: 2, name: 'B' }]);
    });

    it('should return false on failure', async () => {
      categoryService.getAll.mockResolvedValue([{ id: 1, name: 'A' }]);
      categoryService.delete.mockRejectedValue(new Error('Cannot delete'));

      const { result } = renderHook(() => useAdminCategories());

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      let success;
      await act(async () => {
        success = await result.current.deleteCategory(1);
      });

      expect(success).toBe(false);
      expect(result.current.error).toBeDefined();
    });
  });

  describe('clearError', () => {
    it('should clear error state', async () => {
      categoryService.getAll.mockRejectedValue(new Error('fail'));

      const { result } = renderHook(() => useAdminCategories());

      await waitFor(() => {
        expect(result.current.error).toBeDefined();
      });

      act(() => {
        result.current.clearError();
      });

      expect(result.current.error).toBeNull();
    });
  });

  describe('saving state', () => {
    it('should set saving during create/update/delete', async () => {
      categoryService.getAll.mockResolvedValue([]);
      let resolveCreate;
      categoryService.create.mockImplementation(
        () =>
          new Promise((resolve) => {
            resolveCreate = resolve;
          })
      );

      const { result } = renderHook(() => useAdminCategories());

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      // Start create - saving should be true
      let createPromise;
      act(() => {
        createPromise = result.current.createCategory({ name: 'X' });
      });

      expect(result.current.saving).toBe(true);

      await act(async () => {
        resolveCreate({ id: 1, name: 'X' });
        await createPromise;
      });

      expect(result.current.saving).toBe(false);
    });
  });
});
