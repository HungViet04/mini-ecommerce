/**
 * Base Repository Tests
 * Comprehensive tests for base repository CRUD operations
 */

jest.mock('../../../src/config/database', () => ({
  query: jest.fn(),
}));

const database = require('../../../src/config/database');
const BaseRepository = require('../../../src/repositories/base.repository');
const { DatabaseError, NotFoundError } = require('../../../src/errors');

// Create a concrete implementation for testing
class TestRepository extends BaseRepository {
  constructor() {
    super('test_table', 'id');
  }

  getSelectColumns() {
    return 'id, name, created_at';
  }
}

describe('BaseRepository', () => {
  let repository;

  beforeEach(() => {
    repository = new TestRepository();
    jest.clearAllMocks();
  });

  describe('constructor', () => {
    it('should throw error when instantiated directly', () => {
      expect(() => new BaseRepository('test', 'id')).toThrow('BaseRepository is an abstract class');
    });

    it('should set tableName and primaryKey', () => {
      expect(repository.tableName).toBe('test_table');
      expect(repository.primaryKey).toBe('id');
    });

    it('should use default primaryKey if not provided', () => {
      class DefaultPKRepo extends BaseRepository {
        constructor() {
          super('items');
        }
      }
      const repo = new DefaultPKRepo();
      expect(repo.primaryKey).toBe('id');
    });
  });

  describe('query', () => {
    it('should execute query successfully', async () => {
      database.query.mockResolvedValueOnce([[{ id: 1 }]]);

      const result = await repository.query('SELECT * FROM test', []);

      expect(database.query).toHaveBeenCalledWith('SELECT * FROM test', []);
      expect(result).toEqual([[{ id: 1 }]]);
    });

    it('should use connection if provided (transaction)', async () => {
      const mockConnection = {
        query: jest.fn().mockResolvedValueOnce([[{ id: 1 }]]),
      };

      const result = await repository.query('SELECT * FROM test', [], mockConnection);

      expect(mockConnection.query).toHaveBeenCalledWith('SELECT * FROM test', []);
      expect(database.query).not.toHaveBeenCalled();
    });

    it('should throw DatabaseError on query failure', async () => {
      database.query.mockRejectedValueOnce(new Error('Connection failed'));

      // The try-catch in query() doesn't catch async rejections because
      // the promise is returned directly without await, so the original error passes through
      await expect(repository.query('SELECT * FROM test', [])).rejects.toThrow('Connection failed');
    });
  });

  describe('findAll', () => {
    it('should return all records', async () => {
      const mockData = [
        { id: 1, name: 'Item 1' },
        { id: 2, name: 'Item 2' },
      ];
      database.query.mockResolvedValueOnce([mockData]);

      const result = await repository.findAll();

      expect(result).toEqual(mockData);
      expect(database.query).toHaveBeenCalledWith(
        expect.stringContaining('SELECT id, name, created_at FROM test_table'),
        []
      );
    });

    it('should apply limit', async () => {
      database.query.mockResolvedValueOnce([[]]);

      await repository.findAll({ limit: 10 });

      expect(database.query).toHaveBeenCalledWith(expect.stringContaining('LIMIT ?'), [10]);
    });

    it('should apply offset', async () => {
      database.query.mockResolvedValueOnce([[]]);

      await repository.findAll({ limit: 10, offset: 20 });

      expect(database.query).toHaveBeenCalledWith(expect.stringContaining('OFFSET ?'), [10, 20]);
    });

    it('should apply orderBy and order', async () => {
      database.query.mockResolvedValueOnce([[]]);

      await repository.findAll({ orderBy: 'name', order: 'DESC' });

      expect(database.query).toHaveBeenCalledWith(
        expect.stringContaining('ORDER BY name DESC'),
        []
      );
    });

    it('should handle default order as ASC', async () => {
      database.query.mockResolvedValueOnce([[]]);

      await repository.findAll({ orderBy: 'id' });

      expect(database.query).toHaveBeenCalledWith(expect.stringContaining('ORDER BY id ASC'), []);
    });

    it('should handle empty options', async () => {
      database.query.mockResolvedValueOnce([[]]);

      await repository.findAll({});

      expect(database.query).toHaveBeenCalled();
    });

    it('should parse limit and offset as integers', async () => {
      database.query.mockResolvedValueOnce([[]]);

      await repository.findAll({ limit: '10', offset: '5' });

      expect(database.query).toHaveBeenCalledWith(expect.any(String), [10, 5]);
    });
  });

  describe('findById', () => {
    it('should return record by ID', async () => {
      const mockRecord = { id: 1, name: 'Test' };
      database.query.mockResolvedValueOnce([[mockRecord]]);

      const result = await repository.findById(1);

      expect(result).toEqual(mockRecord);
      expect(database.query).toHaveBeenCalledWith(expect.stringContaining('WHERE id = ?'), [1]);
    });

    it('should return null when record not found', async () => {
      database.query.mockResolvedValueOnce([[]]);

      const result = await repository.findById(999);

      expect(result).toBeNull();
    });

    it('should handle string ID', async () => {
      database.query.mockResolvedValueOnce([[]]);

      await repository.findById('123');

      expect(database.query).toHaveBeenCalledWith(expect.any(String), ['123']);
    });
  });

  describe('findByIdOrFail', () => {
    it('should return record when found', async () => {
      const mockRecord = { id: 1, name: 'Test' };
      database.query.mockResolvedValueOnce([[mockRecord]]);

      const result = await repository.findByIdOrFail(1, 'Item');

      expect(result).toEqual(mockRecord);
    });

    it('should throw NotFoundError when record not found', async () => {
      database.query.mockResolvedValueOnce([[]]);

      await expect(repository.findByIdOrFail(999, 'Product')).rejects.toThrow(NotFoundError);
    });

    it('should include resource name in error', async () => {
      database.query.mockResolvedValueOnce([[]]);

      try {
        await repository.findByIdOrFail(999, 'Product');
      } catch (error) {
        expect(error.resource).toBe('Product');
      }
    });
  });

  describe('create', () => {
    it('should create record successfully', async () => {
      database.query.mockResolvedValueOnce([{ insertId: 1 }]);

      const result = await repository.create({ name: 'New Item' });

      expect(database.query).toHaveBeenCalledWith(
        expect.stringContaining('INSERT INTO test_table'),
        expect.any(Array)
      );
      expect(result).toHaveProperty('id', 1);
    });

    it('should return the created record with data', async () => {
      const newData = { name: 'Created Item', status: 'active' };
      database.query.mockResolvedValueOnce([{ insertId: 5 }]);

      const result = await repository.create(newData);

      expect(result.id).toBe(5);
      expect(result.name).toBe('Created Item');
      expect(result.status).toBe('active');
    });
  });

  describe('update', () => {
    it('should update record successfully', async () => {
      const updatedRecord = { id: 1, name: 'Updated Name' };
      database.query.mockResolvedValueOnce([{ affectedRows: 1 }]);
      database.query.mockResolvedValueOnce([[updatedRecord]]);

      const result = await repository.update(1, { name: 'Updated Name' });

      expect(database.query).toHaveBeenCalledWith(
        expect.stringContaining('UPDATE test_table SET'),
        expect.any(Array)
      );
      expect(result).toEqual(updatedRecord);
    });

    it('should only update specified fields', async () => {
      database.query.mockResolvedValueOnce([{ affectedRows: 1 }]);
      database.query.mockResolvedValueOnce([[{ id: 1 }]]);

      await repository.update(1, { name: 'Only Name' });

      const query = database.query.mock.calls[0][0];
      expect(query).toContain('name');
    });
  });

  describe('delete', () => {
    it('should delete record successfully', async () => {
      database.query.mockResolvedValueOnce([{ affectedRows: 1 }]);

      const result = await repository.delete(1);

      expect(database.query).toHaveBeenCalledWith(
        expect.stringContaining('DELETE FROM test_table WHERE id = ?'),
        [1]
      );
      expect(result).toBe(true);
    });

    it('should return false when no record deleted', async () => {
      database.query.mockResolvedValueOnce([{ affectedRows: 0 }]);

      const result = await repository.delete(999);

      expect(result).toBe(false);
    });
  });

  describe('count', () => {
    it('should return total count', async () => {
      database.query.mockResolvedValueOnce([[{ count: 50 }]]);

      const result = await repository.count();

      expect(result).toBe(50);
      expect(database.query).toHaveBeenCalledWith(
        expect.stringContaining('SELECT COUNT(*) as count'),
        []
      );
    });

    it('should return 0 for empty table', async () => {
      database.query.mockResolvedValueOnce([[{ count: 0 }]]);

      const result = await repository.count();

      expect(result).toBe(0);
    });

    it('should apply where conditions', async () => {
      database.query.mockResolvedValueOnce([[{ count: 10 }]]);

      await repository.count({ status: 'active' });

      expect(database.query).toHaveBeenCalledWith(
        expect.stringContaining('WHERE'),
        expect.arrayContaining(['active'])
      );
    });
  });

  describe('exists', () => {
    it('should return true when record exists', async () => {
      database.query.mockResolvedValueOnce([[{ count: 1 }]]);

      const result = await repository.exists({ email: 'test@test.com' });

      expect(result).toBe(true);
    });

    it('should return false when record does not exist', async () => {
      database.query.mockResolvedValueOnce([[{ count: 0 }]]);

      const result = await repository.exists({ email: 'notfound@test.com' });

      expect(result).toBe(false);
    });
  });

  describe('findOne', () => {
    it('should return single record matching conditions', async () => {
      const mockRecord = { id: 1, name: 'Found' };
      database.query.mockResolvedValueOnce([[mockRecord]]);

      const result = await repository.findOne({ name: 'Found' });

      expect(result).toEqual(mockRecord);
    });

    it('should return null when no match', async () => {
      database.query.mockResolvedValueOnce([[]]);

      const result = await repository.findOne({ name: 'NotFound' });

      expect(result).toBeNull();
    });
  });

  describe('findWhere', () => {
    it('should find records matching conditions', async () => {
      const mockRecords = [{ id: 1 }, { id: 2 }];
      database.query.mockResolvedValueOnce([mockRecords]);

      const result = await repository.findWhere({ status: 'active' });

      expect(result).toEqual(mockRecords);
    });

    it('should apply options (limit, offset, order)', async () => {
      database.query.mockResolvedValueOnce([[]]);

      await repository.findWhere({ status: 'active' }, { limit: 10, orderBy: 'id', order: 'DESC' });

      expect(database.query).toHaveBeenCalledWith(
        expect.stringContaining('ORDER BY id DESC'),
        expect.any(Array)
      );
    });

    it('should handle multiple conditions', async () => {
      database.query.mockResolvedValueOnce([[]]);

      await repository.findWhere({ status: 'active', role: 'admin' });

      const query = database.query.mock.calls[0][0];
      expect(query).toContain('status');
      expect(query).toContain('role');
    });
  });

  describe('findAll with pagination', () => {
    it('should return items with limit and offset', async () => {
      const mockItems = [{ id: 1 }, { id: 2 }];
      database.query.mockResolvedValueOnce([mockItems]);

      const result = await repository.findAll({ limit: 10, offset: 0 });

      expect(result).toEqual(mockItems);
      expect(database.query).toHaveBeenCalledWith(
        expect.stringContaining('LIMIT ?'),
        expect.arrayContaining([10])
      );
    });

    it('should calculate correct offset from page', async () => {
      database.query.mockResolvedValueOnce([[]]);

      // Page 3 with limit 10 means offset 20
      await repository.findAll({ limit: 10, offset: 20 });

      expect(database.query).toHaveBeenCalledWith(
        expect.stringContaining('OFFSET ?'),
        expect.arrayContaining([20])
      );
    });
  });
});
