/**
 * Stats Service
 * Business logic for dashboard statistics
 */
const database = require('../config/database');

class StatsService {
  /**
   * Get dashboard statistics
   * @returns {Promise<Object>} Stats data
   */
  async getDashboardStats(range) {
    const [
      orderStats,
      revenueStats,
      productStats,
      userStats,
      recentOrders,
      topProducts,
      monthlyRevenue,
    ] = await Promise.all([
      this.getOrderStats(range),
      this.getRevenueStats(range),
      this.getProductStats(),
      this.getUserStats(range),
      this.getRecentOrders(6, range),
      this.getTopSellingProducts(5, range),
      this.getMonthlyRevenue(),
    ]);

    return {
      orders: orderStats,
      revenue: revenueStats,
      products: productStats,
      users: userStats,
      recentOrders,
      topProducts,
      monthlyRevenue,
    };
  }

  /**
   * Get order statistics
   */
  async getOrderStats(range) {
    const sql = `
      SELECT
        COUNT(*) as total,
        SUM(CASE WHEN status = 'pending' THEN 1 ELSE 0 END) as pending,
        SUM(CASE WHEN status = 'paid' THEN 1 ELSE 0 END) as paid,
        SUM(CASE WHEN status = 'shipped' THEN 1 ELSE 0 END) as shipped,
        SUM(CASE WHEN status = 'delivered' THEN 1 ELSE 0 END) as delivered
      FROM orders
      WHERE created_at >= ? AND created_at <= ?
    `;
    const [rows] = await database.query(sql, [
      range ? range.from : new Date(Date.now() - 30 * 24 * 60 * 60 * 1000), // Default to last 30 days
      range ? range.to : new Date(),
    ]);
    return rows[0] || { total: 0, pending: 0, paid: 0, shipped: 0, delivered: 0 };
  }

  /**
   * Get revenue statistics
   */
  async getRevenueStats(range) {
    const sql = `
      SELECT
        COALESCE(SUM(total), 0) as totalRevenue,
        COALESCE(SUM(CASE WHEN status IN ('paid', 'shipped', 'delivered') THEN total ELSE 0 END), 0) as confirmedRevenue,
        COALESCE(SUM(CASE WHEN status = 'pending' THEN total ELSE 0 END), 0) as pendingRevenue
      FROM orders
      WHERE created_at >= ? AND created_at <= ?
    `;
    const [rows] = await database.query(sql, [
      range ? range.from : new Date(Date.now() - 30 * 24 * 60 * 60 * 1000),
      range ? range.to : new Date(),
    ]);
    return (
      rows[0] || {
        totalRevenue: 0,
        confirmedRevenue: 0,
        pendingRevenue: 0,
      }
    );
  }

  /**
   * Get product statistics
   */
  async getProductStats() {
    const sql = `
      SELECT
        COUNT(*) as total,
        SUM(CASE WHEN stock > 0 AND stock <= 5 THEN 1 ELSE 0 END) as lowStock
      FROM products
    `;
    const [rows] = await database.query(sql);
    return rows[0] || { total: 0, lowStock: 0 };
  }

  /**
   * Get user statistics
   */
  async getUserStats(range) {
    const sql = `
      SELECT
        COUNT(*) as total,
        SUM(CASE WHEN role = 'user' THEN 1 ELSE 0 END) as customers,
        SUM(CASE WHEN created_at BETWEEN ? AND ? THEN 1 ELSE 0 END) as newCustomers
      FROM users
    `;
    const [rows] = await database.query(sql, [
      range ? range.from : new Date(Date.now() - 30 * 24 * 60 * 60 * 1000),
      range ? range.to : new Date(),
    ]);
    return rows[0] || { total: 0, customers: 0, newCustomers: 0 };
  }

  /**
   * Get recent orders
   * @param {number} limit - Number of orders to return
   */
  async getRecentOrders(limit = 6, range) {
    const sql = `
      SELECT
        o.id, o.total, o.status, u.name as userName
      FROM orders o
      LEFT JOIN users u ON u.id = o.user_id
      WHERE o.created_at BETWEEN ? AND ?
      ORDER BY o.created_at DESC
      LIMIT ?
    `;
    const [rows] = await database.query(sql, [
      range ? range.from : new Date(Date.now() - 30 * 24 * 60 * 60 * 1000),
      range ? range.to : new Date(),
      limit,
    ]);
    return rows.map((row) => ({
      id: row.id,
      total: row.total,
      status: row.status,
      userName: row.userName,
    }));
  }

  /**
   * Get top selling products
   * @param {number} limit - Number of products to return
   */
  async getTopSellingProducts(limit = 5, range) {
    const sql = `
      SELECT
        p.id, p.name, p.stock,
        COALESCE(SUM(oi.quantity), 0) as totalSold,
        COALESCE(SUM(oi.quantity * oi.price), 0) as totalRevenue
      FROM products p
      LEFT JOIN order_items oi ON oi.product_id = p.id
      LEFT JOIN orders o ON o.id = oi.order_id AND o.status IN ('paid', 'shipped', 'delivered')
      WHERE p.created_at >= ? AND p.created_at <= ?
      GROUP BY p.id
      ORDER BY totalSold DESC
      LIMIT ?
    `;
    const [rows] = await database.query(sql, [
      range ? range.from : new Date(Date.now() - 30 * 24 * 60 * 60 * 1000),
      range ? range.to : new Date(),
      limit,
    ]);
    return rows.map((row) => ({
      id: row.id,
      name: row.name,
      stock: row.stock,
      totalSold: Number(row.totalSold),
      totalRevenue: Number(row.totalRevenue),
    }));
  }

  /**
   * Get monthly revenue for chart
   */
  async getMonthlyRevenue() {
    const sql = `
      SELECT
        DATE_FORMAT(created_at, '%Y-%m') as month,
        DATE_FORMAT(MIN(created_at), '%m/%Y') as label,
        COALESCE(
          SUM(
            CASE
              WHEN status IN ('paid', 'shipped', 'delivered')
              THEN total
              ELSE 0
            END
          ),
          0
        ) as revenue,
        COUNT(*) as orderCount
      FROM orders
      WHERE YEAR(created_at) = YEAR(CURDATE())
      GROUP BY DATE_FORMAT(created_at, '%Y-%m')
      ORDER BY month ASC
    `;
    const [rows] = await database.query(sql);
    return rows.map((row) => ({
      month: row.month,
      label: row.label,
      revenue: Number(row.revenue),
      orderCount: Number(row.orderCount),
    }));
  }
}

module.exports = new StatsService();
