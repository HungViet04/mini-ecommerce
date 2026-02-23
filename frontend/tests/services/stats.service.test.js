/**
 * Stats Service Tests
 * Tests for real statsService (src/services/stats.service.js)
 */
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { statsService } from '../../src/services/stats.service';
import httpClient from '../../src/services/http.client';

vi.mock('../../src/services/http.client', () => ({
  default: {
    get: vi.fn(),
    post: vi.fn(),
    put: vi.fn(),
    patch: vi.fn(),
    delete: vi.fn(),
    addRequestInterceptor: vi.fn(),
    addResponseInterceptor: vi.fn(),
  },
}));

describe('StatsService', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('getDashboard', () => {
    it('should call GET /stats/dashboard', async () => {
      const mockStats = {
        data: {
          totalProducts: 50,
          totalOrders: 120,
          totalRevenue: 25000000,
          totalUsers: 30,
        },
      };
      httpClient.get.mockResolvedValueOnce(mockStats);

      const result = await statsService.getDashboard();

      expect(httpClient.get).toHaveBeenCalledWith('/stats/dashboard');
      expect(result.totalProducts).toBe(50);
      expect(result.totalOrders).toBe(120);
    });

    it('should return data property when response wraps data', async () => {
      httpClient.get.mockResolvedValueOnce({
        data: { totalProducts: 10 },
      });

      const result = await statsService.getDashboard();
      expect(result).toEqual({ totalProducts: 10 });
    });

    it('should return response directly when no data wrapper', async () => {
      httpClient.get.mockResolvedValueOnce({ totalProducts: 10 });

      const result = await statsService.getDashboard();
      expect(result).toEqual({ totalProducts: 10 });
    });

    it('should propagate errors', async () => {
      httpClient.get.mockRejectedValueOnce(new Error('Unauthorized'));

      await expect(statsService.getDashboard()).rejects.toThrow('Unauthorized');
    });
  });
});

