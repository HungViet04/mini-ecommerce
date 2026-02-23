/**
 * Product Service Tests
 * Tests for product service
 */

// Mock dependencies
jest.mock('../../../src/repositories', () => ({
  productRepository: {
    findById: jest.fn(),
    findByIdOrFail: jest.fn(),
    findAll: jest.fn(),
    findWithPagination: jest.fn(),
    findByCategory: jest.fn(),
    findInStock: jest.fn(),
    findByIdsForUpdate: jest.fn(),
    create: jest.fn(),
    update: jest.fn(),
    delete: jest.fn(),
    searchByName: jest.fn(),
  },
  categoryRepository: {
    findById: jest.fn(),
    findByIdOrFail: jest.fn(),
  },
}));

const { productService } = require('../../../src/services');
const { productRepository, categoryRepository } = require('../../../src/repositories');
const { NotFoundError, ValidationError } = require('../../../src/errors');

describe('ProductService', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('create', () => {
    const validProductData = {
      name: 'Sản phẩm test',
      description: 'Mô tả sản phẩm',
      price: 100000,
      stock: 50,
      category_id: 1,
    };

    it('should create a new product successfully', async () => {
      const createdProduct = {
        id: 1,
        ...validProductData,
        created_at: new Date(),
      };

      categoryRepository.findById.mockResolvedValue({ id: 1, name: 'Category' });
      productRepository.create.mockResolvedValue(createdProduct);

      const result = await productService.create(validProductData);

      expect(result).toEqual(createdProduct);
      expect(productRepository.create).toHaveBeenCalledWith(
        expect.objectContaining({
          name: validProductData.name,
          price: validProductData.price,
        })
      );
    });

    it('should create product without category', async () => {
      const dataWithoutCategory = {
        name: 'Test Product',
        price: 100000,
      };

      const createdProduct = {
        id: 1,
        ...dataWithoutCategory,
        stock: 0,
        category_id: null,
        created_at: new Date(),
      };

      productRepository.create.mockResolvedValue(createdProduct);

      const result = await productService.create(dataWithoutCategory);

      expect(result).toEqual(createdProduct);
      expect(categoryRepository.findById).not.toHaveBeenCalled();
    });

    it('should throw NotFoundError if category does not exist', async () => {
      categoryRepository.findById.mockResolvedValue(null);

      await expect(productService.create(validProductData)).rejects.toThrow(NotFoundError);
    });

    it('should throw ValidationError for invalid data', async () => {
      const invalidData = {
        name: '',
        price: -100,
      };

      await expect(productService.create(invalidData)).rejects.toThrow(ValidationError);
    });

    it('should throw ValidationError for missing required fields', async () => {
      const incompleteData = {
        name: 'Test Product',
        // missing price
      };

      await expect(productService.create(incompleteData)).rejects.toThrow(ValidationError);
    });
  });

  describe('findAll', () => {
    it('should return paginated products', async () => {
      const mockResult = {
        items: [
          { id: 1, name: 'Product 1', price: 100000 },
          { id: 2, name: 'Product 2', price: 200000 },
        ],
        total: 10,
        pagination: {
          page: 1,
          limit: 20,
          totalPages: 1,
        },
      };

      productRepository.findWithPagination.mockResolvedValue(mockResult);

      const result = await productService.findAll({ page: 1, limit: 20 });

      expect(result).toEqual(mockResult);
      expect(productRepository.findWithPagination).toHaveBeenCalledWith({
        page: 1,
        limit: 20,
        orderBy: 'id',
        order: 'DESC',
      });
    });

    it('should use default pagination options', async () => {
      const mockResult = { items: [], total: 0, pagination: {} };
      productRepository.findWithPagination.mockResolvedValue(mockResult);

      await productService.findAll();

      expect(productRepository.findWithPagination).toHaveBeenCalledWith({
        page: 1,
        limit: 20,
        orderBy: 'id',
        order: 'DESC',
      });
    });
  });

  describe('findById', () => {
    it('should return product by id', async () => {
      const product = {
        id: 1,
        name: 'Test Product',
        price: 100000,
      };

      productRepository.findByIdOrFail.mockResolvedValue(product);

      const result = await productService.findById(1);

      expect(result).toEqual(product);
      expect(productRepository.findByIdOrFail).toHaveBeenCalledWith(1, 'Product');
    });

    it('should throw ValidationError for invalid id', async () => {
      await expect(productService.findById('invalid')).rejects.toThrow(ValidationError);
    });

    it('should throw NotFoundError if product not found', async () => {
      productRepository.findByIdOrFail.mockRejectedValue(new NotFoundError('Product'));

      await expect(productService.findById(999)).rejects.toThrow(NotFoundError);
    });
  });

  describe('search', () => {
    it('should return products matching search query', async () => {
      const products = [
        { id: 1, name: 'Test Product 1' },
        { id: 2, name: 'Test Product 2' },
      ];

      productRepository.searchByName.mockResolvedValue(products);

      const result = await productService.search('Test');

      expect(result).toEqual(products);
      expect(productRepository.searchByName).toHaveBeenCalledWith('Test', {});
    });

    it('should return empty array for empty query', async () => {
      const result = await productService.search('');

      expect(result).toEqual([]);
      expect(productRepository.searchByName).not.toHaveBeenCalled();
    });

    it('should return empty array for whitespace query', async () => {
      const result = await productService.search('   ');

      expect(result).toEqual([]);
    });
  });

  describe('update', () => {
    const updateData = {
      name: 'Updated Product',
      price: 150000,
    };

    it('should update product successfully', async () => {
      const existingProduct = { id: 1, name: 'Old Name', price: 100000 };
      const updatedProduct = { id: 1, ...updateData };

      productRepository.findByIdOrFail.mockResolvedValue(existingProduct);
      productRepository.update.mockResolvedValue(updatedProduct);

      const result = await productService.update(1, updateData);

      expect(result).toEqual(updatedProduct);
      expect(productRepository.update).toHaveBeenCalledWith(1, updateData);
    });

    it('should throw NotFoundError if product not found', async () => {
      productRepository.findByIdOrFail.mockRejectedValue(new NotFoundError('Product'));

      await expect(productService.update(999, updateData)).rejects.toThrow(NotFoundError);
    });

    it('should throw NotFoundError if category does not exist', async () => {
      const existingProduct = { id: 1, name: 'Product', price: 100000 };

      productRepository.findByIdOrFail.mockResolvedValue(existingProduct);
      categoryRepository.findById.mockResolvedValue(null);

      await expect(productService.update(1, { category_id: 999 })).rejects.toThrow(NotFoundError);
    });

    it('should throw ValidationError for invalid data', async () => {
      await expect(productService.update(1, { name: '' })).rejects.toThrow(ValidationError);
    });
  });

  describe('delete', () => {
    it('should delete product successfully', async () => {
      const product = { id: 1, name: 'Product' };

      productRepository.findByIdOrFail.mockResolvedValue(product);
      productRepository.delete.mockResolvedValue(true);

      const result = await productService.delete(1);

      expect(result).toBe(true);
      expect(productRepository.delete).toHaveBeenCalledWith(1);
    });

    it('should throw NotFoundError if product not found', async () => {
      productRepository.findByIdOrFail.mockRejectedValue(new NotFoundError('Product'));

      await expect(productService.delete(999)).rejects.toThrow(NotFoundError);
    });
  });

  describe('findByCategory', () => {
    it('should return products by category', async () => {
      const products = [
        { id: 1, name: 'Product 1', category_id: 1 },
        { id: 2, name: 'Product 2', category_id: 1 },
      ];

      categoryRepository.findById.mockResolvedValue({ id: 1, name: 'Category' });
      productRepository.findByCategory.mockResolvedValue(products);

      const result = await productService.findByCategory(1);

      expect(result).toEqual(products);
    });

    it('should throw NotFoundError if category not found', async () => {
      categoryRepository.findById.mockResolvedValue(null);

      await expect(productService.findByCategory(999)).rejects.toThrow(NotFoundError);
    });
  });

  describe('findInStock', () => {
    it('should return products in stock', async () => {
      const products = [
        { id: 1, name: 'Product 1', stock: 10 },
        { id: 2, name: 'Product 2', stock: 5 },
      ];

      productRepository.findInStock.mockResolvedValue(products);

      const result = await productService.findInStock();

      expect(result).toEqual(products);
    });
  });

  describe('checkAvailability', () => {
    it('should return available true if stock is sufficient', async () => {
      const product = { id: 1, name: 'Product', stock: 10 };
      productRepository.findByIdOrFail.mockResolvedValue(product);

      const result = await productService.checkAvailability(1, 5);

      expect(result).toEqual({
        available: true,
        stock: 10,
        product,
      });
    });

    it('should return available false if stock is insufficient', async () => {
      const product = { id: 1, name: 'Product', stock: 3 };
      productRepository.findByIdOrFail.mockResolvedValue(product);

      const result = await productService.checkAvailability(1, 5);

      expect(result).toEqual({
        available: false,
        stock: 3,
        product,
      });
    });

    it('should throw NotFoundError if product not found', async () => {
      productRepository.findByIdOrFail.mockRejectedValue(new NotFoundError('Product'));

      await expect(productService.checkAvailability(999, 1)).rejects.toThrow(NotFoundError);
    });
  });
});

