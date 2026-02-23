/**
 * Jest Setup File
 * Runs before all tests — sets env vars, provides utilities.
 * Integration tests connect to a real MySQL database.
 */

// ── Environment ────────────────────────────────────────────
process.env.NODE_ENV = 'test';
// Config reads ACCESS_TOKEN_SECRET — align with CI env and auth middleware
process.env.ACCESS_TOKEN_SECRET = process.env.ACCESS_TOKEN_SECRET || 'test-jwt-secret-for-ci';
process.env.BCRYPT_SALT_ROUNDS = '4';

// ── Silence noisy console during tests ─────────────────────
global.console = {
  ...console,
  log: jest.fn(),
  debug: jest.fn(),
  info: jest.fn(),
  warn: jest.fn(),
  error: jest.fn(),
};

// ── Global test utilities (used by unit tests) ─────────────
global.testUtils = {
  createMockUser: (overrides = {}) => ({
    id: 1,
    name: 'Test User',
    email: 'test@example.com',
    password: '$2a$04$hashedpassword',
    role: 'user',
    created_at: new Date(),
    ...overrides,
  }),

  createMockAdmin: (overrides = {}) => ({
    id: 1,
    name: 'Admin User',
    email: 'admin@example.com',
    password: '$2a$04$hashedpassword',
    role: 'admin',
    created_at: new Date(),
    ...overrides,
  }),

  createMockProduct: (overrides = {}) => ({
    id: 1,
    name: 'Test Product',
    description: 'Test description',
    price: 100000,
    stock: 50,
    category_id: 1,
    image_url: null,
    created_at: new Date(),
    ...overrides,
  }),

  createMockCategory: (overrides = {}) => ({
    id: 1,
    name: 'Test Category',
    ...overrides,
  }),

  createMockOrder: (overrides = {}) => ({
    id: 1,
    user_id: 1,
    total: 130000,
    status: 'pending',
    shipping_fee: 30000,
    payment_method: 'cod',
    created_at: new Date(),
    ...overrides,
  }),

  generateTestToken: (payload = {}) => {
    const jwt = require('jsonwebtoken');
    const defaultPayload = { id: 1, email: 'test@example.com', role: 'user' };
    return jwt.sign({ ...defaultPayload, ...payload }, process.env.ACCESS_TOKEN_SECRET, {
      expiresIn: '1h',
    });
  },

  createMockRequest: (overrides = {}) => ({
    body: {},
    params: {},
    query: {},
    headers: {},
    user: null,
    ...overrides,
  }),

  createMockResponse: () => {
    const res = {};
    res.status = jest.fn().mockReturnValue(res);
    res.json = jest.fn().mockReturnValue(res);
    res.send = jest.fn().mockReturnValue(res);
    return res;
  },

  createMockNext: () => jest.fn(),
};

// ── Timeout ────────────────────────────────────────────────
jest.setTimeout(30000);

// ── DB lifecycle — init pool + run migrations once, close after all suites ─
const dbHelper = require('./helpers/db.helper');

beforeAll(async () => {
  try {
    await dbHelper.initDB();
    await dbHelper.runMigrations();
  } catch {
    // DB not available (e.g. unit-test-only run) — that's OK
  }
});

afterAll(async () => {
  try {
    await dbHelper.closeDB();
  } catch {
    // ignore
  }
});
