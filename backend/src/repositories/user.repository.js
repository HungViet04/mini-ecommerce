/**
 * User Repository
 * Handles all database operations for users
 * Based on database schema: users(id, name, email, password, role, created_at)
 * - name: varchar(100)
 * - email: varchar(100) UNIQUE
 * - password: varchar(255)
 * - role: enum('admin','user') DEFAULT 'user'
 */
const BaseRepository = require('./base.repository');

class UserRepository extends BaseRepository {
  constructor() {
    super('users', 'id');
  }

  /**
   * Define columns for SELECT queries
   * @returns {string}
   */
  getSelectColumns() {
    return 'id, name, email, password, role, created_at';
  }

  /**
   * Find user by email
   * @param {string} email - User email
   * @returns {Promise<Object|null>}
   */
  async findByEmail(email) {
    return this.findOne({ email: email.toLowerCase() });
  }

  /**
   * Find user by identifier (email or username/name)
   * @param {string} identifier - Email or username
   * @returns {Promise<Object|null>}
   */
  async findByIdentifier(identifier) {
    const sql = `
      SELECT id, name, email, password, role, created_at
      FROM ${this.tableName}
      WHERE email = ? OR name = ?
      ORDER BY id ASC
      LIMIT 1
    `;
    const [rows] = await this.query(sql, [identifier, identifier]);
    return rows[0] || null;
  }

  /**
   * Check if email exists
   * @param {string} email - Email to check
   * @returns {Promise<boolean>}
   */
  async emailExists(email) {
    return this.exists({ email: email.toLowerCase() });
  }

  /**
   * Create user with role
   * @param {Object} userData - User data
   * @returns {Promise<Object>}
   */
  async createUser(userData) {
    const data = {
      name: userData.name,
      email: userData.email.toLowerCase(),
      password: userData.password,
      role: userData.role || 'user',
    };
    return this.create(data);
  }

  /**
   * Update user password
   * @param {number} userId - User ID
   * @param {string} hashedPassword - New hashed password
   * @returns {Promise<Object>}
   */
  async updatePassword(userId, hashedPassword) {
    return this.update(userId, { password: hashedPassword });
  }

  /**
   * Get users by role
   * @param {string} role - User role
   * @param {Object} options - Query options
   * @returns {Promise<Array>}
   */
  async findByRole(role, options = {}) {
    return this.findWhere({ role }, options);
  }
}

// Export singleton instance
module.exports = new UserRepository();
