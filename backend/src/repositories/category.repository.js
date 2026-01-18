/**
 * Category Repository
 * Handles all database operations for categories
 * Based on database schema: categories(id, name)
 */
const BaseRepository = require('./base.repository');

class CategoryRepository extends BaseRepository {
  constructor() {
    super('categories', 'id');
  }

  /**
   * Define columns for SELECT queries
   * @returns {string}
   */
  getSelectColumns() {
    return 'id, name';
  }

  /**
   * Find category by name
   * @param {string} name - Category name (varchar 100)
   * @returns {Promise<Object|null>}
   */
  async findByName(name) {
    return this.findOne({ name });
  }

  /**
   * Get categories with product count
   * @returns {Promise<Array>}
   */
  async findWithProductCount() {
    const sql = `
      SELECT c.id, c.name, COUNT(p.id) as product_count
      FROM ${this.tableName} c
      LEFT JOIN products p ON p.category_id = c.id
      GROUP BY c.id, c.name
      ORDER BY c.name ASC
    `;
    const [rows] = await this.query(sql);
    return rows;
  }

  /**
   * Get active categories (with at least one product)
   * @returns {Promise<Array>}
   */
  async findActive() {
    const sql = `
      SELECT DISTINCT c.id, c.name
      FROM ${this.tableName} c
      INNER JOIN products p ON p.category_id = c.id
      ORDER BY c.name ASC
    `;
    const [rows] = await this.query(sql);
    return rows;
  }
}

// Export singleton instance
module.exports = new CategoryRepository();
