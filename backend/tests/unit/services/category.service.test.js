/**
 * Category Service Tests
 * Tests for category service
 */

// Mock dependencies
jest.mock('../../../src/repositories', () => ({
  categoryRepository: {
    findById: jest.fn(),
    findByIdOrFail: jest.fn(),
    findAll: jest.fn(),
    findByName: jest.fn(),
    findWithProductCount: jest.fn(),
    create: jest.fn(),
    update: jest.fn(),
    delete: jest.fn(),
  },
}));

const { categoryService } = require('../../../src/services');
const { categoryRepository } = require('../../../src/repositories');
const { NotFoundError, ConflictError, ValidationError } = require('../../../src/errors');

describe('CategoryService', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('create', () => {
    it('should create a new category successfully', async () => {
      const categoryData = { name: 'Điện thoại' };
      const createdCategory = { id: 1, name: 'Điện thoại' };

      categoryRepository.findByName.mockResolvedValue(null);
      categoryRepository.create.mockResolvedValue(createdCategory);

      const result = await categoryService.create(categoryData);

      expect(result).toEqual(createdCategory);
      expect(categoryRepository.findByName).toHaveBeenCalledWith('Điện thoại');
      expect(categoryRepository.create).toHaveBeenCalledWith({ name: 'Điện thoại' });
    });

    it('should throw ConflictError if category name already exists', async () => {
      const categoryData = { name: 'Điện thoại' };
      const existingCategory = { id: 1, name: 'Điện thoại' };

      categoryRepository.findByName.mockResolvedValue(existingCategory);

      await expect(categoryService.create(categoryData)).rejects.toThrow(ConflictError);

      expect(categoryRepository.create).not.toHaveBeenCalled();
    });

    it('should throw ValidationError when name is empty', async () => {
      await expect(categoryService.create({ name: '' })).rejects.toThrow(ValidationError);
    });

    it('should throw ValidationError when name is missing', async () => {
      await expect(categoryService.create({})).rejects.toThrow(ValidationError);
    });

    it('should throw ValidationError when name exceeds 100 characters', async () => {
      const longName = 'A'.repeat(101);

      await expect(categoryService.create({ name: longName })).rejects.toThrow(ValidationError);
    });

    it('should trim whitespace from name', async () => {
      const categoryData = { name: '  Điện thoại  ' };
      const createdCategory = { id: 1, name: 'Điện thoại' };

      categoryRepository.findByName.mockResolvedValue(null);
      categoryRepository.create.mockResolvedValue(createdCategory);

      await categoryService.create(categoryData);

      expect(categoryRepository.findByName).toHaveBeenCalledWith('Điện thoại');
    });
  });

  describe('findAll', () => {
    it('should return all categories', async () => {
      const categories = [
        { id: 1, name: 'Điện thoại' },
        { id: 2, name: 'Laptop' },
      ];

      categoryRepository.findAll.mockResolvedValue(categories);

      const result = await categoryService.findAll();

      expect(result).toEqual(categories);
      expect(categoryRepository.findAll).toHaveBeenCalled();
    });

    it('should return empty array if no categories', async () => {
      categoryRepository.findAll.mockResolvedValue([]);

      const result = await categoryService.findAll();

      expect(result).toEqual([]);
    });
  });

  describe('findWithProductCount', () => {
    it('should return categories with product count', async () => {
      const categories = [
        { id: 1, name: 'Điện thoại', productCount: 10 },
        { id: 2, name: 'Laptop', productCount: 5 },
      ];

      categoryRepository.findWithProductCount.mockResolvedValue(categories);

      const result = await categoryService.findWithProductCount();

      expect(result).toEqual(categories);
      expect(categoryRepository.findWithProductCount).toHaveBeenCalled();
    });
  });

  describe('findById', () => {
    it('should return category by id', async () => {
      const category = { id: 1, name: 'Điện thoại' };

      categoryRepository.findByIdOrFail.mockResolvedValue(category);

      const result = await categoryService.findById(1);

      expect(result).toEqual(category);
      expect(categoryRepository.findByIdOrFail).toHaveBeenCalledWith(1, 'Category');
    });

    it('should throw NotFoundError if category not found', async () => {
      categoryRepository.findByIdOrFail.mockRejectedValue(new NotFoundError('Category'));

      await expect(categoryService.findById(999)).rejects.toThrow(NotFoundError);
    });
  });

  describe('update', () => {
    it('should update category successfully', async () => {
      const existingCategory = { id: 1, name: 'Old Name' };
      const updatedCategory = { id: 1, name: 'New Name' };

      categoryRepository.findByIdOrFail.mockResolvedValue(existingCategory);
      categoryRepository.update.mockResolvedValue(updatedCategory);

      const result = await categoryService.update(1, { name: 'New Name' });

      expect(result).toEqual(updatedCategory);
      expect(categoryRepository.update).toHaveBeenCalledWith(1, { name: 'New Name' });
    });

    it('should throw NotFoundError if category not found', async () => {
      categoryRepository.findByIdOrFail.mockRejectedValue(new NotFoundError('Category'));

      await expect(categoryService.update(999, { name: 'New Name' })).rejects.toThrow(
        NotFoundError
      );
    });

    it('should throw ValidationError when name is empty', async () => {
      const existingCategory = { id: 1, name: 'Old Name' };
      categoryRepository.findByIdOrFail.mockResolvedValue(existingCategory);

      await expect(categoryService.update(1, { name: '' })).rejects.toThrow(ValidationError);
    });

    it('should throw ValidationError when name exceeds 100 characters', async () => {
      const existingCategory = { id: 1, name: 'Old Name' };
      categoryRepository.findByIdOrFail.mockResolvedValue(existingCategory);

      await expect(categoryService.update(1, { name: 'A'.repeat(101) })).rejects.toThrow(
        ValidationError
      );
    });

    it('should throw ValidationError when no valid fields provided', async () => {
      const existingCategory = { id: 1, name: 'Old Name' };
      categoryRepository.findByIdOrFail.mockResolvedValue(existingCategory);

      await expect(categoryService.update(1, {})).rejects.toThrow(ValidationError);
    });
  });

  describe('delete', () => {
    it('should delete category successfully', async () => {
      const category = { id: 1, name: 'Category' };

      categoryRepository.findByIdOrFail.mockResolvedValue(category);
      categoryRepository.delete.mockResolvedValue(true);

      const result = await categoryService.delete(1);

      expect(result).toBe(true);
      expect(categoryRepository.delete).toHaveBeenCalledWith(1);
    });

    it('should throw NotFoundError if category not found', async () => {
      categoryRepository.findByIdOrFail.mockRejectedValue(new NotFoundError('Category'));

      await expect(categoryService.delete(999)).rejects.toThrow(NotFoundError);
    });
  });
});
