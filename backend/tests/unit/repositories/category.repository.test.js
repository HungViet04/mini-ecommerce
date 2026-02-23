/**
 * Category Repository Tests
 * Tests for category database operations
 */

// Mock database - must be before require
const mockPool = {
  query: jest.fn(),
};

jest.mock('../../../src/config/database', () => ({
  query: jest.fn(),
  getPool: jest.fn(() => mockPool),
}));

// Note: category.repository.js exports a singleton instance, not a class
const categoryRepository = require('../../../src/repositories/category.repository');
const database = require('../../../src/config/database');

describe('Category Repository', () => {
  const mockCategories = [
    { id: 1, name: 'Electronics', description: 'Electronic devices', created_at: new Date() },
    { id: 2, name: 'Clothing', description: 'Fashion items', created_at: new Date() },
    { id: 3, name: 'Books', description: 'Books and literature', created_at: new Date() },
  ];

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('findAll', () => {
    it('should return all categories', async () => {
      database.query.mockResolvedValueOnce([mockCategories]);

      const result = await categoryRepository.findAll();

      expect(database.query).toHaveBeenCalledWith(
        expect.stringContaining('SELECT'),
        expect.any(Array)
      );
      expect(result).toEqual(mockCategories);
    });

    it('should return empty array when no categories', async () => {
      database.query.mockResolvedValueOnce([[]]);

      const result = await categoryRepository.findAll();

      expect(result).toEqual([]);
    });

    it('should handle database error', async () => {
      database.query.mockRejectedValueOnce(new Error('Database error'));

      await expect(categoryRepository.findAll()).rejects.toThrow('Database error');
    });
  });

  describe('findById', () => {
    it('should return category by ID', async () => {
      database.query.mockResolvedValueOnce([[mockCategories[0]]]);

      const result = await categoryRepository.findById(1);

      expect(database.query).toHaveBeenCalledWith(expect.stringContaining('WHERE'), [1]);
      expect(result).toEqual(mockCategories[0]);
    });

    it('should return null when category not found', async () => {
      database.query.mockResolvedValueOnce([[]]);

      const result = await categoryRepository.findById(999);

      expect(result).toBeNull();
    });
  });

  describe('findByName', () => {
    it('should return category by name', async () => {
      database.query.mockResolvedValueOnce([[mockCategories[0]]]);

      const result = await categoryRepository.findByName('Electronics');

      expect(database.query).toHaveBeenCalledWith(expect.stringContaining('name'), ['Electronics']);
      expect(result).toEqual(mockCategories[0]);
    });

    it('should return null when name not found', async () => {
      database.query.mockResolvedValueOnce([[]]);

      const result = await categoryRepository.findByName('NonExistent');

      expect(result).toBeNull();
    });
  });

  describe('create', () => {
    const newCategory = { name: 'Sports', description: 'Sports equipment' };

    it('should create new category', async () => {
      database.query.mockResolvedValueOnce([{ insertId: 4 }]);

      const result = await categoryRepository.create(newCategory);

      expect(database.query).toHaveBeenCalledWith(
        expect.stringContaining('INSERT'),
        expect.any(Array)
      );
      expect(result).toEqual({ id: 4, ...newCategory });
    });

    it('should handle duplicate name error', async () => {
      const error = new Error('Duplicate entry');
      error.code = 'ER_DUP_ENTRY';
      database.query.mockRejectedValueOnce(error);

      await expect(categoryRepository.create({ name: 'Electronics' })).rejects.toThrow(
        'Duplicate entry'
      );
    });
  });

  describe('update', () => {
    const updateData = { name: 'Updated Electronics', description: 'Updated desc' };

    it('should update category', async () => {
      const updatedCategory = { id: 1, ...updateData };
      // First call is UPDATE, second is findById
      database.query
        .mockResolvedValueOnce([{ affectedRows: 1 }])
        .mockResolvedValueOnce([[updatedCategory]]);

      const result = await categoryRepository.update(1, updateData);

      expect(database.query).toHaveBeenCalledWith(
        expect.stringContaining('UPDATE'),
        expect.any(Array)
      );
      expect(result).toEqual(updatedCategory);
    });

    it('should return null when category not found', async () => {
      // First call is UPDATE, second is findById returning empty
      database.query.mockResolvedValueOnce([{ affectedRows: 0 }]).mockResolvedValueOnce([[]]);

      const result = await categoryRepository.update(999, updateData);

      expect(result).toBeNull();
    });
  });

  describe('delete', () => {
    it('should delete category', async () => {
      database.query.mockResolvedValueOnce([{ affectedRows: 1 }]);

      const result = await categoryRepository.delete(1);

      expect(database.query).toHaveBeenCalledWith(expect.stringContaining('DELETE'), [1]);
      expect(result).toBe(true);
    });

    it('should return false when category not found', async () => {
      database.query.mockResolvedValueOnce([{ affectedRows: 0 }]);

      const result = await categoryRepository.delete(999);

      expect(result).toBe(false);
    });
  });

  describe('findWithProductCount', () => {
    it('should return categories with product count', async () => {
      const categoriesWithCount = [
        { id: 1, name: 'Electronics', product_count: 15 },
        { id: 2, name: 'Clothing', product_count: 8 },
      ];
      database.query.mockResolvedValueOnce([categoriesWithCount]);

      const result = await categoryRepository.findWithProductCount();

      expect(database.query).toHaveBeenCalledWith(
        expect.stringContaining('COUNT'),
        expect.any(Array)
      );
      expect(result).toEqual(categoriesWithCount);
    });

    it('should return empty array when no categories', async () => {
      database.query.mockResolvedValueOnce([[]]);

      const result = await categoryRepository.findWithProductCount();

      expect(result).toEqual([]);
    });
  });
});



