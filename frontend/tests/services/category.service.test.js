/**
 * Category Service Tests
 * Comprehensive tests for category API service
 */
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { categoryService } from '../../src/services/category.service';
import httpClient from '../../src/services/http.client';

// Mock http client
vi.mock('../../src/services/http.client', () => ({
  default: {
    get: vi.fn(),
    post: vi.fn(),
    put: vi.fn(),
    delete: vi.fn(),
  },
}));

describe('CategoryService', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('getAll', () => {
    it('should get all categories', async () => {
      const mockCategories = {
        data: [
          { id: 1, name: 'Äiá»‡n thoáº¡i' },
          { id: 2, name: 'Laptop' },
          { id: 3, name: 'Phá»¥ kiá»‡n' },
        ],
      };
      httpClient.get.mockResolvedValueOnce(mockCategories);

      const result = await categoryService.getAll();

      expect(httpClient.get).toHaveBeenCalledWith('/categories', { skipAuth: true });
      expect(result).toHaveLength(3);
    });

    it('should skip auth for public endpoint', async () => {
      httpClient.get.mockResolvedValueOnce({ data: [] });

      await categoryService.getAll();

      expect(httpClient.get).toHaveBeenCalledWith(
        '/categories',
        expect.objectContaining({ skipAuth: true })
      );
    });

    it('should handle empty categories', async () => {
      httpClient.get.mockResolvedValueOnce({ data: [] });

      const result = await categoryService.getAll();

      expect(result).toEqual([]);
    });

    it('should handle response without data wrapper', async () => {
      httpClient.get.mockResolvedValueOnce([{ id: 1, name: 'Category' }]);

      const result = await categoryService.getAll();

      expect(result).toHaveLength(1);
    });
  });

  describe('getById', () => {
    it('should get category by ID', async () => {
      const mockCategory = { data: { id: 1, name: 'Điện thoại', description: 'Smartphone' } };
      httpClient.get.mockResolvedValueOnce(mockCategory);

      const result = await categoryService.getById(1);

      expect(httpClient.get).toHaveBeenCalledWith('/categories/1', { skipAuth: true });
      expect(result.name).toBe('Điện thoại');
    });

    it('should throw error when category not found', async () => {
      httpClient.get.mockRejectedValueOnce(new Error('Category not found'));

      await expect(categoryService.getById(999)).rejects.toThrow('Category not found');
    });

    it('should skip auth for category detail', async () => {
      httpClient.get.mockResolvedValueOnce({ data: {} });

      await categoryService.getById(5);

      expect(httpClient.get).toHaveBeenCalledWith('/categories/5', { skipAuth: true });
    });
  });

  describe('create (Admin)', () => {
    it('should create new category', async () => {
      const categoryData = { name: 'New Category', description: 'Description' };
      const mockResponse = { data: { id: 1, ...categoryData } };
      httpClient.post.mockResolvedValueOnce(mockResponse);

      const result = await categoryService.create(categoryData);

      expect(httpClient.post).toHaveBeenCalledWith('/categories', { name: 'New Category' });
      expect(result.name).toBe('New Category');
    });

    it('should require authentication', async () => {
      httpClient.post.mockResolvedValueOnce({ data: { id: 1 } });

      await categoryService.create({ name: 'Test' });

      // Should NOT have skipAuth
      expect(httpClient.post).toHaveBeenCalledWith('/categories', { name: 'Test' });
    });

    it('should throw error on duplicate name', async () => {
      httpClient.post.mockRejectedValueOnce(new Error('Category name already exists'));

      await expect(categoryService.create({ name: 'Existing' })).rejects.toThrow(
        'Category name already exists'
      );
    });
  });

  describe('update (Admin)', () => {
    it('should update category', async () => {
      const updateData = { name: 'Updated Name', description: 'Updated description' };
      const mockResponse = { data: { id: 1, ...updateData } };
      httpClient.put.mockResolvedValueOnce(mockResponse);

      const result = await categoryService.update(1, updateData);

      expect(httpClient.put).toHaveBeenCalledWith('/categories/1', updateData);
      expect(result.name).toBe('Updated Name');
    });

    it('should only update provided fields', async () => {
      httpClient.put.mockResolvedValueOnce({ data: { id: 1 } });

      await categoryService.update(1, { name: 'New Name' });

      expect(httpClient.put).toHaveBeenCalledWith('/categories/1', { name: 'New Name' });
    });

    it('should throw error on update failure', async () => {
      httpClient.put.mockRejectedValueOnce(new Error('Update failed'));

      await expect(categoryService.update(1, { name: 'Test' })).rejects.toThrow('Update failed');
    });
  });

  describe('delete (Admin)', () => {
    it('should delete category', async () => {
      httpClient.delete.mockResolvedValueOnce({});

      await categoryService.delete(1);

      expect(httpClient.delete).toHaveBeenCalledWith('/categories/1');
    });

    it('should throw error when category has products', async () => {
      httpClient.delete.mockRejectedValueOnce(new Error('Cannot delete category with products'));

      await expect(categoryService.delete(1)).rejects.toThrow(
        'Cannot delete category with products'
      );
    });

    it('should throw error when category not found', async () => {
      httpClient.delete.mockRejectedValueOnce(new Error('Category not found'));

      await expect(categoryService.delete(999)).rejects.toThrow('Category not found');
    });
  });

  describe('caching behavior', () => {
    it('should call API each time (no client-side caching)', async () => {
      httpClient.get.mockResolvedValue({ data: [] });

      await categoryService.getAll();
      await categoryService.getAll();
      await categoryService.getAll();

      expect(httpClient.get).toHaveBeenCalledTimes(3);
    });
  });

  describe('error handling', () => {
    it('should propagate network errors', async () => {
      httpClient.get.mockRejectedValueOnce(new Error('Network error'));

      await expect(categoryService.getAll()).rejects.toThrow('Network error');
    });

    it('should propagate server errors', async () => {
      httpClient.get.mockRejectedValueOnce(new Error('Internal server error'));

      await expect(categoryService.getAll()).rejects.toThrow('Internal server error');
    });
  });
});
