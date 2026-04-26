/**
 * Central configuration module
 * Loads all environment variables and exports config object
 */
require('dotenv').config();

const corsOriginEnv = process.env.CORS_ORIGIN ? process.env.CORS_ORIGIN.trim() : '';
const parsedCorsOrigin =
  !corsOriginEnv || corsOriginEnv === '*'
    ? '*'
    : corsOriginEnv
        .split(',')
        .map((origin) => origin.trim())
        .filter(Boolean);

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
    // Support wildcard and comma-separated allowlist.
    // NOTE: "*" must remain a string, not an array entry.
    origin: parsedCorsOrigin,
    credentials: true,
  },

  // AWS S3
  s3: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID || '',
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY || '',
    region: process.env.S3_REGION || 'ap-southeast-1',
    bucket: process.env.S3_BUCKET || '',
  },

  // Gemini AI
  gemini: {
    apiKey: process.env.GEMINI_API_KEY || '',
    model: process.env.GEMINI_MODEL || 'gemini-2.5-flash',
  },
};

// Freeze config to prevent accidental modifications
Object.freeze(config);
Object.freeze(config.db);
Object.freeze(config.jwt);
Object.freeze(config.bcrypt);
Object.freeze(config.pagination);
Object.freeze(config.cors);
Object.freeze(config.s3);
Object.freeze(config.gemini);

module.exports = config;
