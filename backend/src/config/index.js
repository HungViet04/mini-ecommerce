/**
 * Central configuration module
 * Loads all environment variables and exports config object
 */
require('dotenv').config();

const config = {
  // Server
  env: process.env.NODE_ENV || 'development',
  port: parseInt(process.env.PORT, 10) || 3000,

  // Database
  db: {
    host: process.env.DB_HOST || 'localhost',
    port: parseInt(process.env.DB_PORT, 10) || 3306,
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || '',
    database: process.env.DB_NAME || 'ecommerce_db',
    connectionLimit: parseInt(process.env.DB_POOL_SIZE, 10) || 10,
    waitForConnections: true,
    queueLimit: 0,
  },

  // JWT
  jwt: {
    accessSecret: process.env.ACCESS_TOKEN_SECRET || 'access_secret_key_change_in_production',
    accessExpiresIn: process.env.ACCESS_TOKEN_EXPIRES_IN || '1d',
  },

  // Bcrypt
  bcrypt: {
    saltRounds: parseInt(process.env.BCRYPT_SALT_ROUNDS, 10) || 10,
  },

  // Pagination defaults
  pagination: {
    defaultPage: 1,
    defaultLimit: 20,
    maxLimit: 100,
  },

  // CORS
  cors: {
    origin: process.env.CORS_ORIGIN || '*',
    credentials: true,
  },
};

// Freeze config to prevent accidental modifications
Object.freeze(config);
Object.freeze(config.db);
Object.freeze(config.jwt);
Object.freeze(config.bcrypt);
Object.freeze(config.pagination);
Object.freeze(config.cors);

module.exports = config;
