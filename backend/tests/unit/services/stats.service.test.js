/**
 * Stats Service Tests
 * Comprehensive tests for dashboard statistics service
 */

jest.mock('../../../src/config/database', () => ({
  query: jest.fn(),
}));

const { statsService } = require('../../../src/services');
const database = require('../../../src/config/database');

describe('StatsService', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('getDashboardStats', () => {
    it('should return all dashboard statistics', async () => {
      // Mock all stats queries
      database.query
        .mockResolvedValueOnce([
          [{ total: 100, pending: 20, paid: 30, shipped: 40, delivered: 10 }],
        ]) // orderStats
        .mockResolvedValueOnce([
          [
            {
              totalRevenue: 50000000,
              confirmedRevenue: 40000000,
              pendingRevenue: 10000000,
            },
          ],
        ]) // revenueStats
        .mockResolvedValueOnce([[{ total: 50, lowStock: 5 }]]) // productStats
        .mockResolvedValueOnce([[{ total: 200, customers: 195, newCustomers: 3 }]]) // userStats
        .mockResolvedValueOnce([
          [
            {
              id: 1,
              total: 500000,
              status: 'pending',
              payment_method: 'cod',
              created_at: new Date(),
              userName: 'John',
              userEmail: 'john@test.com',
            },
          ],
        ]) // recentOrders
        .mockResolvedValueOnce([
          [
            {
              id: 1,
              name: 'Product 1',
              price: 100000,
              stock: 10,
              image_url: null,
              totalSold: '50',
              totalRevenue: '5000000',
            },
          ],
        ]) // topProducts
        .mockResolvedValueOnce([[{ month: '2024-01', revenue: '10000000', orderCount: '20' }]]); // monthlyRevenue

      const result = await statsService.getDashboardStats();

      expect(result).toHaveProperty('orders');
      expect(result).toHaveProperty('revenue');
      expect(result).toHaveProperty('products');
      expect(result).toHaveProperty('users');
      expect(result).toHaveProperty('recentOrders');
      expect(result).toHaveProperty('topProducts');
      expect(result).toHaveProperty('monthlyRevenue');
    });

    it('should aggregate all stats correctly', async () => {
      database.query
        .mockResolvedValueOnce([[{ total: 10, pending: 5, paid: 3, shipped: 2, delivered: 0 }]])
        .mockResolvedValueOnce([
          [
            {
              totalRevenue: 1000000,
              confirmedRevenue: 500000,
              pendingRevenue: 500000,
            },
          ],
        ])
        .mockResolvedValueOnce([[{ total: 10, lowStock: 1 }]])
        .mockResolvedValueOnce([[{ total: 5, customers: 4, newCustomers: 0 }]])
        .mockResolvedValueOnce([[]])
        .mockResolvedValueOnce([[]])
        .mockResolvedValueOnce([[]]);

      const result = await statsService.getDashboardStats();

      expect(result.orders.total).toBe(10);
      expect(result.revenue.totalRevenue).toBe(1000000);
      expect(result.products.total).toBe(10);
      expect(result.users.total).toBe(5);
    });
  });

  describe('getOrderStats', () => {
    it('should return order counts by status', async () => {
      database.query.mockResolvedValueOnce([
        [
          {
            total: 100,
            pending: 20,
            paid: 30,
            shipped: 40,
            delivered: 10,
          },
        ],
      ]);

      const result = await statsService.getOrderStats();

      expect(result.total).toBe(100);
      expect(result.pending).toBe(20);
      expect(result.paid).toBe(30);
      expect(result.shipped).toBe(40);
      expect(result.delivered).toBe(10);
    });

    it('should handle empty orders', async () => {
      database.query.mockResolvedValueOnce([[null]]);

      const result = await statsService.getOrderStats();

      expect(result).toEqual({ total: 0, pending: 0, paid: 0, shipped: 0, delivered: 0 });
    });

    it('should handle database returning undefined', async () => {
      database.query.mockResolvedValueOnce([[]]);

      const result = await statsService.getOrderStats();

      expect(result).toEqual({ total: 0, pending: 0, paid: 0, shipped: 0, delivered: 0 });
    });
  });

  describe('getRevenueStats', () => {
    it('should return revenue breakdown', async () => {
      database.query.mockResolvedValueOnce([
        [
          {
            totalRevenue: 50000000,
            confirmedRevenue: 40000000,
            pendingRevenue: 10000000,
          },
        ],
      ]);

      const result = await statsService.getRevenueStats();

      expect(result.totalRevenue).toBe(50000000);
      expect(result.confirmedRevenue).toBe(40000000);
      expect(result.pendingRevenue).toBe(10000000);
    });

    it('should handle no revenue', async () => {
      database.query.mockResolvedValueOnce([[null]]);

      const result = await statsService.getRevenueStats();

      expect(result.totalRevenue).toBe(0);
      expect(result.confirmedRevenue).toBe(0);
    });

    it('should return zero values for empty database', async () => {
      database.query.mockResolvedValueOnce([[]]);

      const result = await statsService.getRevenueStats();

      expect(result).toEqual({
        totalRevenue: 0,
        confirmedRevenue: 0,
        pendingRevenue: 0,
      });
    });
  });

  describe('getProductStats', () => {
    it('should return product inventory statistics', async () => {
      database.query.mockResolvedValueOnce([
        [
          {
            total: 100,
            lowStock: 10,
          },
        ],
      ]);

      const result = await statsService.getProductStats();

      expect(result.total).toBe(100);
      expect(result.lowStock).toBe(10);
    });

    it('should identify low stock products (stock <= 5)', async () => {
      database.query.mockResolvedValueOnce([
        [
          {
            total: 50,
            lowStock: 5,
          },
        ],
      ]);

      const result = await statsService.getProductStats();

      expect(result.lowStock).toBe(5);
    });

    it('should handle no products', async () => {
      database.query.mockResolvedValueOnce([[null]]);

      const result = await statsService.getProductStats();

      expect(result).toEqual({ total: 0, lowStock: 0 });
    });
  });

  describe('getUserStats', () => {
    it('should return user statistics', async () => {
      database.query.mockResolvedValueOnce([
        [
          {
            total: 200,
            customers: 195,
            newCustomers: 3,
          },
        ],
      ]);

      const result = await statsService.getUserStats();

      expect(result.total).toBe(200);
      expect(result.customers).toBe(195);
      expect(result.newCustomers).toBe(3);
    });

    it('should count new users registered today', async () => {
      database.query.mockResolvedValueOnce([
        [
          {
            total: 100,
            customers: 99,
            newCustomers: 10,
          },
        ],
      ]);

      const result = await statsService.getUserStats();

      expect(result.newCustomers).toBe(10);
    });

    it('should handle no users', async () => {
      database.query.mockResolvedValueOnce([[null]]);

      const result = await statsService.getUserStats();

      expect(result).toEqual({ total: 0, customers: 0, newCustomers: 0 });
    });
  });

  describe('getRecentOrders', () => {
    it('should return recent orders with user info', async () => {
      const mockOrders = [
        {
          id: 1,
          total: 500000,
          status: 'pending',
          userName: 'User 1',
        },
        {
          id: 2,
          total: 300000,
          status: 'paid',
          userName: 'User 2',
        },
      ];

      database.query.mockResolvedValueOnce([mockOrders]);

      const result = await statsService.getRecentOrders(5);

      expect(result).toHaveLength(2);
      expect(result[0].id).toBe(1);
      expect(result[0].userName).toBe('User 1');
    });

    it('should respect limit parameter', async () => {
      database.query.mockResolvedValueOnce([[]]);

      await statsService.getRecentOrders(10);

      expect(database.query).toHaveBeenCalledWith(
        expect.stringContaining('LIMIT ?'),
        expect.arrayContaining([10])
      );
    });

    it('should use default limit of 5', async () => {
      database.query.mockResolvedValueOnce([[]]);

      await statsService.getRecentOrders();

      expect(database.query).toHaveBeenCalledWith(expect.any(String), [
        expect.any(Date),
        expect.any(Date),
        6,
      ]);
    });

    it('should map fields correctly', async () => {
      const mockOrder = {
        id: 1,
        total: 500000,
        status: 'shipped',
        userName: 'Test User',
      };

      database.query.mockResolvedValueOnce([[mockOrder]]);

      const result = await statsService.getRecentOrders(1);

      expect(result[0]).toEqual({
        id: 1,
        total: 500000,
        status: 'shipped',
        userName: 'Test User',
      });
    });

    it('should return empty array when no orders', async () => {
      database.query.mockResolvedValueOnce([[]]);

      const result = await statsService.getRecentOrders(5);

      expect(result).toEqual([]);
    });
  });

  describe('getTopSellingProducts', () => {
    it('should return top selling products', async () => {
      const mockProducts = [
        {
          id: 1,
          name: 'Product 1',
          price: 100000,
          stock: 10,
          image_url: 'img1.jpg',
          totalSold: '100',
          totalRevenue: '10000000',
        },
        {
          id: 2,
          name: 'Product 2',
          price: 200000,
          stock: 5,
          image_url: null,
          totalSold: '50',
          totalRevenue: '10000000',
        },
      ];

      database.query.mockResolvedValueOnce([mockProducts]);

      const result = await statsService.getTopSellingProducts(5);

      expect(result).toHaveLength(2);
      expect(result[0].totalSold).toBe(100);
      expect(result[0].totalRevenue).toBe(10000000);
    });

    it('should respect limit parameter', async () => {
      database.query.mockResolvedValueOnce([[]]);

      await statsService.getTopSellingProducts(10);

      expect(database.query).toHaveBeenCalledWith(
        expect.stringContaining('LIMIT ?'),
        expect.arrayContaining([10])
      );
    });

    it('should only count confirmed orders', async () => {
      database.query.mockResolvedValueOnce([[]]);

      await statsService.getTopSellingProducts(5);

      expect(database.query).toHaveBeenCalledWith(
        expect.stringContaining("status IN ('paid', 'shipped', 'delivered')"),
        expect.any(Array)
      );
    });

    it('should handle products with no sales', async () => {
      const mockProducts = [
        {
          id: 1,
          name: 'New Product',
          price: 100000,
          stock: 100,
          image_url: null,
          totalSold: '0',
          totalRevenue: '0',
        },
      ];

      database.query.mockResolvedValueOnce([mockProducts]);

      const result = await statsService.getTopSellingProducts(5);

      expect(result[0].totalSold).toBe(0);
      expect(result[0].totalRevenue).toBe(0);
    });
  });

  describe('getMonthlyRevenue', () => {
    it('should return monthly revenue data', async () => {
      const mockData = [
        { month: '2024-01', revenue: '10000000', orderCount: '20' },
        { month: '2024-02', revenue: '15000000', orderCount: '30' },
        { month: '2024-03', revenue: '12000000', orderCount: '25' },
      ];

      database.query.mockResolvedValueOnce([mockData]);

      const result = await statsService.getMonthlyRevenue(3);

      expect(result).toHaveLength(3);
      expect(result[0].revenue).toBe(10000000);
      expect(result[0].orderCount).toBe(20);
    });

    it('should format month as YYYY-MM', async () => {
      const mockData = [{ month: '2024-06', revenue: '5000000', orderCount: '10' }];

      database.query.mockResolvedValueOnce([mockData]);

      const result = await statsService.getMonthlyRevenue(1);

      expect(result[0].month).toMatch(/^\d{4}-\d{2}$/);
    });

    it('should return empty array for no data', async () => {
      database.query.mockResolvedValueOnce([[]]);

      const result = await statsService.getMonthlyRevenue(6);

      expect(result).toEqual([]);
    });
  });
});
