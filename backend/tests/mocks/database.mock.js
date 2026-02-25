/**
 * Database Mock
 * Mocks database connections for testing
 */

const mockConnection = {
  query: jest.fn(),
  execute: jest.fn(),
  beginTransaction: jest.fn(),
  commit: jest.fn(),
  rollback: jest.fn(),
  release: jest.fn(),
};

const mockPool = {
  query: jest.fn(),
  execute: jest.fn(),
  getConnection: jest.fn().mockResolvedValue(mockConnection),
};

const database = {
  query: jest.fn(),
  execute: jest.fn(),
  getConnection: jest.fn().mockResolvedValue(mockConnection),
  transaction: jest.fn(async (callback) => {
    try {
      await mockConnection.beginTransaction();
      const result = await callback(mockConnection);
      await mockConnection.commit();
      return result;
    } catch (error) {
      await mockConnection.rollback();
      throw error;
    }
  }),
  pool: mockPool,
};

module.exports = {
  database,
  mockConnection,
  mockPool,
  resetMocks: () => {
    mockConnection.query.mockReset();
    mockConnection.execute.mockReset();
    mockConnection.beginTransaction.mockReset();
    mockConnection.commit.mockReset();
    mockConnection.rollback.mockReset();
    mockConnection.release.mockReset();
    mockPool.query.mockReset();
    mockPool.execute.mockReset();
    database.query.mockReset();
    database.execute.mockReset();
  },
};
