/**
 * Order Repository
 * Handles all database operations for orders and order items
 * Based on database schema:
 * - orders(id, user_id, total, status, shipping_name, shipping_phone, shipping_address, shipping_note, payment_method, shipping_fee, created_at)
 * - order_items(id, order_id, product_id, quantity, price)
 */
const BaseRepository = require('./base.repository');

class OrderRepository extends BaseRepository {
  constructor() {
    super('orders', 'id');
  }

  /**
   * Create order with items in transaction
   * @param {Object} connection - Database connection
   * @param {Object} orderData - Order data
   * @returns {Promise<Object>}
   */
  async createOrder(connection, orderData) {
    const {
      userId,
      total,
      status = 'pending',
      shippingName = null,
      shippingPhone = null,
      shippingAddress = null,
      shippingCity = null,
      shippingNotes = null,
      paymentMethod = 'cod',
      shippingFee = 30000,
    } = orderData;
    const sql = `
      INSERT INTO ${this.tableName} 
      (user_id, total, status, shipping_name, shipping_phone, shipping_address, shipping_city, shipping_notes, payment_method, shipping_fee) 
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `;
    const [result] = await this.query(
      sql,
      [
        userId,
        total,
        status,
        shippingName,
        shippingPhone,
        shippingAddress,
        shippingCity,
        shippingNotes,
        paymentMethod,
        shippingFee,
      ],
      connection
    );
    return {
      id: result.insertId,
      userId,
      total,
      status,
      shippingName,
      shippingPhone,
      shippingAddress,
      shippingCity,
      shippingNotes,
      paymentMethod,
      shippingFee,
    };
  }

  /**
   * Insert order item
   * @param {Object} connection - Database connection
   * @param {Object} itemData - Order item data
   * @returns {Promise<Object>}
   */
  async createOrderItem(connection, itemData) {
    const { orderId, productId, quantity, price } = itemData;
    const sql = `INSERT INTO order_items (order_id, product_id, quantity, price) VALUES (?, ?, ?, ?)`;
    const [result] = await this.query(sql, [orderId, productId, quantity, price], connection);
    return { id: result.insertId, ...itemData };
  }

  /**
   * Get orders by user ID with items
   * Note: orders table doesn't have updated_at column
   * @param {number} userId - User ID
   * @returns {Promise<Array>}
   */
  async getOrdersWithItemsByUser(userId) {
    const sql = `
      SELECT 
        o.id as order_id, 
        o.user_id,
        o.total, 
        o.status, 
        o.created_at,
        o.shipping_name,
        o.shipping_phone,
        o.shipping_address,
        o.shipping_city,
        o.shipping_notes,
        o.payment_method,
        o.shipping_fee,
        oi.id as item_id,
        oi.product_id, 
        oi.quantity, 
        oi.price,
        p.name as product_name
      FROM ${this.tableName} o
      LEFT JOIN order_items oi ON oi.order_id = o.id
      LEFT JOIN products p ON p.id = oi.product_id
      WHERE o.user_id = ?
      ORDER BY o.created_at DESC, oi.id ASC
    `;
    const [rows] = await this.query(sql, [userId]);
    return this.aggregateOrderItems(rows);
  }

  /**
   * Get order by ID with items
   * @param {number} orderId - Order ID
   * @returns {Promise<Object|null>}
   */
  async getOrderWithItems(orderId) {
    const sql = `
      SELECT 
        o.id as order_id, 
        o.user_id,
        o.total, 
        o.status, 
        o.created_at,
        o.shipping_name,
        o.shipping_phone,
        o.shipping_address,
        o.shipping_city,
        o.shipping_notes,
        o.payment_method,
        o.shipping_fee,
        oi.id as item_id,
        oi.product_id, 
        oi.quantity, 
        oi.price,
        p.name as product_name
      FROM ${this.tableName} o
      LEFT JOIN order_items oi ON oi.order_id = o.id
      LEFT JOIN products p ON p.id = oi.product_id
      WHERE o.id = ?
      ORDER BY oi.id ASC
    `;
    const [rows] = await this.query(sql, [orderId]);
    const orders = this.aggregateOrderItems(rows);
    return orders[0] || null;
  }

