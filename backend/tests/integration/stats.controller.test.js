/**
 * Stats Controller Integration Tests
 * Uses a real MySQL database — no mocks.
 */
const request = require('supertest');
const jwt = require('jsonwebtoken');
const app = require('../../src/app');
const { cleanDB, seedTestData } = require('../helpers/db.helper');

describe('Stats Controller', () => {
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

  describe('GET /api/v1/stats/dashboard', () => {
    it('should return all dashboard statistics for admin', async () => {
      const res = await request(app)
        .get('/api/v1/stats/dashboard')
        .set('Authorization', `Bearer ${adminToken}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data).toHaveProperty('orders');
      expect(res.body.data).toHaveProperty('revenue');
      expect(res.body.data).toHaveProperty('products');
      expect(res.body.data).toHaveProperty('users');
      expect(res.body.data).toHaveProperty('recentOrders');
      expect(res.body.data).toHaveProperty('topProducts');
      expect(res.body.data).toHaveProperty('monthlyRevenue');
    });

    it('should return correct product count', async () => {
      const res = await request(app)
        .get('/api/v1/stats/dashboard')
        .set('Authorization', `Bearer ${adminToken}`);

      // We seeded 3 products
      expect(res.body.data.products.total).toBeGreaterThanOrEqual(3);
    });

    it('should return correct user count', async () => {
      const res = await request(app)
        .get('/api/v1/stats/dashboard')
        .set('Authorization', `Bearer ${adminToken}`);

      // We seeded at least 2 users (admin + user)
      expect(res.body.data.users.total).toBeGreaterThanOrEqual(2);
    });

    it('should reject non-admin users', async () => {
      const res = await request(app)
        .get('/api/v1/stats/dashboard')
        .set('Authorization', `Bearer ${userToken}`);

      expect(res.status).toBe(403);
    });

    it('should reject unauthenticated requests', async () => {
      const res = await request(app).get('/api/v1/stats/dashboard');
      expect(res.status).toBe(401);
    });
  });
});
