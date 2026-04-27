/**
 * Central configuration module
 * Loads all environment variables and exports config object
 */
require('dotenv').config();

const corsOriginEnv = process.env.CORS_ORIGIN ? process.env.CORS_ORIGIN.trim() : '';
const parsedCorsOrigin =
  !corsOriginEnv || corsOriginEnv === '*'
    ? true
    : corsOriginEnv
        .split(',')
        .map((origin) => origin.trim())
        .filter(Boolean);
const openAITemperature = parseFloat(process.env.OPENAI_TEMPERATURE);

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
    // NOTE: Using "true" reflects request origin, which is safer with credentials enabled.
    origin: parsedCorsOrigin,
    credentials: true,
  },

  // AWS S3
  s3: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID || process.env.S3_ACCESS_KEY_ID || '',
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY || process.env.S3_SECRET_ACCESS_KEY || '',
    region: process.env.S3_REGION || process.env.AWS_REGION || 'ap-southeast-1',
    bucket: process.env.S3_BUCKET || '',
  },

  // OpenAI
  openai: {
    apiKey: process.env.OPENAI_API_KEY || '',
    model: process.env.OPENAI_MODEL || 'gpt-4o-mini',
    baseURL: process.env.OPENAI_BASE_URL || '',
    maxTokens: parseInt(process.env.OPENAI_MAX_TOKENS, 10) || 700,
    temperature: Number.isFinite(openAITemperature) ? openAITemperature : 0.3,
  },

  // Chatbot controls
  chatbot: {
    rateLimitWindowMs: parseInt(process.env.CHATBOT_RATE_LIMIT_WINDOW_MS, 10) || 60000,
    rateLimitMax: parseInt(process.env.CHATBOT_RATE_LIMIT_MAX, 10) || 30,
    messageMaxLength: parseInt(process.env.CHATBOT_MESSAGE_MAX_LENGTH, 10) || 1000,
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
Object.freeze(config.openai);
Object.freeze(config.chatbot);

module.exports = config;