  /**
   * Update order status
   * Note: orders table doesn't have updated_at column
   * @param {number} orderId - Order ID
   * @param {string} status - New status (pending, paid, shipped)
   * @param {Object} connection - Optional connection
   * @returns {Promise<Object>}
   */
  async updateStatus(orderId, status, connection = null) {
    const sql = `UPDATE ${this.tableName} SET status = ? WHERE id = ?`;
    await this.query(sql, [status, orderId], connection);
    return this.findById(orderId);
  }

  /**
   * Get orders by status
   * @param {string} status - Order status
   * @param {Object} options - Query options
   * @returns {Promise<Array>}
   */
  async findByStatus(status, options = {}) {
    return this.findWhere({ status }, options);
  }

  /**
   * Get all orders with pagination (admin)
   * @param {Object} options - Pagination options
   * @returns {Promise<Object>}
   */
  async findAllWithPagination({ page = 1, limit = 20, status = null, search = null }) {
    const offset = (page - 1) * limit;
    const params = [];
    const conditions = [];

    if (status) {
      conditions.push('o.status = ?');
      params.push(status);
    }

    if (search) {
      conditions.push(
        '(o.id = ? OR o.shipping_name LIKE ? OR o.shipping_phone LIKE ? OR u.name LIKE ? OR u.email LIKE ?)'
      );
      params.push(
        parseInt(search, 10) || 0,
        `%${search}%`,
        `%${search}%`,
        `%${search}%`,
        `%${search}%`
      );
    }

    // Subquery để lấy đúng order_id cho LIMIT/OFFSET
    let subSql = `SELECT o.id FROM ${this.tableName} o LEFT JOIN users u ON u.id = o.user_id`;
    if (conditions.length > 0) {
      subSql += ' WHERE ' + conditions.join(' AND ');
    }
    subSql += ' ORDER BY o.created_at DESC';
    subSql += ' LIMIT ? OFFSET ?';
    const subParams = [...params, parseInt(limit, 10), offset];

    // Lấy danh sách order_id cho trang hiện tại
    const [idRows] = await this.query(subSql, subParams);
    const orderIds = idRows.map((row) => row.id);
    if (orderIds.length === 0) {
      return { items: [], total: 0 };
    }

    // Truy vấn chi tiết các order này
    let sql = `
      SELECT 
        o.id as order_id, 
        o.user_id,
        o.total, 
        o.status, 
        o.created_at,
        o.shipping_name,
        o.shipping_phone,
        o.shipping_address,
        o.shipping_city,
        o.shipping_notes,
        o.payment_method,
        o.shipping_fee,
        u.name as user_name, 
        u.email as user_email,
        oi.id as item_id,
        oi.product_id, 
        oi.quantity, 
        oi.price,
        p.name as product_name
      FROM ${this.tableName} o
      LEFT JOIN users u ON u.id = o.user_id
      LEFT JOIN order_items oi ON oi.order_id = o.id
      LEFT JOIN products p ON p.id = oi.product_id
      WHERE o.id IN (${orderIds.map(() => '?').join(',')})
      ORDER BY o.created_at DESC, oi.id ASC
    `;
    const [rows] = await this.query(sql, orderIds);

    // Đếm tổng số order
    let countSql = `SELECT COUNT(DISTINCT o.id) as total FROM ${this.tableName} o LEFT JOIN users u ON u.id = o.user_id`;
    if (conditions.length > 0) {
      countSql += ' WHERE ' + conditions.join(' AND ');
    }
    const [countRows] = await this.query(countSql, params);
    const total = countRows[0]?.total || 0;

    // Aggregate
    const items = this.aggregateOrderItemsWithUser(rows);
    return { items, total };
  }

