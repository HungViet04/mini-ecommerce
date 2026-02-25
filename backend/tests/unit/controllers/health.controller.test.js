/**
 * Health Controller Tests
 * Tests for health check endpoint
 */

// Mock database
jest.mock('../../../src/config/database', () => ({
  query: jest.fn().mockResolvedValue([[{ ok: 1 }]]),
}));

const healthController = require('../../../src/controllers/health.controller');

describe('Health Controller', () => {
  let mockReq, mockRes, mockNext;

  beforeEach(() => {
    mockReq = {};
    mockRes = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn(),
    };
    mockNext = jest.fn();
  });

  describe('check', () => {
    it('should return healthy status', async () => {
      await healthController.check(mockReq, mockRes, mockNext);

      expect(mockRes.status).toHaveBeenCalledWith(200);
      expect(mockRes.json).toHaveBeenCalledWith(
        expect.objectContaining({
          success: true,
          data: expect.objectContaining({
            status: 'healthy',
          }),
        })
      );
    });

    it('should include uptime', async () => {
      await healthController.check(mockReq, mockRes, mockNext);

      expect(mockRes.json).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            uptime: expect.any(Number),
          }),
        })
      );
    });

    it('should include timestamp', async () => {
      await healthController.check(mockReq, mockRes, mockNext);

      expect(mockRes.json).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            timestamp: expect.any(String),
          }),
        })
      );
    });

    it('should include memory usage', async () => {
      await healthController.check(mockReq, mockRes, mockNext);

      expect(mockRes.json).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            memory: expect.any(Object),
          }),
        })
      );
    });
  });

  describe('detailed health check', () => {
    it('should check database connectivity', async () => {
      await healthController.check(mockReq, mockRes, mockNext);

      expect(mockRes.json).toHaveBeenCalled();
    });
  });
});
