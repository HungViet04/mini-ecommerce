/**
 * Order Controller Integration Tests
 * Uses a real MySQL database — no mocks.
 */
const request = require('supertest');
const jwt = require('jsonwebtoken');
const app = require('../../src/app');
const { cleanDB, seedTestData } = require('../helpers/db.helper');

describe('Order Controller', () => {
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

  // Valid shipping info matching the validator
  const validShippingInfo = {
    fullName: 'Nguyen Van A',
    phone: '0901234567',
    province: 'Ho Chi Minh',
    district: 'Quan 1',
    ward: 'Phuong Ben Nghe',
    address: '123 ABC Street',
  };

  // ─── Create ────────────────────────────────────────────
  describe('POST /api/v1/orders', () => {
    it('should create order for authenticated user', async () => {
      const res = await request(app)
        .post('/api/v1/orders')
        .set('Authorization', `Bearer ${userToken}`)
        .send({
          items: [{ productId: seed.products[0].id, quantity: 1 }],
          shippingInfo: validShippingInfo,
          paymentMethod: 'cod',
        });

      expect(res.status).toBe(201);
      expect(res.body.success).toBe(true);
      expect(res.body.data).toHaveProperty('id');
      expect(res.body.data).toHaveProperty('status', 'pending');
    });

    it('should return 401 without authentication', async () => {
      const res = await request(app)
        .post('/api/v1/orders')
        .send({
          items: [{ productId: seed.products[0].id, quantity: 1 }],
          shippingInfo: validShippingInfo,
          paymentMethod: 'cod',
        });
      expect(res.status).toBe(401);
    });

    it('should return 400 for empty items', async () => {
      const res = await request(app)
        .post('/api/v1/orders')
        .set('Authorization', `Bearer ${userToken}`)
        .send({ items: [], shippingInfo: validShippingInfo, paymentMethod: 'cod' });
      expect(res.status).toBe(400);
    });
  });

  // ─── My orders ─────────────────────────────────────────
  describe('GET /api/v1/orders/my', () => {
    it('should return user orders', async () => {
      const res = await request(app)
        .get('/api/v1/orders/my')
        .set('Authorization', `Bearer ${userToken}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(Array.isArray(res.body.data)).toBe(true);
    });

    it('should return 401 without authentication', async () => {
      const res = await request(app).get('/api/v1/orders/my');
      expect(res.status).toBe(401);
    });
  });

  // ─── Get by ID ─────────────────────────────────────────
  describe('GET /api/v1/orders/:id', () => {
    let orderId;

    beforeAll(async () => {
      // Create an order owned by the user
      const create = await request(app)
        .post('/api/v1/orders')
        .set('Authorization', `Bearer ${userToken}`)
        .send({
          items: [{ productId: seed.products[1].id, quantity: 1 }],
          shippingInfo: validShippingInfo,
          paymentMethod: 'cod',
        });
      orderId = create.body.data.id;
    });

    it('should return order for owner', async () => {
      const res = await request(app)
        .get(`/api/v1/orders/${orderId}`)
        .set('Authorization', `Bearer ${userToken}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data).toHaveProperty('id', orderId);
    });

    it('should return order for admin', async () => {
      const res = await request(app)
        .get(`/api/v1/orders/${orderId}`)
        .set('Authorization', `Bearer ${adminToken}`);

      expect(res.status).toBe(200);
    });

    it('should return 404 for non-existent order', async () => {
      const res = await request(app)
        .get('/api/v1/orders/99999')
        .set('Authorization', `Bearer ${userToken}`);
      expect(res.status).toBe(404);
    });
  });

  // ─── Update status (admin) ─────────────────────────────
  describe('PATCH /api/v1/orders/:id/status', () => {
    let orderId;

    beforeAll(async () => {
      const create = await request(app)
        .post('/api/v1/orders')
        .set('Authorization', `Bearer ${userToken}`)
        .send({
          items: [{ productId: seed.products[2].id, quantity: 1 }],
          shippingInfo: validShippingInfo,
          paymentMethod: 'cod',
        });
      orderId = create.body.data.id;
    });

    it('should update order status as admin', async () => {
      const res = await request(app)
        .patch(`/api/v1/orders/${orderId}/status`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ status: 'paid' });

      expect(res.status).toBe(200);
      expect(res.body.data).toHaveProperty('status', 'paid');
    });

    it('should return 403 for non-admin user', async () => {
      const res = await request(app)
        .patch(`/api/v1/orders/${orderId}/status`)
        .set('Authorization', `Bearer ${userToken}`)
        .send({ status: 'shipped' });
      expect(res.status).toBe(403);
    });

    it('should return 400 for invalid status transition', async () => {
      // orderId is currently 'paid', trying to go back to pending is invalid
      const res = await request(app)
        .patch(`/api/v1/orders/${orderId}/status`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ status: 'pending' });
      expect(res.status).toBe(400);
    });
  });

  // ─── Cancel ────────────────────────────────────────────
  describe('POST /api/v1/orders/:id/cancel', () => {
    let orderId;

    beforeAll(async () => {
      const create = await request(app)
        .post('/api/v1/orders')
        .set('Authorization', `Bearer ${userToken}`)
        .send({
          items: [{ productId: seed.products[2].id, quantity: 1 }],
          shippingInfo: validShippingInfo,
          paymentMethod: 'cod',
        });
      orderId = create.body.data.id;
    });

    it('should cancel pending order for owner', async () => {
      const res = await request(app)
        .post(`/api/v1/orders/${orderId}/cancel`)
        .set('Authorization', `Bearer ${userToken}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
    });
  });

  // ─── Admin list ────────────────────────────────────────
  describe('GET /api/v1/orders (admin)', () => {
    it('should return all orders for admin', async () => {
      const res = await request(app)
        .get('/api/v1/orders')
        .set('Authorization', `Bearer ${adminToken}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(Array.isArray(res.body.data)).toBe(true);
    });

    it('should return 403 for non-admin', async () => {
      const res = await request(app)
        .get('/api/v1/orders')
        .set('Authorization', `Bearer ${userToken}`);
      expect(res.status).toBe(403);
    });
  });
});
