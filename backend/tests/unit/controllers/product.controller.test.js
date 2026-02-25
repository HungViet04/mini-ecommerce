/**
 * Product Controller Unit Tests
 * Tests for product HTTP request handling
 */

// Mock helpers FIRST before requiring controller
jest.mock('../../../src/helpers/async.helper', () => ({
  asyncHandler: (fn) => fn,
}));

jest.mock('../../../src/helpers/pagination.helper', () => ({
  parsePagination: jest.fn((query) => ({
    page: query.page || 1,
    limit: query.limit || 20,
  })),
}));

// Mock dependencies
jest.mock('../../../src/services', () => ({
  productService: {
    findAll: jest.fn(),
    findById: jest.fn(),
    create: jest.fn(),
    update: jest.fn(),
    delete: jest.fn(),
    search: jest.fn(),
    findByCategory: jest.fn(),
    checkAvailability: jest.fn(),
  },
}));

jest.mock('../../../src/helpers', () => ({
  response: {
    success: jest.fn((res, data) => res.status(200).json(data)),
    created: jest.fn((res, data, message) =>
      res.status(201).json({ success: true, data, message })
    ),
    noContent: jest.fn((res) => res.status(204).send()),
    paginated: jest.fn((res, data) => res.status(200).json({ success: true, ...data })),
  },
}));

const { productService } = require('../../../src/services');
const { response } = require('../../../src/helpers');
const productController = require('../../../src/controllers/product.controller');

