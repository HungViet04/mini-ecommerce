/**
 * Product Service Tests
 * Comprehensive tests for product API service
 */
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { productService } from '../../src/services/product.service';
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

describe('ProductService', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('getAll', () => {
    it('should get all products', async () => {
      const mockProducts = {
        data: {
          items: [{ id: 1, name: 'Product 1' }],
          total: 1,
        },
      };
      httpClient.get.mockResolvedValueOnce(mockProducts);

      const result = await productService.getAll();

      expect(httpClient.get).toHaveBeenCalledWith('/products', { skipAuth: true });
      expect(result.items).toHaveLength(1);
    });

    it('should pass pagination params', async () => {
      httpClient.get.mockResolvedValueOnce({ data: { items: [], total: 0 } });

      await productService.getAll({ page: 2, limit: 10 });

      expect(httpClient.get).toHaveBeenCalledWith('/products?page=2&limit=10', { skipAuth: true });
    });

    it('should handle only page param', async () => {
      httpClient.get.mockResolvedValueOnce({ data: { items: [] } });

      await productService.getAll({ page: 3 });

      expect(httpClient.get).toHaveBeenCalledWith('/products?page=3', { skipAuth: true });
    });

    it('should handle only limit param', async () => {
      httpClient.get.mockResolvedValueOnce({ data: { items: [] } });

      await productService.getAll({ limit: 50 });

      expect(httpClient.get).toHaveBeenCalledWith('/products?limit=50', { skipAuth: true });
    });

    it('should skip auth for public endpoint', async () => {
      httpClient.get.mockResolvedValueOnce({ data: {} });

      await productService.getAll();

      expect(httpClient.get).toHaveBeenCalledWith(
        expect.any(String),
        expect.objectContaining({ skipAuth: true })
      );
    });

    it('should handle response without data wrapper', async () => {
      const mockResponse = { items: [{ id: 1 }], total: 1 };
      httpClient.get.mockResolvedValueOnce(mockResponse);

      const result = await productService.getAll();

      expect(result.items).toHaveLength(1);
    });
  });

  describe('getById', () => {
    it('should get product by ID', async () => {
      const mockProduct = { data: { id: 1, name: 'Product 1', price: 100000 } };
      httpClient.get.mockResolvedValueOnce(mockProduct);

      const result = await productService.getById(1);

      expect(httpClient.get).toHaveBeenCalledWith('/products/1', { skipAuth: true });
      expect(result.name).toBe('Product 1');
    });

    it('should skip auth for product detail', async () => {
      httpClient.get.mockResolvedValueOnce({ data: {} });

      await productService.getById(5);

      expect(httpClient.get).toHaveBeenCalledWith('/products/5', { skipAuth: true });
    });

    it('should throw error when product not found', async () => {
      httpClient.get.mockRejectedValueOnce(new Error('Product not found'));

      await expect(productService.getById(999)).rejects.toThrow('Product not found');
    });
  });

  describe('search', () => {
    it('should search products by query', async () => {
      const mockResults = { data: [{ id: 1, name: 'iPhone 15' }] };
      httpClient.get.mockResolvedValueOnce(mockResults);

      const result = await productService.search('iPhone');

      expect(httpClient.get).toHaveBeenCalledWith('/products/search?q=iPhone', { skipAuth: true });
      expect(result).toHaveLength(1);
    });

    it('should encode search query', async () => {
      httpClient.get.mockResolvedValueOnce({ data: [] });

      await productService.search('iPhone 15 Pro');

      expect(httpClient.get).toHaveBeenCalledWith('/products/search?q=iPhone%2015%20Pro', {
        skipAuth: true,
      });
    });

    it('should handle special characters in search', async () => {
      httpClient.get.mockResolvedValueOnce({ data: [] });

      await productService.search('A & B');

      expect(httpClient.get).toHaveBeenCalledWith('/products/search?q=A%20%26%20B', {
        skipAuth: true,
      });
    });

    it('should skip auth for search', async () => {
      httpClient.get.mockResolvedValueOnce({ data: [] });

      await productService.search('test');

      expect(httpClient.get).toHaveBeenCalledWith(
        expect.any(String),
        expect.objectContaining({ skipAuth: true })
      );
    });
  });

  describe('getByCategory', () => {
    it('should get products by category ID', async () => {
      const mockProducts = { data: [{ id: 1, category_id: 5 }] };
      httpClient.get.mockResolvedValueOnce(mockProducts);

      const result = await productService.getByCategory(5);

      expect(httpClient.get).toHaveBeenCalledWith('/products/category/5', { skipAuth: true });
      expect(result).toHaveLength(1);
    });

    it('should skip auth for category products', async () => {
      httpClient.get.mockResolvedValueOnce({ data: [] });

      await productService.getByCategory(1);

      expect(httpClient.get).toHaveBeenCalledWith(
        expect.any(String),
        expect.objectContaining({ skipAuth: true })
      );
    });
  });

  describe('create', () => {
    it('should create new product', async () => {
      const productData = {
        name: 'New Product',
        price: 500000,
        stock: 100,
        category_id: 1,
        description: 'Description',
        image_url: '/images/product.jpg',
      };
      const mockResponse = { data: { id: 1, ...productData } };
      httpClient.post.mockResolvedValueOnce(mockResponse);

      const result = await productService.create(productData);

      expect(httpClient.post).toHaveBeenCalledWith('/products', {
        name: 'New Product',
        price: 500000,
        stock: 100,
        category_id: 1,
        description: 'Description',
        image_url: '/images/product.jpg',
      });
      expect(result.id).toBe(1);
    });

    it('should convert price and stock to numbers', async () => {
      httpClient.post.mockResolvedValueOnce({ data: { id: 1 } });

      await productService.create({
        name: 'Product',
        price: '100000',
        stock: '50',
      });

      expect(httpClient.post).toHaveBeenCalledWith(
        '/products',
        expect.objectContaining({
          price: 100000,
          stock: 50,
        })
      );
    });

    it('should handle missing optional fields', async () => {
      httpClient.post.mockResolvedValueOnce({ data: { id: 1 } });

      await productService.create({
        name: 'Product',
        price: 100000,
        stock: 10,
      });

      expect(httpClient.post).toHaveBeenCalledWith(
        '/products',
        expect.objectContaining({
          category_id: null,
          description: '',
          image_url: '',
        })
      );
    });

    it('should require authentication', async () => {
      httpClient.post.mockResolvedValueOnce({ data: { id: 1 } });

      await productService.create({ name: 'Test', price: 100, stock: 1 });

      // Should NOT have skipAuth
      expect(httpClient.post).toHaveBeenCalledWith('/products', expect.any(Object));
    });
  });

  describe('update', () => {
    it('should update product', async () => {
      const updateData = { name: 'Updated Name', price: 200000 };
      httpClient.put.mockResolvedValueOnce({ data: { id: 1, ...updateData } });

      const result = await productService.update(1, updateData);

      expect(httpClient.put).toHaveBeenCalledWith('/products/1', updateData);
      expect(result.name).toBe('Updated Name');
    });

    it('should only send provided fields', async () => {
      httpClient.put.mockResolvedValueOnce({ data: { id: 1 } });

      await productService.update(1, { name: 'New Name' });

      expect(httpClient.put).toHaveBeenCalledWith('/products/1', { name: 'New Name' });
    });
  });

  describe('delete', () => {
    it('should delete product', async () => {
      httpClient.delete.mockResolvedValueOnce({});

      await productService.delete(1);

      expect(httpClient.delete).toHaveBeenCalledWith('/products/1');
    });

    it('should throw error on delete failure', async () => {
      httpClient.delete.mockRejectedValueOnce(new Error('Cannot delete'));

      await expect(productService.delete(1)).rejects.toThrow('Cannot delete');
    });
  });

  describe('checkAvailability', () => {
    it('should check product availability', async () => {
      const mockResponse = { data: { available: true, stock: 10 } };
      httpClient.get.mockResolvedValueOnce(mockResponse);

      const result = await productService.checkAvailability(1);

      expect(result.available).toBe(true);
      expect(result.stock).toBe(10);
    });
  });
});

