/**
 * User Service Tests
 * Comprehensive tests for user management service
 */

// Mock database
jest.mock('../../../src/config/database', () => ({
  query: jest.fn(),
  transaction: jest.fn(),
}));

jest.mock('../../../src/repositories', () => ({
  userRepository: {
    findById: jest.fn(),
    update: jest.fn(),
    delete: jest.fn(),
  },
}));

const { userService } = require('../../../src/services');
const database = require('../../../src/config/database');
const { userRepository } = require('../../../src/repositories');
const { NotFoundError, ValidationError } = require('../../../src/errors');

describe('UserService', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('findAll', () => {
    it('should return paginated users with order stats', async () => {
      const mockUsers = [
        {
          id: 1,
          name: 'User 1',
          email: 'user1@test.com',
          role: 'user',
          created_at: new Date(),
          orderCount: '2',
          totalSpent: '500000',
        },
        {
          id: 2,
          name: 'User 2',
          email: 'user2@test.com',
          role: 'admin',
          created_at: new Date(),
          orderCount: '0',
          totalSpent: '0',
        },
      ];

      database.query
        .mockResolvedValueOnce([mockUsers]) // Main query
        .mockResolvedValueOnce([[{ total: 2 }]]); // Count query

      const result = await userService.findAll({ page: 1, limit: 20 });

      expect(result.items).toHaveLength(2);
      expect(result.total).toBe(2);
      expect(result.items[0].orderCount).toBe(2);
      expect(result.items[0].totalSpent).toBe(500000);
    });

    it('should filter users by role', async () => {
      const mockUsers = [
        {
          id: 1,
          name: 'Admin',
          email: 'admin@test.com',
          role: 'admin',
          created_at: new Date(),
          orderCount: '0',
          totalSpent: '0',
        },
      ];

      database.query.mockResolvedValueOnce([mockUsers]).mockResolvedValueOnce([[{ total: 1 }]]);

      const result = await userService.findAll({ role: 'admin' });

      expect(result.items).toHaveLength(1);
      expect(result.items[0].role).toBe('admin');
      expect(database.query).toHaveBeenCalledWith(
        expect.stringContaining('u.role = ?'),
        expect.arrayContaining(['admin'])
      );
    });

    it('should search users by name or email', async () => {
      const mockUsers = [
        {
          id: 1,
          name: 'John Doe',
          email: 'john@test.com',
          role: 'user',
          created_at: new Date(),
          orderCount: '1',
          totalSpent: '100000',
        },
      ];

      database.query.mockResolvedValueOnce([mockUsers]).mockResolvedValueOnce([[{ total: 1 }]]);

      const result = await userService.findAll({ search: 'john' });

      expect(result.items).toHaveLength(1);
      expect(database.query).toHaveBeenCalledWith(
        expect.stringContaining('(u.name LIKE ? OR u.email LIKE ?)'),
        expect.arrayContaining(['%john%', '%john%'])
      );
    });

    it('should handle empty result', async () => {
      database.query.mockResolvedValueOnce([[]]).mockResolvedValueOnce([[{ total: 0 }]]);

      const result = await userService.findAll({});

      expect(result.items).toHaveLength(0);
      expect(result.total).toBe(0);
    });

    it('should apply pagination correctly', async () => {
      const mockUsers = Array.from({ length: 30 }, (_, i) => ({
        id: i + 1,
        name: `User ${i + 1}`,
        email: `user${i + 1}@test.com`,
        role: 'user',
        created_at: new Date(),
        orderCount: '0',
        totalSpent: '0',
      }));

      database.query.mockResolvedValueOnce([mockUsers]).mockResolvedValueOnce([[{ total: 30 }]]);

      const result = await userService.findAll({ page: 2, limit: 10 });

      // Page 2 with limit 10 should return items 11-20
      expect(result.items).toHaveLength(10);
      expect(result.items[0].id).toBe(11);
    });

    it('should combine role and search filters', async () => {
      const mockUsers = [];

      database.query.mockResolvedValueOnce([mockUsers]).mockResolvedValueOnce([[{ total: 0 }]]);

      await userService.findAll({ role: 'admin', search: 'test' });

      expect(database.query).toHaveBeenCalledWith(
        expect.stringContaining('u.role = ?'),
        expect.arrayContaining(['admin', '%test%', '%test%'])
      );
    });

    it('should use default pagination values', async () => {
      database.query.mockResolvedValueOnce([[]]).mockResolvedValueOnce([[{ total: 0 }]]);

      await userService.findAll({});

      // Verify default page=1, limit=20 behavior
      expect(database.query).toHaveBeenCalled();
    });
  });

  describe('findById', () => {
    it('should return user with order stats by ID', async () => {
      const mockUser = {
        id: 1,
        name: 'Test User',
        email: 'test@test.com',
        role: 'user',
        created_at: new Date(),
        orderCount: '5',
        totalSpent: '1000000',
      };

      database.query.mockResolvedValueOnce([[mockUser]]);

      const result = await userService.findById(1);

      expect(result.id).toBe(1);
      expect(result.name).toBe('Test User');
      expect(result.orderCount).toBe(5);
      expect(result.totalSpent).toBe(1000000);
    });

    it('should throw NotFoundError when user does not exist', async () => {
      database.query.mockResolvedValueOnce([[]]);

      await expect(userService.findById(999)).rejects.toThrow(NotFoundError);
    });

    it('should handle user with no orders', async () => {
      const mockUser = {
        id: 1,
        name: 'New User',
        email: 'new@test.com',
        role: 'user',
        created_at: new Date(),
        orderCount: '0',
        totalSpent: '0',
      };

      database.query.mockResolvedValueOnce([[mockUser]]);

      const result = await userService.findById(1);

      expect(result.orderCount).toBe(0);
      expect(result.totalSpent).toBe(0);
    });
  });

  describe('updateRole', () => {
    const currentUser = { id: 1, role: 'admin' };

    it('should update user role successfully', async () => {
      const targetUser = { id: 2, name: 'User', email: 'user@test.com', role: 'user' };
      const updatedUser = {
        id: 2,
        name: 'User',
        email: 'user@test.com',
        role: 'admin',
        created_at: new Date(),
        orderCount: '0',
        totalSpent: '0',
      };

      userRepository.findById.mockResolvedValueOnce(targetUser);
      userRepository.update.mockResolvedValueOnce({ ...targetUser, role: 'admin' });
      database.query.mockResolvedValueOnce([[updatedUser]]);

      const result = await userService.updateRole(2, 'admin', currentUser);

      expect(userRepository.update).toHaveBeenCalledWith(2, { role: 'admin' });
      expect(result.role).toBe('admin');
    });

    it('should throw ValidationError for invalid role', async () => {
      await expect(userService.updateRole(2, 'superadmin', currentUser)).rejects.toThrow(
        ValidationError
      );
    });

    it('should throw ValidationError when trying to change own role', async () => {
      const adminUser = { id: 1, role: 'admin' };

      await expect(userService.updateRole(1, 'user', adminUser)).rejects.toThrow(ValidationError);
    });

    it('should throw NotFoundError for non-existent user', async () => {
      userRepository.findById.mockResolvedValueOnce(null);

      await expect(userService.updateRole(999, 'admin', currentUser)).rejects.toThrow(
        NotFoundError
      );
    });

    it('should allow changing user to admin', async () => {
      const targetUser = { id: 2, role: 'user' };
      const updatedUser = {
        id: 2,
        name: 'User',
        email: 'user@test.com',
        role: 'admin',
        created_at: new Date(),
        orderCount: '0',
        totalSpent: '0',
      };

      userRepository.findById.mockResolvedValueOnce(targetUser);
      userRepository.update.mockResolvedValueOnce({ ...targetUser, role: 'admin' });
      database.query.mockResolvedValueOnce([[updatedUser]]);

      const result = await userService.updateRole(2, 'admin', currentUser);
      expect(result.role).toBe('admin');
    });

    it('should allow changing admin to user', async () => {
      const targetUser = { id: 2, role: 'admin' };
      const updatedUser = {
        id: 2,
        name: 'Admin User',
        email: 'admin@test.com',
        role: 'user',
        created_at: new Date(),
        orderCount: '0',
        totalSpent: '0',
      };

      userRepository.findById.mockResolvedValueOnce(targetUser);
      userRepository.update.mockResolvedValueOnce({ ...targetUser, role: 'user' });
      database.query.mockResolvedValueOnce([[updatedUser]]);

      const result = await userService.updateRole(2, 'user', currentUser);
      expect(result.role).toBe('user');
    });
  });

  describe('delete', () => {
    const currentUser = { id: 1, role: 'admin' };

    it('should delete user successfully', async () => {
      const targetUser = { id: 2, name: 'User', email: 'user@test.com' };

      userRepository.findById.mockResolvedValueOnce(targetUser);
      database.query.mockResolvedValueOnce([[{ count: 0 }]]); // No orders
      userRepository.delete.mockResolvedValueOnce(true);

      const result = await userService.delete(2, currentUser);

      expect(result.message).toBe('Xóa user thành công');
      expect(result.userId).toBe(2);
      expect(userRepository.delete).toHaveBeenCalledWith(2);
    });

    it('should throw ValidationError when trying to delete self', async () => {
      await expect(userService.delete(1, currentUser)).rejects.toThrow(ValidationError);
    });

    it('should throw NotFoundError for non-existent user', async () => {
      userRepository.findById.mockResolvedValueOnce(null);

      await expect(userService.delete(999, currentUser)).rejects.toThrow(NotFoundError);
    });

    it('should throw ValidationError when user has orders', async () => {
      const targetUser = { id: 2, name: 'User', email: 'user@test.com' };

      userRepository.findById.mockResolvedValueOnce(targetUser);
      database.query.mockResolvedValueOnce([[{ count: 5 }]]); // Has orders

      await expect(userService.delete(2, currentUser)).rejects.toThrow(ValidationError);
    });

    it('should check order count before deleting', async () => {
      const targetUser = { id: 2, name: 'User', email: 'user@test.com' };

      userRepository.findById.mockResolvedValueOnce(targetUser);
      database.query.mockResolvedValueOnce([[{ count: 0 }]]);
      userRepository.delete.mockResolvedValueOnce(true);

      await userService.delete(2, currentUser);

      expect(database.query).toHaveBeenCalledWith(
        expect.stringContaining('SELECT COUNT(*) as count FROM orders WHERE user_id = ?'),
        [2]
      );
    });
  });
});
