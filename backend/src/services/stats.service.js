/**
 * Stats Service
 * Business logic for dashboard statistics
 */
const database = require('../config/database');
const { ORDER_STATUS } = require('../constants');

class StatsService {
  /**
   * Get dashboard statistics
   * @returns {Promise<Object>} Stats data
   */
  async getDashboardStats() {
    const [
      orderStats,
      revenueStats,
      productStats,
      userStats,
      recentOrders,
      topProducts,
      monthlyRevenue,
    ] = await Promise.all([
      this.getOrderStats(),
      this.getRevenueStats(),
      this.getProductStats(),
      this.getUserStats(),
      this.getRecentOrders(5),
      this.getTopSellingProducts(5),
      this.getMonthlyRevenue(6),
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
  async getOrderStats() {
    const sql = `
      SELECT
        COUNT(*) as total,
        SUM(CASE WHEN status = 'pending' THEN 1 ELSE 0 END) as pending,
        SUM(CASE WHEN status = 'paid' THEN 1 ELSE 0 END) as paid,
        SUM(CASE WHEN status = 'shipped' THEN 1 ELSE 0 END) as shipped,
        SUM(CASE WHEN status = 'delivered' THEN 1 ELSE 0 END) as delivered
      FROM orders
    `;
    const [rows] = await database.query(sql);
    return rows[0] || { total: 0, pending: 0, paid: 0, shipped: 0, delivered: 0 };
  }

  /**
   * Get revenue statistics
   */
  async getRevenueStats() {
    const sql = `
      SELECT
        COALESCE(SUM(total), 0) as totalRevenue,
        COALESCE(SUM(CASE WHEN status IN ('paid', 'shipped', 'delivered') THEN total ELSE 0 END), 0) as confirmedRevenue,
        COALESCE(SUM(CASE WHEN status = 'pending' THEN total ELSE 0 END), 0) as pendingRevenue,
        COALESCE(SUM(CASE WHEN DATE(created_at) = CURDATE() THEN total ELSE 0 END), 0) as todayRevenue,
        COALESCE(SUM(CASE WHEN YEARWEEK(created_at) = YEARWEEK(NOW()) THEN total ELSE 0 END), 0) as weekRevenue,
        COALESCE(SUM(CASE WHEN MONTH(created_at) = MONTH(NOW()) AND YEAR(created_at) = YEAR(NOW()) THEN total ELSE 0 END), 0) as monthRevenue
      FROM orders
    `;
    const [rows] = await database.query(sql);
    return rows[0] || { totalRevenue: 0, confirmedRevenue: 0, pendingRevenue: 0, todayRevenue: 0, weekRevenue: 0, monthRevenue: 0 };
  }

  /**
   * Get product statistics
   */
  async getProductStats() {
    const sql = `
      SELECT
        COUNT(*) as total,
        SUM(CASE WHEN stock > 0 THEN 1 ELSE 0 END) as inStock,
        SUM(CASE WHEN stock = 0 THEN 1 ELSE 0 END) as outOfStock,
        SUM(CASE WHEN stock > 0 AND stock <= 5 THEN 1 ELSE 0 END) as lowStock
      FROM products
    `;
    const [rows] = await database.query(sql);
    return rows[0] || { total: 0, inStock: 0, outOfStock: 0, lowStock: 0 };
  }

  /**
   * Get user statistics
   */
  async getUserStats() {
    const sql = `
      SELECT
        COUNT(*) as total,
        SUM(CASE WHEN role = 'user' THEN 1 ELSE 0 END) as customers,
        SUM(CASE WHEN role = 'admin' THEN 1 ELSE 0 END) as admins,
        SUM(CASE WHEN DATE(created_at) = CURDATE() THEN 1 ELSE 0 END) as newToday
      FROM users
    `;
    const [rows] = await database.query(sql);
    return rows[0] || { total: 0, customers: 0, admins: 0, newToday: 0 };
  }

  /**
   * Get recent orders
   * @param {number} limit - Number of orders to return
   */
  async getRecentOrders(limit = 5) {
    const sql = `
      SELECT
        o.id, o.total, o.status, o.payment_method, o.created_at,
        u.name as userName, u.email as userEmail
      FROM orders o
      LEFT JOIN users u ON u.id = o.user_id
      ORDER BY o.created_at DESC
      LIMIT ?
    `;
    const [rows] = await database.query(sql, [limit]);
    return rows.map(row => ({
      id: row.id,
      total: row.total,
      status: row.status,
      paymentMethod: row.payment_method,
      createdAt: row.created_at,
      userName: row.userName,
      userEmail: row.userEmail,
    }));
  }

  /**
   * Get top selling products
   * @param {number} limit - Number of products to return
   */
  async getTopSellingProducts(limit = 5) {
    const sql = `
      SELECT
        p.id, p.name, p.price, p.stock, p.image_url,
        COALESCE(SUM(oi.quantity), 0) as totalSold,
        COALESCE(SUM(oi.quantity * oi.price), 0) as totalRevenue
      FROM products p
      LEFT JOIN order_items oi ON oi.product_id = p.id
      LEFT JOIN orders o ON o.id = oi.order_id AND o.status IN ('paid', 'shipped', 'delivered')
      GROUP BY p.id
      ORDER BY totalSold DESC
      LIMIT ?
    `;
    const [rows] = await database.query(sql, [limit]);
    return rows.map(row => ({
      id: row.id,
      name: row.name,
      price: row.price,
      stock: row.stock,
      imageUrl: row.image_url,
      totalSold: Number(row.totalSold),
      totalRevenue: Number(row.totalRevenue),
    }));
  }

  /**
   * Get monthly revenue for chart
   * @param {number} months - Number of months to return
   */
  async getMonthlyRevenue(months = 6) {
    const sql = `
      SELECT 
        DATE_FORMAT(created_at, '%Y-%m') as month,
        MIN(DATE_FORMAT(created_at, '%m/%Y')) as label,
        COALESCE(SUM(CASE WHEN status IN ('paid', 'shipped', 'delivered') THEN total ELSE 0 END), 0) as revenue,
        COUNT(*) as orderCount
      FROM orders
      WHERE created_at >= DATE_SUB(NOW(), INTERVAL ? MONTH)
      GROUP BY DATE_FORMAT(created_at, '%Y-%m')
      ORDER BY month ASC
    `;
    const [rows] = await database.query(sql, [months]);
    return rows.map(row => ({
      month: row.month,
      label: row.label,
      revenue: Number(row.revenue),
      orderCount: Number(row.orderCount),
    }));
  }
}

module.exports = new StatsService();
