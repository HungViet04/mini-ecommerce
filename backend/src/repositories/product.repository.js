/**
 * Product Repository
 * Handles all database operations for products
 * Based on database schema: products(id, name, price, stock, category_id, created_at)
 * - name: varchar(255)
 * - price: decimal(10,2)
 * - stock: int
 * - category_id: int (FK to categories)
 */
const BaseRepository = require('./base.repository');

class ProductRepository extends BaseRepository {
  constructor() {
    super('products', 'id');
  }

  /**
   * Define columns for SELECT queries
   * @returns {string}
   */
  getSelectColumns() {
    return 'id, name, description, image_url, price, stock, category_id, created_at';
  }

  /**
   * Search products by name
   * @param {string} query - Search query
   * @param {Object} options - Query options
   * @returns {Promise<Array>}
   */
  async searchByName(query, options = {}) {
    const { limit = 50, offset = 0 } = options;
    const sql = `
      SELECT id, name, description, image_url, price, stock, category_id, created_at 
      FROM ${this.tableName} 
      WHERE name LIKE ? 
      ORDER BY name ASC 
      LIMIT ? OFFSET ?
    `;
    const [rows] = await this.query(sql, [`%${query}%`, parseInt(limit, 10), parseInt(offset, 10)]);
    return rows;
  }

  /**
   * Find products by category
   * @param {number} categoryId - Category ID
   * @param {Object} options - Query options
   * @returns {Promise<Array>}
   */
  async findByCategory(categoryId, options = {}) {
    return this.findWhere({ category_id: categoryId }, options);
  }

  /**
   * Find products in stock
   * @param {Object} options - Query options
   * @returns {Promise<Array>}
   */
  async findInStock(options = {}) {
    const { limit = 50, offset = 0, orderBy = 'name', order = 'ASC' } = options;
    const sql = `
      SELECT id, name, description, image_url, price, stock, category_id, created_at 
      FROM ${this.tableName} 
      WHERE stock > 0 
      ORDER BY ${orderBy} ${order} 
      LIMIT ? OFFSET ?
    `;
    const [rows] = await this.query(sql, [parseInt(limit, 10), parseInt(offset, 10)]);
    return rows;
  }

  /**
   * Check product stock
   * @param {number} productId - Product ID
   * @returns {Promise<number>}
   */
  async getStock(productId) {
    const product = await this.findById(productId);
    return product ? product.stock : 0;
  }

  /**
   * Decrement product stock (for transactions)
   * @param {Object} connection - Database connection
   * @param {number} productId - Product ID
   * @param {number} quantity - Quantity to decrement
   * @returns {Promise<Object>}
   */
  async decrementStock(connection, productId, quantity) {
    const sql = `UPDATE ${this.tableName} SET stock = stock - ? WHERE id = ? AND stock >= ?`;
    const [result] = await this.query(sql, [quantity, productId, quantity], connection);
    return result;
  }

  /**
   * Increment product stock (for order cancellation)
   * @param {Object} connection - Database connection
   * @param {number} productId - Product ID
   * @param {number} quantity - Quantity to increment
   * @returns {Promise<Object>}
   */
  async incrementStock(connection, productId, quantity) {
    const sql = `UPDATE ${this.tableName} SET stock = stock + ? WHERE id = ?`;
    const [result] = await this.query(sql, [quantity, productId], connection);
    return result;
  }

  /**
   * Get products with pagination
   * @param {Object} options - Pagination options
   * @returns {Promise<Object>} { items, total }
   */
  async findWithPagination({ page = 1, limit = 20, orderBy = 'id', order = 'DESC' }) {
    const offset = (page - 1) * limit;
    const [items, totalResult] = await Promise.all([
      this.findAll({ limit, offset, orderBy, order }),
      this.count(),
    ]);

    return { items, total: totalResult };
  }
}

// Export singleton instance
module.exports = new ProductRepository();
