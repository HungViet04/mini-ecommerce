/**
 * Database connection pool using mysql2/promise
 * Singleton pattern for database connection
 */
const mysql = require('mysql2/promise');
const config = require('./index');
const logger = require('../utils/logger');

class Database {
  constructor() {
    this.pool = null;
  }

  /**
   * Initialize database connection pool
   * @returns {Promise<mysql.Pool>}
   */
  async initialize() {
    if (this.pool) {
      return this.pool;
    }

    this.pool = mysql.createPool({
      host: config.db.host,
      port: config.db.port,
      user: config.db.user,
      password: config.db.password,
      database: config.db.database,
      connectionLimit: config.db.connectionLimit,
      waitForConnections: config.db.waitForConnections,
      queueLimit: config.db.queueLimit,
      // Enable named placeholders for cleaner queries
      namedPlaceholders: true,
    });

    // Test connection
    try {
      const connection = await this.pool.getConnection();
      logger.info('Database connected successfully');
      connection.release();
    } catch (error) {
      logger.error('Database connection failed', error);
      throw error;
    }

    return this.pool;
  }

  /**
   * Get the connection pool
   * @returns {mysql.Pool}
   */
  getPool() {
    if (!this.pool) {
      throw new Error('Database not initialized. Call initialize() first.');
    }
    return this.pool;
  }

  /**
   * Execute a query using the pool
   * @param {string} sql - SQL query
   * @param {Array|Object} params - Query parameters
   * @returns {Promise<Array>}
   */
  async query(sql, params = []) {
    const pool = this.getPool();
    return pool.query(sql, params);
  }

  /**
   * Get a connection from the pool (for transactions)
   * @returns {Promise<mysql.PoolConnection>}
   */
  async getConnection() {
    const pool = this.getPool();
    return pool.getConnection();
  }

  /**
   * Execute a transaction
   * @param {Function} callback - Function receiving connection
   * @returns {Promise<any>}
   */
  async transaction(callback) {
    const connection = await this.getConnection();
    try {
      await connection.beginTransaction();
      const result = await callback(connection);
      await connection.commit();
      return result;
    } catch (error) {
      await connection.rollback();
      throw error;
    } finally {
      connection.release();
    }
  }

  /**
   * Close all connections in the pool
   */
  async close() {
    if (this.pool) {
      await this.pool.end();
      this.pool = null;
      logger.info('Database connection pool closed');
    }
  }
}

// Export singleton instance
module.exports = new Database();
