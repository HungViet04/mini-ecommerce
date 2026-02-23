/**
 * Category Controller Integration Tests
 * Uses a real MySQL database — no mocks.
 */
const request = require('supertest');
const jwt = require('jsonwebtoken');
const app = require('../../src/app');
const { cleanDB, seedTestData } = require('../helpers/db.helper');

describe('Category Controller', () => {
  let seed, adminToken, userToken;

  beforeAll(async () => {
    await cleanDB();
    seed = await seedTestData();

    adminToken = jwt.sign({ id: seed.admin.id, role: 'admin' }, process.env.ACCESS_TOKEN_SECRET, {
      expiresIn: '1h',
    });
    userToken = jwt.sign({ id: seed.user.id, role: 'user' }, process.env.ACCESS_TOKEN_SECRET, {
      expiresIn: '1h',
    });
  });

  afterAll(async () => {
    await cleanDB();
  });

  // ─── List ──────────────────────────────────────────────
  describe('GET /api/v1/categories', () => {
    it('should return all categories', async () => {
      const res = await request(app).get('/api/v1/categories');

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.length).toBeGreaterThanOrEqual(2);
    });

    it('should work without authentication', async () => {
      const res = await request(app).get('/api/v1/categories');
      expect(res.status).toBe(200);
    });
  });

  // ─── Get by ID ─────────────────────────────────────────
  describe('GET /api/v1/categories/:id', () => {
    it('should return category by id', async () => {
      const res = await request(app).get(`/api/v1/categories/${seed.categories[0].id}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data).toHaveProperty('name', 'Electronics');
    });

    it('should return 404 for non-existent category', async () => {
      const res = await request(app).get('/api/v1/categories/99999');
      expect(res.status).toBe(404);
    });
  });

  // ─── Create ────────────────────────────────────────────
  describe('POST /api/v1/categories', () => {
    it('should create category as admin', async () => {
      const res = await request(app)
        .post('/api/v1/categories')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ name: 'Clothing' });

      expect(res.status).toBe(201);
      expect(res.body.success).toBe(true);
      expect(res.body.data).toHaveProperty('id');
      expect(res.body.data).toHaveProperty('name', 'Clothing');
    });

    it('should return 401 without authentication', async () => {
      const res = await request(app).post('/api/v1/categories').send({ name: 'Fail' });
      expect(res.status).toBe(401);
    });

    it('should return 403 for non-admin user', async () => {
      const res = await request(app)
        .post('/api/v1/categories')
        .set('Authorization', `Bearer ${userToken}`)
        .send({ name: 'Fail' });
      expect(res.status).toBe(403);
    });

    it('should return 400 for empty name', async () => {
      const res = await request(app)
        .post('/api/v1/categories')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ name: '' });
      expect(res.status).toBe(400);
    });

    it('should return 409 for duplicate name', async () => {
      const res = await request(app)
        .post('/api/v1/categories')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ name: 'Electronics' });
      expect(res.status).toBe(409);
    });
  });

  // ─── Update ────────────────────────────────────────────
  describe('PUT /api/v1/categories/:id', () => {
    it('should update category as admin', async () => {
      const res = await request(app)
        .put(`/api/v1/categories/${seed.categories[1].id}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ name: 'Updated Books' });

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.name).toBe('Updated Books');
    });

    it('should return 404 for non-existent category', async () => {
      const res = await request(app)
        .put('/api/v1/categories/99999')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ name: 'Nope' });
      expect(res.status).toBe(404);
    });

    it('should return 403 for non-admin user', async () => {
      const res = await request(app)
        .put(`/api/v1/categories/${seed.categories[0].id}`)
        .set('Authorization', `Bearer ${userToken}`)
        .send({ name: 'Hacked' });
      expect(res.status).toBe(403);
    });
  });

  // ─── Delete ────────────────────────────────────────────
  describe('DELETE /api/v1/categories/:id', () => {
    it('should return 403 for non-admin user', async () => {
      const res = await request(app)
        .delete(`/api/v1/categories/${seed.categories[0].id}`)
        .set('Authorization', `Bearer ${userToken}`);
      expect(res.status).toBe(403);
    });

    it('should delete category as admin', async () => {
      // Create a throwaway category to delete (so seed data stays intact)
      const create = await request(app)
        .post('/api/v1/categories')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ name: 'ToDelete' });

      const res = await request(app)
        .delete(`/api/v1/categories/${create.body.data.id}`)
        .set('Authorization', `Bearer ${adminToken}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
    });

    it('should return 404 for non-existent category', async () => {
      const res = await request(app)
        .delete('/api/v1/categories/99999')
        .set('Authorization', `Bearer ${adminToken}`);
      expect(res.status).toBe(404);
    });
  });
});
