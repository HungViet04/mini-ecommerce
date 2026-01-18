/**
 * Base Repository
 * Abstract class providing common CRUD operations
 * All repositories should extend this class
 */
const database = require('../config/database');
const { DatabaseError, NotFoundError } = require('../errors');

class BaseRepository {
  /**
   * @param {string} tableName - Database table name
   * @param {string} primaryKey - Primary key column name
   */
  constructor(tableName, primaryKey = 'id') {
    if (new.target === BaseRepository) {
      throw new Error('BaseRepository is an abstract class and cannot be instantiated directly');
    }
    this.tableName = tableName;
    this.primaryKey = primaryKey;
  }

  /**
   * Get database instance
   * @returns {Object} Database instance
   */
  get db() {
    return database;
  }

  /**
   * Execute a query
   * @param {string} sql - SQL query
   * @param {Array|Object} params - Query parameters
   * @param {Object} connection - Optional connection for transactions
   * @returns {Promise<Array>}
   */
  async query(sql, params = [], connection = null) {
    try {
      if (connection) {
        return connection.query(sql, params);
      }
      return this.db.query(sql, params);
    } catch (error) {
      throw new DatabaseError('Truy vấn cơ sở dữ liệu thất bại', error.message);
    }
  }

  /**
   * Get columns to select (override in child classes for specific columns)
   * @returns {string} Column list or '*'
   */
  getSelectColumns() {
    return '*';
  }

  /**
   * Find all records
   * @param {Object} options - Query options
   * @param {number} options.limit - Limit results
   * @param {number} options.offset - Offset results
   * @param {string} options.orderBy - Order by column
   * @param {string} options.order - Order direction (ASC/DESC)
   * @returns {Promise<Array>}
   */
  async findAll({ limit = null, offset = null, orderBy = null, order = 'ASC' } = {}) {
    let sql = `SELECT ${this.getSelectColumns()} FROM ${this.tableName}`;
    const params = [];

    if (orderBy) {
      sql += ` ORDER BY ${orderBy} ${order.toUpperCase()}`;
    }

    if (limit !== null) {
      sql += ' LIMIT ?';
      params.push(parseInt(limit, 10));
    }

    if (offset !== null) {
      sql += ' OFFSET ?';
      params.push(parseInt(offset, 10));
    }

    const [rows] = await this.query(sql, params);
    return rows;
  }

  /**
   * Find record by ID
   * @param {number|string} id - Record ID
   * @returns {Promise<Object|null>}
   */
  async findById(id) {
    const sql = `SELECT ${this.getSelectColumns()} FROM ${this.tableName} WHERE ${this.primaryKey} = ? LIMIT 1`;
    const [rows] = await this.query(sql, [id]);
    return rows[0] || null;
  }

  /**
   * Find record by ID or throw NotFoundError
   * @param {number|string} id - Record ID
   * @param {string} resourceName - Resource name for error message
   * @returns {Promise<Object>}
   */
  async findByIdOrFail(id, resourceName = null) {
    const record = await this.findById(id);
    if (!record) {
      throw new NotFoundError(resourceName || this.tableName);
    }
    return record;
  }

  /**
   * Find records by condition
   * @param {Object} conditions - Where conditions
   * @param {Object} options - Query options
   * @returns {Promise<Array>}
   */
  async findWhere(conditions, options = {}) {
    const { columns, values } = this.buildWhereClause(conditions);
    let sql = `SELECT ${this.getSelectColumns()} FROM ${this.tableName} WHERE ${columns}`;

    if (options.orderBy) {
      sql += ` ORDER BY ${options.orderBy} ${(options.order || 'ASC').toUpperCase()}`;
    }

    if (options.limit) {
      sql += ` LIMIT ${parseInt(options.limit, 10)}`;
    }

    if (options.offset) {
      sql += ` OFFSET ${parseInt(options.offset, 10)}`;
    }

    const [rows] = await this.query(sql, values);
    return rows;
  }

  /**
   * Find one record by condition
   * @param {Object} conditions - Where conditions
   * @returns {Promise<Object|null>}
   */
  async findOne(conditions) {
    const results = await this.findWhere(conditions, { limit: 1 });
    return results[0] || null;
  }

  /**
   * Create a new record
   * @param {Object} data - Record data
   * @param {Object} connection - Optional connection for transactions
   * @returns {Promise<Object>} Created record with ID
   */
  async create(data, connection = null) {
    const columns = Object.keys(data);
    const values = Object.values(data);
    const placeholders = columns.map(() => '?').join(', ');

    const sql = `INSERT INTO ${this.tableName} (${columns.join(', ')}) VALUES (${placeholders})`;
    const [result] = await this.query(sql, values, connection);

    return {
      [this.primaryKey]: result.insertId,
      ...data,
    };
  }

  /**
   * Update a record by ID
   * @param {number|string} id - Record ID
   * @param {Object} data - Update data
   * @param {Object} connection - Optional connection for transactions
   * @returns {Promise<Object>} Updated record
   */
  async update(id, data, connection = null) {
    const columns = Object.keys(data);
    const values = Object.values(data);
    const setClause = columns.map((col) => `${col} = ?`).join(', ');

    const sql = `UPDATE ${this.tableName} SET ${setClause} WHERE ${this.primaryKey} = ?`;
    await this.query(sql, [...values, id], connection);

    return this.findById(id);
  }

  /**
   * Delete a record by ID
   * @param {number|string} id - Record ID
   * @param {Object} connection - Optional connection for transactions
   * @returns {Promise<boolean>}
   */
  async delete(id, connection = null) {
    const sql = `DELETE FROM ${this.tableName} WHERE ${this.primaryKey} = ?`;
    const [result] = await this.query(sql, [id], connection);
    return result.affectedRows > 0;
  }

  /**
   * Count all records
   * @param {Object} conditions - Optional where conditions
   * @returns {Promise<number>}
   */
  async count(conditions = null) {
    let sql = `SELECT COUNT(*) as count FROM ${this.tableName}`;
    let values = [];

    if (conditions) {
      const whereClause = this.buildWhereClause(conditions);
      sql += ` WHERE ${whereClause.columns}`;
      values = whereClause.values;
    }

    const [rows] = await this.query(sql, values);
    return rows[0].count;
  }

  /**
   * Check if record exists
   * @param {Object} conditions - Where conditions
   * @returns {Promise<boolean>}
   */
  async exists(conditions) {
    const count = await this.count(conditions);
    return count > 0;
  }

  /**
   * Build WHERE clause from conditions object
   * @param {Object} conditions - Conditions object
   * @returns {Object} { columns: string, values: Array }
   */
  buildWhereClause(conditions) {
    const columns = Object.keys(conditions)
      .map((key) => `${key} = ?`)
      .join(' AND ');
    const values = Object.values(conditions);
    return { columns, values };
  }

  /**
   * Find by IDs with FOR UPDATE lock (for transactions)
   * @param {Object} connection - Database connection
   * @param {Array<number>} ids - Array of IDs
   * @returns {Promise<Array>}
   */
  async findByIdsForUpdate(connection, ids) {
    if (!ids || ids.length === 0) {
      return [];
    }
    const placeholders = ids.map(() => '?').join(',');
    const sql = `SELECT ${this.getSelectColumns()} FROM ${this.tableName} WHERE ${this.primaryKey} IN (${placeholders}) FOR UPDATE`;
    const [rows] = await this.query(sql, ids, connection);
    return rows;
  }
}

module.exports = BaseRepository;
