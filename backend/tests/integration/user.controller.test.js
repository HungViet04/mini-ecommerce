/**
 * User Controller Integration Tests
 * Uses a real MySQL database — no mocks.
 */
const request = require('supertest');
const jwt = require('jsonwebtoken');
const app = require('../../src/app');
const database = require('../../src/config/database');
const { cleanDB, seedTestData } = require('../helpers/db.helper');

describe('User Controller', () => {
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

  // ─── List (admin) ─────────────────────────────────────
  describe('GET /api/v1/users', () => {
    it('should return paginated users for admin', async () => {
      const res = await request(app)
        .get('/api/v1/users')
        .set('Authorization', `Bearer ${adminToken}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data).toHaveProperty('items');
      expect(res.body.data.items.length).toBeGreaterThanOrEqual(2);
    });

    it('should reject non-admin users', async () => {
      const res = await request(app)
        .get('/api/v1/users')
        .set('Authorization', `Bearer ${userToken}`);
      expect(res.status).toBe(403);
    });

    it('should reject unauthenticated requests', async () => {
      const res = await request(app).get('/api/v1/users');
      expect(res.status).toBe(401);
    });

    it('should handle pagination', async () => {
      const res = await request(app)
        .get('/api/v1/users?page=1&limit=1')
        .set('Authorization', `Bearer ${adminToken}`);

      expect(res.status).toBe(200);
      expect(res.body.data.items.length).toBeLessThanOrEqual(1);
    });
  });

  // ─── Get by ID ─────────────────────────────────────────
  describe('GET /api/v1/users/:id', () => {
    it('should return user by ID', async () => {
      const res = await request(app)
        .get(`/api/v1/users/${seed.user.id}`)
        .set('Authorization', `Bearer ${adminToken}`);

      expect(res.status).toBe(200);
      expect(res.body.data).toHaveProperty('id', seed.user.id);
      expect(res.body.data).toHaveProperty('email', seed.user.email);
    });

    it('should return 404 for non-existent user', async () => {
      const res = await request(app)
        .get('/api/v1/users/99999')
        .set('Authorization', `Bearer ${adminToken}`);
      expect(res.status).toBe(404);
    });
  });

  // ─── Update role ───────────────────────────────────────
  describe('PATCH /api/v1/users/:id/role', () => {
    let targetUserId;

    beforeAll(async () => {
      // Create an extra throwaway user for role-change tests
      const bcrypt = require('bcryptjs');
      const hash = await bcrypt.hash('Pass1234', 4);
      const [r] = await database.query(
        "INSERT INTO users (name, email, password, role) VALUES ('Extra', 'extra@test.com', ?, 'user')",
        [hash]
      );
      targetUserId = r.insertId;
    });

    it('should update user role', async () => {
      const res = await request(app)
        .patch(`/api/v1/users/${targetUserId}/role`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ role: 'admin' });

      expect(res.status).toBe(200);
      expect(res.body.data.role).toBe('admin');
    });

    it('should return 400 for invalid role', async () => {
      const res = await request(app)
        .patch(`/api/v1/users/${targetUserId}/role`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ role: 'superadmin' });

      expect(res.status).toBe(400);
    });

    it('should prevent changing own role', async () => {
      const res = await request(app)
        .patch(`/api/v1/users/${seed.admin.id}/role`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ role: 'user' });

      expect(res.status).toBe(400);
    });

    it('should return 404 for non-existent user', async () => {
      const res = await request(app)
        .patch('/api/v1/users/99999/role')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ role: 'admin' });

      expect(res.status).toBe(404);
    });
  });

  // ─── Delete ────────────────────────────────────────────
  describe('DELETE /api/v1/users/:id', () => {
    let deletableUserId;

    beforeAll(async () => {
      const bcrypt = require('bcryptjs');
      const hash = await bcrypt.hash('Pass1234', 4);
      const [r] = await database.query(
        "INSERT INTO users (name, email, password, role) VALUES ('Deletable', 'deletable@test.com', ?, 'user')",
        [hash]
      );
      deletableUserId = r.insertId;
    });

    it('should delete user without orders', async () => {
      const res = await request(app)
        .delete(`/api/v1/users/${deletableUserId}`)
        .set('Authorization', `Bearer ${adminToken}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
    });

    it('should prevent deleting self', async () => {
      const res = await request(app)
        .delete(`/api/v1/users/${seed.admin.id}`)
        .set('Authorization', `Bearer ${adminToken}`);

      expect(res.status).toBe(400);
    });

    it('should return 404 for non-existent user', async () => {
      const res = await request(app)
        .delete('/api/v1/users/99999')
        .set('Authorization', `Bearer ${adminToken}`);

      expect(res.status).toBe(404);
    });
  });
});
