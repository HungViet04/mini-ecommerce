/**
 * User Service Tests
 * Tests for real userService (src/services/user.service.js)
 */
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { userService } from '../../src/services/user.service';
import httpClient from '../../src/services/http.client';

vi.mock('../../src/services/http.client', () => ({
  default: {
    get: vi.fn(),
    post: vi.fn(),
    put: vi.fn(),
    patch: vi.fn(),
    delete: vi.fn(),
    addRequestInterceptor: vi.fn(),
    addResponseInterceptor: vi.fn(),
  },
}));

describe('UserService', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('getAll', () => {
    it('should call GET /users without params', async () => {
      httpClient.get.mockResolvedValueOnce({ data: [] });

      await userService.getAll();

      expect(httpClient.get).toHaveBeenCalledWith('/users');
    });

    it('should append query params when provided', async () => {
      httpClient.get.mockResolvedValueOnce({ data: [] });

      await userService.getAll({ page: 2, limit: 10, role: 'admin', search: 'test' });

      const calledUrl = httpClient.get.mock.calls[0][0];
      expect(calledUrl).toContain('page=2');
      expect(calledUrl).toContain('limit=10');
      expect(calledUrl).toContain('role=admin');
      expect(calledUrl).toContain('search=test');
    });

    it('should skip undefined params', async () => {
      httpClient.get.mockResolvedValueOnce({ data: [] });

      await userService.getAll({ page: 1 });

      expect(httpClient.get).toHaveBeenCalledWith('/users?page=1');
    });

    it('should return data from response', async () => {
      const users = [{ id: 1, name: 'Test' }];
      httpClient.get.mockResolvedValueOnce({ data: users });

      const result = await userService.getAll();
      expect(result).toEqual(users);
    });
  });

  describe('getById', () => {
    it('should call GET /users/:id', async () => {
      httpClient.get.mockResolvedValueOnce({ data: { id: 5, name: 'User' } });

      const result = await userService.getById(5);

      expect(httpClient.get).toHaveBeenCalledWith('/users/5');
      expect(result.id).toBe(5);
    });

    it('should propagate errors', async () => {
      httpClient.get.mockRejectedValueOnce(new Error('Not found'));

      await expect(userService.getById(999)).rejects.toThrow('Not found');
    });
  });

  describe('getUserOrders', () => {
    it('should call GET /users/:id/orders', async () => {
      httpClient.get.mockResolvedValueOnce({ data: [{ id: 1 }] });

      const result = await userService.getUserOrders(3);

      expect(httpClient.get).toHaveBeenCalledWith('/users/3/orders');
      expect(result).toEqual([{ id: 1 }]);
    });
  });

  describe('updateRole', () => {
    it('should call PATCH /users/:id/role', async () => {
      httpClient.patch.mockResolvedValueOnce({ data: { id: 2, role: 'admin' } });

      const result = await userService.updateRole(2, 'admin');

      expect(httpClient.patch).toHaveBeenCalledWith('/users/2/role', { role: 'admin' });
      expect(result.role).toBe('admin');
    });

    it('should propagate errors for invalid role', async () => {
      httpClient.patch.mockRejectedValueOnce(new Error('Invalid role'));

      await expect(userService.updateRole(1, 'superadmin')).rejects.toThrow('Invalid role');
    });
  });

  describe('delete', () => {
    it('should call DELETE /users/:id', async () => {
      httpClient.delete.mockResolvedValueOnce({ data: { message: 'Deleted' } });

      const result = await userService.delete(4);

      expect(httpClient.delete).toHaveBeenCalledWith('/users/4');
      expect(result.message).toBe('Deleted');
    });

    it('should propagate errors', async () => {
      httpClient.delete.mockRejectedValueOnce(new Error('Cannot delete'));

      await expect(userService.delete(1)).rejects.toThrow('Cannot delete');
    });
  });

  describe('response handling', () => {
    it('should unwrap data property when present', async () => {
      httpClient.get.mockResolvedValueOnce({ data: { id: 1, name: 'Test' } });

      const result = await userService.getById(1);
      expect(result).toEqual({ id: 1, name: 'Test' });
    });

    it('should return response directly when no data wrapper', async () => {
      httpClient.get.mockResolvedValueOnce({ id: 1, name: 'Test' });

      const result = await userService.getById(1);
      expect(result).toEqual({ id: 1, name: 'Test' });
    });
  });
});

