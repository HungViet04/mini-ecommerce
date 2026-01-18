/**
 * User Service
 * Business logic for user management (admin)
 */
const { userRepository } = require('../repositories');
const { NotFoundError, ValidationError, AuthorizationError } = require('../errors');
const { USER_ROLES } = require('../constants');
const database = require('../config/database');

class UserService {
  /**
   * Get all users with pagination (admin only)
   * @param {Object} options - Query options
   * @returns {Promise<Object>} { items, total }
   */
  async findAll(options = {}) {
    const { page = 1, limit = 20, role = null, search = null } = options;
    const offset = (page - 1) * limit;
    let sql = `
      SELECT 
        u.id, u.name, u.email, u.role, u.created_at,
        COUNT(DISTINCT o.id) as orderCount,
        COALESCE(SUM(o.total), 0) as totalSpent
      FROM users u
      LEFT JOIN orders o ON o.user_id = u.id
    `;
    const params = [];
    const conditions = [];

    if (role) {
      conditions.push('u.role = ?');
      params.push(role);
    }
    if (search) {
      conditions.push('(u.name LIKE ? OR u.email LIKE ?)');
      params.push(`%${search}%`, `%${search}%`);
    }

    if (conditions.length > 0) {
      sql += ' WHERE ' + conditions.join(' AND ');
    }
    sql += ' GROUP BY u.id ORDER BY u.created_at DESC';
    const [rows] = await database.query(sql, params);
    // Get total count
    let countSql = 'SELECT COUNT(*) as total FROM users u';
    if (conditions.length > 0) {
      countSql += ' WHERE ' + conditions.join(' AND ');
    }
    const [countRows] = await database.query(countSql, params);
    const total = countRows[0]?.total || 0;
    // Paginate
    const paginatedItems = rows.slice(offset, offset + parseInt(limit, 10));
    return {
      items: paginatedItems.map(row => ({
        id: row.id,
        name: row.name,
        email: row.email,
        role: row.role,
        createdAt: row.created_at,
        orderCount: Number(row.orderCount),
        totalSpent: Number(row.totalSpent),
      })),
      total,
    };
  }

  /**
   * Get user by ID with order stats
   * @param {number} id - User ID
   * @returns {Promise<Object>}
   */
  async findById(id) {
    const sql = `
      SELECT 
        u.id, u.name, u.email, u.role, u.created_at,
        COUNT(DISTINCT o.id) as orderCount,
        COALESCE(SUM(o.total), 0) as totalSpent
      FROM users u
      LEFT JOIN orders o ON o.user_id = u.id
      WHERE u.id = ?
      GROUP BY u.id
    `;
    const [rows] = await database.query(sql, [id]);

    if (!rows[0]) {
      throw new NotFoundError('User');
    }

    const row = rows[0];
    return {
      id: row.id,
      name: row.name,
      email: row.email,
      role: row.role,
      createdAt: row.created_at,
      orderCount: Number(row.orderCount),
      totalSpent: Number(row.totalSpent),
    };
  }

  /**
   * Update user role (admin only)
   * @param {number} id - User ID
   * @param {string} role - New role
   * @param {Object} currentUser - Current admin user
   * @returns {Promise<Object>}
   */
  async updateRole(id, role, currentUser) {
    if (!['user', 'admin'].includes(role)) {
      throw new ValidationError('Role không hợp lệ');
    }

    // Cannot change own role
    if (id === currentUser.id) {
      throw new ValidationError('Không thể thay đổi role của chính mình');
    }

    const user = await userRepository.findById(id);
    if (!user) {
      throw new NotFoundError('User');
    }

    await userRepository.update(id, { role });
    return this.findById(id);
  }

  /**
   * Delete user (admin only)
   * @param {number} id - User ID
   * @param {Object} currentUser - Current admin user
   * @returns {Promise<Object>}
   */
  async delete(id, currentUser) {
    // Cannot delete self
    if (id === currentUser.id) {
      throw new ValidationError('Không thể xóa tài khoản của chính mình');
    }

    const user = await userRepository.findById(id);
    if (!user) {
      throw new NotFoundError('User');
    }

    // Check if user has orders
    const [orderCheck] = await database.query('SELECT COUNT(*) as count FROM orders WHERE user_id = ?', [id]);
    if (orderCheck[0].count > 0) {
      throw new ValidationError('Không thể xóa user đã có đơn hàng. Hãy vô hiệu hóa thay vì xóa.');
    }
    await userRepository.delete(id);
    return { message: 'Xóa user thành công', userId: id };
  }

  /**
   * Get user's orders
   * @param {number} userId - User ID
   * @returns {Promise<Array>}
   */
  async getUserOrders(userId) {
    const sql = `
      SELECT 
        o.id, o.total, o.status, o.payment_method, o.created_at,
        o.shipping_name, o.shipping_phone, o.shipping_address
      FROM orders o
      WHERE o.user_id = ?
      ORDER BY o.created_at DESC
    `;
    const [rows] = await database.query(sql, [userId]);
    return rows.map(row => ({
      id: row.id,
      total: row.total,
      status: row.status,
      paymentMethod: row.payment_method,
      createdAt: row.created_at,
      shippingName: row.shipping_name,
      shippingPhone: row.shipping_phone,
      shippingAddress: row.shipping_address,
    }));
  }
}

module.exports = new UserService();
