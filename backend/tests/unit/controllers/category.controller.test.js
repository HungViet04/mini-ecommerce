/**
 * Category Controller Unit Tests
 * Tests for category HTTP request handling
 */

// Mock helpers FIRST before requiring controller
jest.mock('../../../src/helpers/async.helper', () => ({
  asyncHandler: fn => fn,
}));

// Mock dependencies
jest.mock('../../../src/services', () => ({
  categoryService: {
    findAll: jest.fn(),
    findById: jest.fn(),
    findWithProductCount: jest.fn(),
    create: jest.fn(),
    update: jest.fn(),
    delete: jest.fn(),
  },
}));

jest.mock('../../../src/helpers', () => ({
  response: {
    success: jest.fn((res, data) => res.status(200).json(data)),
    created: jest.fn((res, data, message) =>
      res.status(201).json({ success: true, data, message })
    ),
  },
}));

const { categoryService } = require('../../../src/services');
const { response } = require('../../../src/helpers');
const categoryController = require('../../../src/controllers/category.controller');

describe('Category Controller', () => {
  let req, res, next;

  const mockCategories = [
    { id: 1, name: 'Electronics', description: 'Electronic devices' },
    { id: 2, name: 'Clothing', description: 'Fashion items' },
    { id: 3, name: 'Books', description: 'Books and literature' },
  ];

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
    it('should return all categories', async () => {
      req.query = {};
      categoryService.findAll.mockResolvedValueOnce(mockCategories);

      await categoryController.findAll(req, res, next);

      expect(categoryService.findAll).toHaveBeenCalled();
      expect(response.success).toHaveBeenCalled();
    });

    it('should return categories with product count when withCount=true', async () => {
      req.query = { withCount: 'true' };
      categoryService.findWithProductCount.mockResolvedValueOnce(mockCategories);

      await categoryController.findAll(req, res, next);

      expect(categoryService.findWithProductCount).toHaveBeenCalled();
      expect(response.success).toHaveBeenCalled();
    });

    it('should return empty array when no categories', async () => {
      categoryService.findAll.mockResolvedValueOnce([]);

      await categoryController.findAll(req, res, next);

      expect(response.success).toHaveBeenCalledWith(res, { data: [] });
    });

    it('should handle service error', async () => {
      categoryService.findAll.mockRejectedValueOnce(new Error('Database error'));

      await expect(categoryController.findAll(req, res, next)).rejects.toThrow('Database error');
    });
  });

  describe('findById', () => {
    it('should return category by ID', async () => {
      req.params = { id: '1' };
      categoryService.findById.mockResolvedValueOnce(mockCategories[0]);

      await categoryController.findById(req, res, next);

      expect(categoryService.findById).toHaveBeenCalledWith(1);
      expect(response.success).toHaveBeenCalled();
    });

    it('should convert string ID to number', async () => {
      req.params = { id: '42' };
      categoryService.findById.mockResolvedValueOnce({ id: 42, name: 'Test' });

      await categoryController.findById(req, res, next);

      expect(categoryService.findById).toHaveBeenCalledWith(42);
    });

    it('should handle category not found', async () => {
      req.params = { id: '999' };
      categoryService.findById.mockRejectedValueOnce(new Error('Category not found'));

      await expect(categoryController.findById(req, res, next)).rejects.toThrow(
        'Category not found'
      );
    });

    it('should handle invalid ID format', async () => {
      req.params = { id: 'invalid' };
      categoryService.findById.mockRejectedValueOnce(new Error('Invalid ID'));

      await expect(categoryController.findById(req, res, next)).rejects.toThrow('Invalid ID');
    });
  });

  describe('create', () => {
    const newCategory = { name: 'Sports', description: 'Sports equipment' };

    it('should create new category', async () => {
      const createdCategory = { id: 4, ...newCategory };
      req.body = newCategory;
      categoryService.create.mockResolvedValueOnce(createdCategory);

      await categoryController.create(req, res, next);

      expect(categoryService.create).toHaveBeenCalledWith(newCategory);
      expect(response.created).toHaveBeenCalledWith(
        res,
        createdCategory,
        'Tạo danh mục thành công'
      );
    });

    it('should handle missing required fields', async () => {
      req.body = {};
      categoryService.create.mockRejectedValueOnce(new Error('Name is required'));

      await expect(categoryController.create(req, res, next)).rejects.toThrow('Name is required');
    });

    it('should handle duplicate category name', async () => {
      req.body = { name: 'Electronics' };
      const error = new Error('Category already exists');
      error.code = 'ER_DUP_ENTRY';
      categoryService.create.mockRejectedValueOnce(error);

      await expect(categoryController.create(req, res, next)).rejects.toThrow(
        'Category already exists'
      );
    });
  });

  describe('update', () => {
    it('should update existing category', async () => {
      req.params = { id: '1' };
      req.body = { name: 'Updated Electronics', description: 'Updated desc' };
      const updatedCategory = { id: 1, ...req.body };
      categoryService.update.mockResolvedValueOnce(updatedCategory);

      await categoryController.update(req, res, next);

      expect(categoryService.update).toHaveBeenCalledWith(1, req.body);
      expect(response.success).toHaveBeenCalled();
    });

    it('should convert string ID to number when updating', async () => {
      req.params = { id: '5' };
      req.body = { name: 'Test' };
      categoryService.update.mockResolvedValueOnce({ id: 5, name: 'Test' });

      await categoryController.update(req, res, next);

      expect(categoryService.update).toHaveBeenCalledWith(5, req.body);
    });

    it('should handle update of non-existent category', async () => {
      req.params = { id: '999' };
      req.body = { name: 'Updated' };
      categoryService.update.mockRejectedValueOnce(new Error('Category not found'));

      await expect(categoryController.update(req, res, next)).rejects.toThrow('Category not found');
    });

    it('should handle partial update', async () => {
      req.params = { id: '1' };
      req.body = { description: 'Only description updated' };
      const updatedCategory = { id: 1, name: 'Electronics', ...req.body };
      categoryService.update.mockResolvedValueOnce(updatedCategory);

      await categoryController.update(req, res, next);

      expect(categoryService.update).toHaveBeenCalledWith(1, req.body);
    });
  });

  describe('remove', () => {
    it('should delete category', async () => {
      req.params = { id: '1' };
      categoryService.delete.mockResolvedValueOnce(true);

      await categoryController.remove(req, res, next);

      expect(categoryService.delete).toHaveBeenCalledWith(1);
      expect(response.success).toHaveBeenCalled();
    });

    it('should convert string ID to number when deleting', async () => {
      req.params = { id: '7' };
      categoryService.delete.mockResolvedValueOnce(true);

      await categoryController.remove(req, res, next);

      expect(categoryService.delete).toHaveBeenCalledWith(7);
    });

    it('should handle deleting non-existent category', async () => {
      req.params = { id: '999' };
      categoryService.delete.mockRejectedValueOnce(new Error('Category not found'));

      await expect(categoryController.remove(req, res, next)).rejects.toThrow('Category not found');
    });

    it('should handle category with products', async () => {
      req.params = { id: '1' };
      categoryService.delete.mockRejectedValueOnce(
        new Error('Cannot delete category with products')
      );

      await expect(categoryController.remove(req, res, next)).rejects.toThrow(
        'Cannot delete category with products'
      );
    });
  });
});

