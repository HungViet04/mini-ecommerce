/**
 * Database Configuration Tests
 * Tests for database connection and configuration
 */

// Mock mysql2/promise
const mockConnection = {
  release: jest.fn(),
};

const mockPool = {
  query: jest.fn(),
  getConnection: jest.fn().mockResolvedValue(mockConnection),
  end: jest.fn(),
};

jest.mock('mysql2/promise', () => ({
  createPool: jest.fn(() => mockPool),
}));

jest.mock('../../../src/config', () => ({
  db: {
    host: 'localhost',
    port: 3306,
    user: 'test_user',
    password: 'test_pass',
    database: 'test_db',
    connectionLimit: 10,
    waitForConnections: true,
    queueLimit: 0,
  },
  env: 'test',
}));

// Mock logger to prevent console output
jest.mock('../../../src/utils/logger', () => ({
  info: jest.fn(),
  error: jest.fn(),
  warn: jest.fn(),
  debug: jest.fn(),
}));

const mysql = require('mysql2/promise');
const config = require('../../../src/config');

describe('Database Configuration', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('Connection Pool', () => {
    it('should create connection pool with correct config when initialized', async () => {
      // Reset the module to get a fresh instance
      jest.resetModules();

      // Re-require after reset
      const freshMysql = require('mysql2/promise');
      const database = require('../../../src/config/database');

      await database.initialize();

      expect(freshMysql.createPool).toHaveBeenCalledWith(
        expect.objectContaining({
          host: 'localhost',
          user: 'test_user',
          password: 'test_pass',
          database: 'test_db',
        })
      );
    });

    it('should use database configuration', () => {
      expect(config.db).toEqual(
        expect.objectContaining({
          host: 'localhost',
          user: 'test_user',
          password: 'test_pass',
          database: 'test_db',
        })
      );
    });

    it('should have port configured', () => {
      expect(config.db.port).toBe(3306);
    });
  });
});