describe('Product Controller', () => {
  let req, res, next;

  beforeEach(() => {
    jest.clearAllMocks();

    req = {
      body: {},
      params: {},
      query: {},
    };

    res = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn().mockReturnThis(),
      send: jest.fn().mockReturnThis(),
    };

    next = jest.fn();
  });

  describe('findAll', () => {
    it('should return all products with pagination', async () => {
      const products = {
        items: [
          { id: 1, name: 'Product 1' },
          { id: 2, name: 'Product 2' },
        ],
        total: 2,
      };

      req.query = { page: 1, limit: 20 };
      productService.findAll.mockResolvedValueOnce(products);

      await productController.findAll(req, res, next);

      expect(productService.findAll).toHaveBeenCalled();
      expect(response.paginated).toHaveBeenCalled();
    });

    it('should pass pagination and sorting params', async () => {
      req.query = { page: 3, limit: 50, orderBy: 'name', order: 'ASC' };
      productService.findAll.mockResolvedValueOnce({ items: [], total: 0 });

      await productController.findAll(req, res, next);

      expect(productService.findAll).toHaveBeenCalledWith(
        expect.objectContaining({ page: 3, limit: 50, orderBy: 'name', order: 'ASC' })
      );
    });

    it('should handle service error', async () => {
      productService.findAll.mockRejectedValueOnce(new Error('Database error'));

      await expect(productController.findAll(req, res, next)).rejects.toThrow('Database error');
    });
  });

  describe('findById', () => {
    it('should return product by ID', async () => {
      const product = { id: 1, name: 'Test Product', price: 100000 };

      req.params = { id: 1 };
      productService.findById.mockResolvedValueOnce(product);

      await productController.findById(req, res, next);

      expect(productService.findById).toHaveBeenCalledWith(1);
      expect(response.success).toHaveBeenCalled();
    });

    it('should handle product not found', async () => {
      req.params = { id: 999 };
      productService.findById.mockRejectedValueOnce(new Error('Product not found'));

      await expect(productController.findById(req, res, next)).rejects.toThrow('Product not found');
    });

    it('should use params id directly', async () => {
      req.params = { id: '42' };
      productService.findById.mockResolvedValueOnce({ id: 42 });

      await productController.findById(req, res, next);

      expect(productService.findById).toHaveBeenCalledWith('42');
    });
  });

  describe('create', () => {
    it('should create product successfully', async () => {
      const productData = {
        name: 'New Product',
        price: 100000,
        stock: 50,
        categoryId: 1,
      };
      const createdProduct = { id: 1, ...productData };

      req.body = productData;
      productService.create.mockResolvedValueOnce(createdProduct);

      await productController.create(req, res, next);

      expect(productService.create).toHaveBeenCalledWith(productData);
      expect(response.created).toHaveBeenCalled();
    });

    it('should handle validation error', async () => {
      req.body = { name: '' };
      productService.create.mockRejectedValueOnce(new Error('Validation failed'));

      await expect(productController.create(req, res, next)).rejects.toThrow('Validation failed');
    });

    it('should handle category not found', async () => {
      req.body = { name: 'Product', categoryId: 999 };
      productService.create.mockRejectedValueOnce(new Error('Category not found'));

      await expect(productController.create(req, res, next)).rejects.toThrow('Category not found');
    });
  });

  describe('update', () => {
    it('should update product successfully', async () => {
      const updateData = { name: 'Updated Product', price: 150000 };
      const updatedProduct = { id: 1, ...updateData };

      req.params = { id: 1 };
      req.body = updateData;
      productService.update.mockResolvedValueOnce(updatedProduct);

      await productController.update(req, res, next);

      expect(productService.update).toHaveBeenCalledWith(1, updateData);
      expect(response.success).toHaveBeenCalled();
    });

    it('should handle product not found on update', async () => {
      req.params = { id: 999 };
      req.body = { name: 'Updated' };
      productService.update.mockRejectedValueOnce(new Error('Product not found'));

      await expect(productController.update(req, res, next)).rejects.toThrow('Product not found');
    });

    it('should allow partial updates', async () => {
      req.params = { id: 1 };
      req.body = { price: 200000 };
      productService.update.mockResolvedValueOnce({ id: 1, price: 200000 });

      await productController.update(req, res, next);

      expect(productService.update).toHaveBeenCalledWith(1, { price: 200000 });
    });
  });

  describe('remove', () => {
    it('should delete product successfully', async () => {
      req.params = { id: 1 };
      productService.delete.mockResolvedValueOnce(true);

      await productController.remove(req, res, next);

      expect(productService.delete).toHaveBeenCalledWith(1);
      expect(response.success).toHaveBeenCalled();
    });

    it('should handle product not found on delete', async () => {
      req.params = { id: 999 };
      productService.delete.mockRejectedValueOnce(new Error('Product not found'));

      await expect(productController.remove(req, res, next)).rejects.toThrow('Product not found');
    });

    it('should handle product with orders', async () => {
      req.params = { id: 1 };
      productService.delete.mockRejectedValueOnce(new Error('Cannot delete product with orders'));

      await expect(productController.remove(req, res, next)).rejects.toThrow(
        'Cannot delete product with orders'
      );
    });
  });

  describe('search', () => {
    it('should search products by keyword', async () => {
      const results = [
        { id: 1, name: 'iPhone 15' },
        { id: 2, name: 'iPhone 14' },
      ];

      req.query = { q: 'iPhone', limit: '50', offset: '0' };
      productService.search.mockResolvedValueOnce(results);

      await productController.search(req, res, next);

      expect(productService.search).toHaveBeenCalledWith('iPhone', { limit: 50, offset: 0 });
      expect(response.success).toHaveBeenCalled();
    });

    it('should handle empty search results', async () => {
      req.query = { q: 'nonexistent' };
      productService.search.mockResolvedValueOnce([]);

      await productController.search(req, res, next);

      expect(response.success).toHaveBeenCalled();
    });
  });

  describe('findByCategory', () => {
    it('should return products by category', async () => {
      const products = [{ id: 1, name: 'Product 1', categoryId: 5 }];

      req.params = { categoryId: '5' };
      productService.findByCategory.mockResolvedValueOnce(products);

      await productController.findByCategory(req, res, next);

      expect(productService.findByCategory).toHaveBeenCalledWith(5);
      expect(response.success).toHaveBeenCalled();
    });

    it('should handle invalid category', async () => {
      req.params = { categoryId: '999' };
      productService.findByCategory.mockRejectedValueOnce(new Error('Category not found'));

      await expect(productController.findByCategory(req, res, next)).rejects.toThrow(
        'Category not found'
      );
    });
  });

  describe('checkAvailability', () => {
    it('should check product availability', async () => {
      req.params = { id: 1 };
      req.query = { quantity: '5' };
      productService.checkAvailability.mockResolvedValueOnce({ available: true, stock: 10 });

      await productController.checkAvailability(req, res, next);

      expect(productService.checkAvailability).toHaveBeenCalledWith(1, 5);
      expect(response.success).toHaveBeenCalled();
    });

    it('should default quantity to 1', async () => {
      req.params = { id: 1 };
      req.query = {};
      productService.checkAvailability.mockResolvedValueOnce({ available: true, stock: 10 });

      await productController.checkAvailability(req, res, next);

      expect(productService.checkAvailability).toHaveBeenCalledWith(1, 1);
    });
  });
});
