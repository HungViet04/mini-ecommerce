/**
 * User Controller Unit Tests
 * Tests for user management HTTP request handling (Admin)
 */

// Mock dependencies
jest.mock('../../../src/services', () => ({
  userService: {
    findAll: jest.fn(),
    findById: jest.fn(),
    updateRole: jest.fn(),
    delete: jest.fn(),
  },
}));

jest.mock('../../../src/services/user.service', () => ({
  findAll: jest.fn(),
  findById: jest.fn(),
  updateRole: jest.fn(),
  delete: jest.fn(),
  getUserOrders: jest.fn(),
}));

jest.mock('../../../src/helpers', () => ({
  asyncHandler: (fn) => fn,
  response: {
    success: jest.fn((res, data) => res.status(200).json({ success: true, ...data })),
    paginated: jest.fn((res, data, pagination) =>
      res.status(200).json({ success: true, data, pagination })
    ),
  },
}));

const userService = require('../../../src/services/user.service');
const { response } = require('../../../src/helpers');
const userController = require('../../../src/controllers/user.controller');

describe('User Controller', () => {
  let req, res, next;

  beforeEach(() => {
    jest.clearAllMocks();

    req = {
      body: {},
      params: {},
      query: {},
      user: { id: 1, role: 'admin' },
    };

    res = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn().mockReturnThis(),
    };

    next = jest.fn();
  });

  describe('getAll', () => {
    it('should return all users with pagination', async () => {
      const users = {
        items: [
          { id: 1, name: 'User 1', email: 'user1@test.com', role: 'user' },
          { id: 2, name: 'User 2', email: 'user2@test.com', role: 'admin' },
        ],
        pagination: { page: 1, limit: 20, total: 2 },
      };

      userService.findAll.mockResolvedValueOnce(users);

      await userController.getAll(req, res, next);

      expect(userService.findAll).toHaveBeenCalled();
      expect(response.success).toHaveBeenCalled();
    });

    it('should filter by role', async () => {
      req.query = { role: 'admin' };
      userService.findAll.mockResolvedValueOnce({ items: [], pagination: {} });

      await userController.getAll(req, res, next);

      expect(userService.findAll).toHaveBeenCalledWith(expect.objectContaining({ role: 'admin' }));
    });

    it('should search by name or email', async () => {
      req.query = { search: 'john' };
      userService.findAll.mockResolvedValueOnce({ items: [], pagination: {} });

      await userController.getAll(req, res, next);

      expect(userService.findAll).toHaveBeenCalledWith(expect.objectContaining({ search: 'john' }));
    });

    it('should handle pagination params', async () => {
      req.query = { page: '2', limit: '50' };
      userService.findAll.mockResolvedValueOnce({ items: [], pagination: {} });

      await userController.getAll(req, res, next);

      expect(userService.findAll).toHaveBeenCalledWith(
        expect.objectContaining({ page: 2, limit: 50 })
      );
    });

    it('should handle service error', async () => {
      userService.findAll.mockRejectedValueOnce(new Error('Database error'));

      await expect(userController.getAll(req, res, next)).rejects.toThrow('Database error');
    });
  });

  describe('getById', () => {
    it('should return user by ID', async () => {
      const user = {
        id: 5,
        name: 'Test User',
        email: 'test@test.com',
        role: 'user',
        orderCount: 3,
        totalSpent: 500000,
      };

      req.params = { id: '5' };
      userService.findById.mockResolvedValueOnce(user);

      await userController.getById(req, res, next);

      expect(userService.findById).toHaveBeenCalledWith(5);
      expect(response.success).toHaveBeenCalled();
    });

    it('should handle user not found', async () => {
      req.params = { id: '999' };
      userService.findById.mockRejectedValueOnce(new Error('User not found'));

      await expect(userController.getById(req, res, next)).rejects.toThrow('User not found');
    });

    it('should parse string ID', async () => {
      req.params = { id: '42' };
      userService.findById.mockResolvedValueOnce({ id: 42 });

      await userController.getById(req, res, next);

      expect(userService.findById).toHaveBeenCalledWith(42);
    });
  });

  describe('updateRole', () => {
    it('should update user role', async () => {
      const updatedUser = { id: 5, name: 'Test', email: 'test@test.com', role: 'admin' };

      req.params = { id: '5' };
      req.body = { role: 'admin' };
      userService.updateRole.mockResolvedValueOnce(updatedUser);

      await userController.updateRole(req, res, next);

      expect(userService.updateRole).toHaveBeenCalledWith(5, 'admin', req.user);
      expect(response.success).toHaveBeenCalled();
    });

    it('should prevent changing own role', async () => {
      req.params = { id: '1' }; // Same as req.user.id
      req.body = { role: 'user' };
      userService.updateRole.mockRejectedValueOnce(new Error('Cannot change own role'));

      await expect(userController.updateRole(req, res, next)).rejects.toThrow(
        'Cannot change own role'
      );
    });

    it('should handle invalid role', async () => {
      req.params = { id: '5' };
      req.body = { role: 'superadmin' };
      userService.updateRole.mockRejectedValueOnce(new Error('Invalid role'));

      await expect(userController.updateRole(req, res, next)).rejects.toThrow('Invalid role');
    });

    it('should handle user not found', async () => {
      req.params = { id: '999' };
      req.body = { role: 'admin' };
      userService.updateRole.mockRejectedValueOnce(new Error('User not found'));

      await expect(userController.updateRole(req, res, next)).rejects.toThrow('User not found');
    });
  });

  describe('deleteUser', () => {
    it('should delete user successfully', async () => {
      req.params = { id: '5' };
      userService.delete.mockResolvedValueOnce({ message: 'User deleted' });

      await userController.deleteUser(req, res, next);

      expect(userService.delete).toHaveBeenCalledWith(5, req.user);
      expect(response.success).toHaveBeenCalled();
    });

    it('should prevent deleting self', async () => {
      req.params = { id: '1' }; // Same as req.user.id
      userService.delete.mockRejectedValueOnce(new Error('Cannot delete self'));

      await expect(userController.deleteUser(req, res, next)).rejects.toThrow('Cannot delete self');
    });

    it('should handle user with orders', async () => {
      req.params = { id: '5' };
      userService.delete.mockRejectedValueOnce(new Error('User has orders'));

      await expect(userController.deleteUser(req, res, next)).rejects.toThrow('User has orders');
    });

    it('should handle user not found', async () => {
      req.params = { id: '999' };
      userService.delete.mockRejectedValueOnce(new Error('User not found'));

      await expect(userController.deleteUser(req, res, next)).rejects.toThrow('User not found');
    });
  });
});
