/**
 * Auth Controller Integration Tests
 * Uses a real MySQL database — no mocks.
 */
const request = require('supertest');
const jwt = require('jsonwebtoken');
const app = require('../../src/app');
const { cleanDB, seedTestData, TEST_PASSWORD } = require('../helpers/db.helper');

describe('Auth Controller', () => {
  let seed;

  beforeAll(async () => {
    await cleanDB();
    seed = await seedTestData();
  });

  afterAll(async () => {
    await cleanDB();
  });

  // ─── Register ──────────────────────────────────────────
  describe('POST /api/v1/auth/register', () => {
    it('should register a new user successfully', async () => {
      const res = await request(app).post('/api/v1/auth/register').send({
        name: 'New User',
        email: 'newuser@test.com',
        password: 'Password123',
      });

      expect(res.status).toBe(201);
      expect(res.body.success).toBe(true);
      expect(res.body.data).toHaveProperty('id');
      expect(res.body.data).toHaveProperty('email', 'newuser@test.com');
      expect(res.body.data).not.toHaveProperty('password');
    });

    it('should return 409 for duplicate email', async () => {
      const res = await request(app).post('/api/v1/auth/register').send({
        name: 'Duplicate',
        email: seed.admin.email,
        password: 'Password123',
      });

      expect(res.status).toBe(409);
      expect(res.body.success).toBe(false);
    });

    it('should return 400 for invalid data', async () => {
      const res = await request(app).post('/api/v1/auth/register').send({
        name: '',
        email: 'bad',
        password: '1',
      });

      expect(res.status).toBe(400);
      expect(res.body.success).toBe(false);
    });
  });

  // ─── Login ─────────────────────────────────────────────
  describe('POST /api/v1/auth/login', () => {
    it('should login successfully with correct credentials', async () => {
      const res = await request(app).post('/api/v1/auth/login').send({
        identifier: seed.user.email,
        password: TEST_PASSWORD,
      });

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data).toHaveProperty('accessToken');
      expect(res.body.data.user).toHaveProperty('id', seed.user.id);
    });

    it('should return 401 for wrong password', async () => {
      const res = await request(app).post('/api/v1/auth/login').send({
        identifier: seed.user.email,
        password: 'WrongPassword999',
      });

      expect(res.status).toBe(401);
      expect(res.body.success).toBe(false);
    });

    it('should return 400 for missing fields', async () => {
      const res = await request(app).post('/api/v1/auth/login').send({});

      expect(res.status).toBe(400);
    });
  });

  // ─── Profile ───────────────────────────────────────────
  describe('GET /api/v1/auth/profile', () => {
    it('should return profile for authenticated user', async () => {
      const token = jwt.sign({ id: seed.user.id, role: 'user' }, process.env.ACCESS_TOKEN_SECRET, {
        expiresIn: '1h',
      });

      const res = await request(app)
        .get('/api/v1/auth/profile')
        .set('Authorization', `Bearer ${token}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data).toHaveProperty('email', seed.user.email);
      expect(res.body.data).not.toHaveProperty('password');
    });

    it('should return 401 without token', async () => {
      const res = await request(app).get('/api/v1/auth/profile');
      expect(res.status).toBe(401);
    });

    it('should return 401 with invalid token', async () => {
      const res = await request(app)
        .get('/api/v1/auth/profile')
        .set('Authorization', 'Bearer invalid-token');

      expect(res.status).toBe(401);
    });
  });

  // ─── Change password ──────────────────────────────────
  describe('PUT /api/v1/auth/password', () => {
    it('should return 401 without token', async () => {
      const res = await request(app).put('/api/v1/auth/password').send({
        currentPassword: TEST_PASSWORD,
        newPassword: 'NewPass123',
      });

      expect(res.status).toBe(401);
    });

    it('should change password with correct current password', async () => {
      const token = jwt.sign({ id: seed.user.id, role: 'user' }, process.env.ACCESS_TOKEN_SECRET, {
        expiresIn: '1h',
      });

      const res = await request(app)
        .put('/api/v1/auth/password')
        .set('Authorization', `Bearer ${token}`)
        .send({
          currentPassword: TEST_PASSWORD,
          newPassword: 'NewPass123',
        });

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
    });
  });
});