  /**
   * Export orders for CSV/Excel
   * @param {Object} options - Filter options
   * @returns {Promise<Array>}
   */
  async getOrdersForExport({ status = null, startDate = null, endDate = null }) {
    let sql = `
      SELECT 
        o.id as order_id, 
        o.total, 
        o.status, 
        o.created_at,
        o.shipping_name,
        o.shipping_phone,
        o.shipping_address,
        o.shipping_city,
        o.shipping_notes,
        o.payment_method,
        o.shipping_fee,
        u.name as user_name, 
        u.email as user_email,
        GROUP_CONCAT(CONCAT(p.name, ' x', oi.quantity) SEPARATOR '; ') as items_summary
      FROM ${this.tableName} o
      LEFT JOIN users u ON u.id = o.user_id
      LEFT JOIN order_items oi ON oi.order_id = o.id
      LEFT JOIN products p ON p.id = oi.product_id
    `;
    const params = [];
    const conditions = [];

    if (status) {
      conditions.push('o.status = ?');
      params.push(status);
    }

    if (startDate) {
      conditions.push('o.created_at >= ?');
      params.push(startDate);
    }

    if (endDate) {
      conditions.push('o.created_at <= ?');
      params.push(endDate);
    }

    if (conditions.length > 0) {
      sql += ' WHERE ' + conditions.join(' AND ');
    }

    sql += ' GROUP BY o.id ORDER BY o.created_at DESC';

    const [rows] = await this.query(sql, params);
    return rows.map((row) => ({
      id: row.order_id,
      userName: row.user_name,
      userEmail: row.user_email,
      total: row.total,
      shippingFee: row.shipping_fee,
      status: row.status,
      paymentMethod: row.payment_method,
      shippingName: row.shipping_name,
      shippingPhone: row.shipping_phone,
      shippingAddress: row.shipping_address,
      shippingCity: row.shipping_city,
      shippingNotes: row.shipping_notes,
      itemsSummary: row.items_summary,
      createdAt: row.created_at,
    }));
  }

  /**
   * Aggregate order items from flat rows (with user info for admin)
   * @param {Array} rows - Flat rows from JOIN query
   * @returns {Array} Aggregated orders with items and user info
   */
  aggregateOrderItemsWithUser(rows) {
    const ordersMap = new Map();

    for (const row of rows) {
      const orderId = row.order_id;

      if (!ordersMap.has(orderId)) {
        ordersMap.set(orderId, {
          id: orderId,
          userId: row.user_id,
          userName: row.user_name,
          userEmail: row.user_email,
          total: row.total,
          status: row.status,
          createdAt: row.created_at,
          shippingName: row.shipping_name,
          shippingPhone: row.shipping_phone,
          shippingAddress: row.shipping_address,
          shippingCity: row.shipping_city,
          shippingNotes: row.shipping_notes,
          paymentMethod: row.payment_method,
          shippingFee: row.shipping_fee,
          items: [],
        });
      }

      if (row.product_id) {
        ordersMap.get(orderId).items.push({
          id: row.item_id,
          productId: row.product_id,
          productName: row.product_name,
          quantity: row.quantity,
          price: row.price,
        });
      }
    }

    return Array.from(ordersMap.values());
  }

  /**
   * Aggregate order items from flat rows
   * @param {Array} rows - Flat rows from JOIN query
   * @returns {Array} Aggregated orders with items
   */
  aggregateOrderItems(rows) {
    const ordersMap = new Map();

    for (const row of rows) {
      const orderId = row.order_id;

      if (!ordersMap.has(orderId)) {
        ordersMap.set(orderId, {
          id: orderId,
          userId: row.user_id,
          total: row.total,
          status: row.status,
          createdAt: row.created_at,
          shippingName: row.shipping_name,
          shippingPhone: row.shipping_phone,
          shippingAddress: row.shipping_address,
          shippingCity: row.shipping_city,
          shippingNotes: row.shipping_notes,
          paymentMethod: row.payment_method,
          shippingFee: row.shipping_fee,
          items: [],
        });
      }

      if (row.product_id) {
        ordersMap.get(orderId).items.push({
          id: row.item_id,
          productId: row.product_id,
          productName: row.product_name,
          quantity: row.quantity,
          price: row.price,
        });
      }
    }

    return Array.from(ordersMap.values());
  }
}

// Export singleton instance
module.exports = new OrderRepository();
