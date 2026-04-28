/**
 * Stats Controller Tests
 * Unit tests for statistics controller
 */

// Mock helpers first
jest.mock('../../../src/helpers', () => ({
  asyncHandler: (fn) => fn,
}));

// Mock stats service
jest.mock('../../../src/services/stats.service', () => ({
  getDashboardStats: jest.fn(),
}));

const statsController = require('../../../src/controllers/stats.controller');
const statsService = require('../../../src/services/stats.service');

describe('Stats Controller', () => {
  let mockReq, mockRes, mockNext;

  beforeEach(() => {
    mockReq = {
      query: {},
    };
    mockRes = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn(),
    };
    mockNext = jest.fn();
    jest.clearAllMocks();
  });

  describe('getDashboardStats', () => {
    const mockDashboardStats = {
      totalOrders: 150,
      totalRevenue: 15000000,
      totalProducts: 50,
      totalUsers: 100,
      recentOrders: [
        { id: 1, total: 500000 },
        { id: 2, total: 750000 },
      ],
    };

    it('should return dashboard statistics', async () => {
      statsService.getDashboardStats.mockResolvedValue(mockDashboardStats);

      await statsController.getDashboardStats(mockReq, mockRes, mockNext);

      expect(statsService.getDashboardStats).toHaveBeenCalled();
      expect(mockRes.json).toHaveBeenCalledWith({
        success: true,
        data: mockDashboardStats,
      });
    });

    it('should handle service error', async () => {
      const error = new Error('Database error');
      statsService.getDashboardStats.mockRejectedValue(error);

      await expect(statsController.getDashboardStats(mockReq, mockRes, mockNext)).rejects.toThrow(
        'Database error'
      );
    });
  });
});
