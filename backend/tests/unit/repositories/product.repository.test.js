/**
 * Product Repository Tests
 * Comprehensive tests for product database operations
 */

jest.mock('../../../src/config/database', () => ({
  query: jest.fn(),
}));

const database = require('../../../src/config/database');
const productRepository = require('../../../src/repositories/product.repository');

describe('ProductRepository', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('getSelectColumns', () => {
    it('should return correct columns', () => {
      const columns = productRepository.getSelectColumns();
      expect(columns).toContain('id');
      expect(columns).toContain('name');
      expect(columns).toContain('description');
      expect(columns).toContain('image_url');
      expect(columns).toContain('price');
      expect(columns).toContain('stock');
      expect(columns).toContain('category_id');
      expect(columns).toContain('created_at');
    });
  });

  describe('searchByName', () => {
    it('should search products by name with LIKE', async () => {
      const mockProducts = [
        { id: 1, name: 'iPhone 15' },
        { id: 2, name: 'iPhone 14' },
      ];
      database.query.mockResolvedValueOnce([mockProducts]);

      const result = await productRepository.searchByName('iPhone');

      expect(result).toEqual(mockProducts);
      expect(database.query).toHaveBeenCalledWith(expect.stringContaining('WHERE name LIKE ?'), [
        '%iPhone%',
        50,
        0,
      ]);
    });

    it('should apply limit and offset', async () => {
      database.query.mockResolvedValueOnce([[]]);

      await productRepository.searchByName('test', { limit: 10, offset: 20 });

      expect(database.query).toHaveBeenCalledWith(expect.any(String), ['%test%', 10, 20]);
    });

    it('should use default limit and offset', async () => {
      database.query.mockResolvedValueOnce([[]]);

      await productRepository.searchByName('query');

      expect(database.query).toHaveBeenCalledWith(expect.any(String), ['%query%', 50, 0]);
    });

    it('should order by name ASC', async () => {
      database.query.mockResolvedValueOnce([[]]);

      await productRepository.searchByName('test');

      expect(database.query).toHaveBeenCalledWith(
        expect.stringContaining('ORDER BY name ASC'),
        expect.any(Array)
      );
    });

    it('should handle special characters in search', async () => {
      database.query.mockResolvedValueOnce([[]]);

      await productRepository.searchByName("test's product");

      expect(database.query).toHaveBeenCalledWith(expect.any(String), ["%test's product%", 50, 0]);
    });

    it('should return empty array for no matches', async () => {
      database.query.mockResolvedValueOnce([[]]);

      const result = await productRepository.searchByName('nonexistent');

      expect(result).toEqual([]);
    });
  });

  describe('findByCategory', () => {
    it('should find products by category ID', async () => {
      const mockProducts = [{ id: 1, name: 'Product 1', category_id: 5 }];
      database.query.mockResolvedValueOnce([mockProducts]);

      const result = await productRepository.findByCategory(5);

      expect(result).toEqual(mockProducts);
      expect(database.query).toHaveBeenCalledWith(
        expect.stringContaining('category_id'),
        expect.arrayContaining([5])
      );
    });

    it('should pass options to findWhere', async () => {
      database.query.mockResolvedValueOnce([[]]);

      await productRepository.findByCategory(1, { limit: 10, orderBy: 'name' });

      expect(database.query).toHaveBeenCalled();
    });
  });

  describe('findInStock', () => {
    it('should find products with stock > 0', async () => {
      const mockProducts = [{ id: 1, name: 'In Stock Product', stock: 10 }];
      database.query.mockResolvedValueOnce([mockProducts]);

      const result = await productRepository.findInStock();

      expect(result).toEqual(mockProducts);
      expect(database.query).toHaveBeenCalledWith(
        expect.stringContaining('WHERE stock > 0'),
        expect.any(Array)
      );
    });

    it('should apply ordering', async () => {
      database.query.mockResolvedValueOnce([[]]);

      await productRepository.findInStock({ orderBy: 'price', order: 'DESC' });

      expect(database.query).toHaveBeenCalledWith(
        expect.stringContaining('ORDER BY price DESC'),
        expect.any(Array)
      );
    });

    it('should use default ordering by name ASC', async () => {
      database.query.mockResolvedValueOnce([[]]);

      await productRepository.findInStock();

      expect(database.query).toHaveBeenCalledWith(
        expect.stringContaining('ORDER BY name ASC'),
        expect.any(Array)
      );
    });

    it('should apply limit and offset', async () => {
      database.query.mockResolvedValueOnce([[]]);

      await productRepository.findInStock({ limit: 20, offset: 10 });

      expect(database.query).toHaveBeenCalledWith(expect.any(String), [20, 10]);
    });
  });

  describe('getStock', () => {
    it('should return stock quantity', async () => {
      database.query.mockResolvedValueOnce([[{ id: 1, stock: 50 }]]);

      const result = await productRepository.getStock(1);

      expect(result).toBe(50);
    });

    it('should return 0 for non-existent product', async () => {
      database.query.mockResolvedValueOnce([[]]);

      const result = await productRepository.getStock(999);

      expect(result).toBe(0);
    });

    it('should return 0 for out of stock product', async () => {
      database.query.mockResolvedValueOnce([[{ id: 1, stock: 0 }]]);

      const result = await productRepository.getStock(1);

      expect(result).toBe(0);
    });
  });

  describe('decrementStock', () => {
    it('should decrement stock by quantity', async () => {
      const mockConnection = { query: jest.fn().mockResolvedValueOnce([{ affectedRows: 1 }]) };

      await productRepository.decrementStock(mockConnection, 1, 5);

      expect(mockConnection.query).toHaveBeenCalledWith(
        expect.stringContaining('SET stock = stock - ?'),
        [5, 1, 5]
      );
    });

    it('should only decrement if stock is sufficient', async () => {
      const mockConnection = { query: jest.fn().mockResolvedValueOnce([{ affectedRows: 1 }]) };

      await productRepository.decrementStock(mockConnection, 1, 10);

      expect(mockConnection.query).toHaveBeenCalledWith(
        expect.stringContaining('WHERE id = ? AND stock >= ?'),
        [10, 1, 10]
      );
    });

    it('should use transaction connection', async () => {
      const mockConnection = { query: jest.fn().mockResolvedValueOnce([{ affectedRows: 1 }]) };

      await productRepository.decrementStock(mockConnection, 1, 5);

      expect(mockConnection.query).toHaveBeenCalled();
      expect(database.query).not.toHaveBeenCalled();
    });
  });

  describe('incrementStock', () => {
    it('should increment stock by quantity', async () => {
      const mockConnection = { query: jest.fn().mockResolvedValueOnce([{ affectedRows: 1 }]) };

      await productRepository.incrementStock(mockConnection, 1, 10);

      expect(mockConnection.query).toHaveBeenCalledWith(
        expect.stringContaining('SET stock = stock + ?'),
        [10, 1]
      );
    });

    it('should use transaction connection', async () => {
      const mockConnection = { query: jest.fn().mockResolvedValueOnce([{ affectedRows: 1 }]) };

      await productRepository.incrementStock(mockConnection, 1, 5);

      expect(mockConnection.query).toHaveBeenCalled();
      expect(database.query).not.toHaveBeenCalled();
    });
  });

  describe('findWithPagination', () => {
    it('should return paginated products with total', async () => {
      const mockProducts = [{ id: 1 }, { id: 2 }];
      database.query
        .mockResolvedValueOnce([mockProducts])
        .mockResolvedValueOnce([[{ count: 100 }]]);

      const result = await productRepository.findWithPagination({ page: 1, limit: 10 });

      expect(result.items).toEqual(mockProducts);
      expect(result.total).toBe(100);
    });

    it('should calculate offset correctly', async () => {
      database.query.mockResolvedValueOnce([[]]).mockResolvedValueOnce([[{ count: 0 }]]);

      await productRepository.findWithPagination({ page: 3, limit: 20 });

      expect(database.query).toHaveBeenCalledWith(
        expect.stringContaining('OFFSET ?'),
        expect.arrayContaining([40]) // (3-1) * 20
      );
    });

    it('should use default values', async () => {
      database.query.mockResolvedValueOnce([[]]).mockResolvedValueOnce([[{ count: 0 }]]);

      await productRepository.findWithPagination({});

      expect(database.query).toHaveBeenCalledWith(
        expect.stringContaining('ORDER BY id DESC'),
        expect.any(Array)
      );
    });

    it('should apply custom ordering', async () => {
      database.query.mockResolvedValueOnce([[]]).mockResolvedValueOnce([[{ count: 0 }]]);

      await productRepository.findWithPagination({ orderBy: 'price', order: 'ASC' });

      expect(database.query).toHaveBeenCalledWith(
        expect.stringContaining('ORDER BY price ASC'),
        expect.any(Array)
      );
    });
  });

  describe('findByIdsForUpdate', () => {
    it('should lock products for update', async () => {
      const mockProducts = [
        { id: 1, name: 'Product 1', stock: 10 },
        { id: 2, name: 'Product 2', stock: 20 },
      ];
      const mockConnection = { query: jest.fn().mockResolvedValueOnce([mockProducts]) };

      const result = await productRepository.findByIdsForUpdate(mockConnection, [1, 2]);

      expect(result).toEqual(mockProducts);
      expect(mockConnection.query).toHaveBeenCalledWith(
        expect.stringContaining('FOR UPDATE'),
        expect.any(Array)
      );
    });

    it('should handle single product ID', async () => {
      const mockConnection = { query: jest.fn().mockResolvedValueOnce([[{ id: 1 }]]) };

      await productRepository.findByIdsForUpdate(mockConnection, [1]);

      expect(mockConnection.query).toHaveBeenCalled();
    });

    it('should return empty array for empty IDs', async () => {
      const mockConnection = { query: jest.fn().mockResolvedValueOnce([[]]) };

      const result = await productRepository.findByIdsForUpdate(mockConnection, []);

      expect(result).toEqual([]);
    });
  });
});

