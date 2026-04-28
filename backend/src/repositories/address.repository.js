/**
 * Address Repository
 * Handles database operations for user addresses
 * Table: user_addresses
 */
const BaseRepository = require('./base.repository');

class AddressRepository extends BaseRepository {
  constructor() {
    super('user_addresses', 'id');
  }

  getSelectColumns() {
    return 'id, user_id, full_name, phone, province, district, ward, address, note, type, is_default, created_at, updated_at';
  }

  async findByUser(userId) {
    const sql = `
      SELECT ${this.getSelectColumns()}
      FROM ${this.tableName}
      WHERE user_id = ?
      ORDER BY is_default DESC, created_at DESC
    `;
    const [rows] = await this.query(sql, [userId]);
    return rows;
  }

  async findByIdForUser(id, userId) {
    const sql = `
      SELECT ${this.getSelectColumns()}
      FROM ${this.tableName}
      WHERE id = ? AND user_id = ?
      LIMIT 1
    `;
    const [rows] = await this.query(sql, [id, userId]);
    return rows[0] || null;
  }

  async findDefaultByUser(userId) {
    const sql = `
      SELECT ${this.getSelectColumns()}
      FROM ${this.tableName}
      WHERE user_id = ? AND is_default = 1
      LIMIT 1
    `;
    const [rows] = await this.query(sql, [userId]);
    return rows[0] || null;
  }

  async clearDefaultByUser(userId, connection = null) {
    const sql = `UPDATE ${this.tableName} SET is_default = 0 WHERE user_id = ?`;
    await this.query(sql, [userId], connection);
  }

  async setDefaultForUser(id, userId, connection = null) {
    const sql = `UPDATE ${this.tableName} SET is_default = 1 WHERE id = ? AND user_id = ?`;
    await this.query(sql, [id, userId], connection);
  }

  async findLatestByUser(userId) {
    const sql = `
      SELECT ${this.getSelectColumns()}
      FROM ${this.tableName}
      WHERE user_id = ?
      ORDER BY created_at DESC
      LIMIT 1
    `;
    const [rows] = await this.query(sql, [userId]);
    return rows[0] || null;
  }
}

module.exports = new AddressRepository();
