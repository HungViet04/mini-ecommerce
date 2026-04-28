/**
 * Product Controller Integration Tests
 * Uses a real MySQL database — no mocks.
 */
const request = require('supertest');
const jwt = require('jsonwebtoken');
const app = require('../../src/app');
const { cleanDB, seedTestData } = require('../helpers/db.helper');

describe('Product Controller', () => {
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
  describe('GET /api/v1/products', () => {
    it('should return paginated products', async () => {
      const res = await request(app).get('/api/v1/products');

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.length).toBeGreaterThanOrEqual(3);
      expect(res.body).toHaveProperty('meta');
    });

    it('should accept pagination parameters', async () => {
      const res = await request(app).get('/api/v1/products').query({ page: 1, limit: 2 });

      expect(res.status).toBe(200);
      expect(res.body.data.length).toBeLessThanOrEqual(2);
      expect(res.body.meta.pagination).toHaveProperty('page', 1);
      expect(res.body.meta.pagination).toHaveProperty('limit', 2);
    });
  });

  // ─── Get by ID ─────────────────────────────────────────
  describe('GET /api/v1/products/:id', () => {
    it('should return product by id', async () => {
      const res = await request(app).get(`/api/v1/products/${seed.products[0].id}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data).toHaveProperty('name', 'Laptop');
    });

    it('should return 404 for non-existent product', async () => {
      const res = await request(app).get('/api/v1/products/99999');
      expect(res.status).toBe(404);
      expect(res.body.success).toBe(false);
    });
  });

  // ─── Create ────────────────────────────────────────────
  describe('POST /api/v1/products', () => {
    const validData = {
      name: 'Tablet',
      price: 5000000,
      stock: 15,
      category_id: null, // will be set in beforeAll
    };

    beforeAll(() => {
      validData.category_id = seed.categories[0].id;
    });

    it('should create product as admin', async () => {
      const res = await request(app)
        .post('/api/v1/products')
        .set('Authorization', `Bearer ${adminToken}`)
        .send(validData);

      expect(res.status).toBe(201);
      expect(res.body.success).toBe(true);
      expect(res.body.data).toHaveProperty('id');
      expect(res.body.data).toHaveProperty('name', 'Tablet');
    });

    it('should return 401 without authentication', async () => {
      const res = await request(app).post('/api/v1/products').send(validData);
      expect(res.status).toBe(401);
    });

    it('should return 403 for non-admin user', async () => {
      const res = await request(app)
        .post('/api/v1/products')
        .set('Authorization', `Bearer ${userToken}`)
        .send(validData);
      expect(res.status).toBe(403);
    });

    it('should return 400 for invalid data', async () => {
      const res = await request(app)
        .post('/api/v1/products')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ name: '' });
      expect(res.status).toBe(400);
    });
  });

  // ─── Update ────────────────────────────────────────────
  describe('PUT /api/v1/products/:id', () => {
    it('should update product as admin', async () => {
      const res = await request(app)
        .put(`/api/v1/products/${seed.products[0].id}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ name: 'Updated Laptop', price: 16000000 });

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.name).toBe('Updated Laptop');
    });

    it('should return 404 for non-existent product', async () => {
      const res = await request(app)
        .put('/api/v1/products/99999')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ name: 'Nope' });
      expect(res.status).toBe(404);
    });

    it('should return 403 for non-admin user', async () => {
      const res = await request(app)
        .put(`/api/v1/products/${seed.products[0].id}`)
        .set('Authorization', `Bearer ${userToken}`)
        .send({ name: 'Hacked' });
      expect(res.status).toBe(403);
    });
  });

  // ─── Delete ────────────────────────────────────────────
  describe('DELETE /api/v1/products/:id', () => {
    it('should return 403 for non-admin user', async () => {
      const res = await request(app)
        .delete(`/api/v1/products/${seed.products[2].id}`)
        .set('Authorization', `Bearer ${userToken}`);
      expect(res.status).toBe(403);
    });

    it('should delete product as admin', async () => {
      // Create a throwaway product to delete
      const create = await request(app)
        .post('/api/v1/products')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ name: 'ToDelete', price: 1000, stock: 1, category_id: seed.categories[0].id });

      const res = await request(app)
        .delete(`/api/v1/products/${create.body.data.id}`)
        .set('Authorization', `Bearer ${adminToken}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
    });

    it('should return 404 for non-existent product', async () => {
      const res = await request(app)
        .delete('/api/v1/products/99999')
        .set('Authorization', `Bearer ${adminToken}`);
      expect(res.status).toBe(404);
    });
  });

  // ─── Search ────────────────────────────────────────────
  describe('GET /api/v1/products/search', () => {
    it('should return search results', async () => {
      const res = await request(app).get('/api/v1/products/search').query({ q: 'Phone' });

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(Array.isArray(res.body.data)).toBe(true);
    });
  });
});
