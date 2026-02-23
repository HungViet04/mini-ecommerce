/**
 * User Repository Tests
 * Comprehensive tests for user database operations
 */

jest.mock('../../../src/config/database', () => ({
  query: jest.fn(),
}));

const database = require('../../../src/config/database');
const userRepository = require('../../../src/repositories/user.repository');

describe('UserRepository', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    database.query.mockReset();
  });

  describe('getSelectColumns', () => {
    it('should return correct columns', () => {
      const columns = userRepository.getSelectColumns();
      expect(columns).toContain('id');
      expect(columns).toContain('name');
      expect(columns).toContain('email');
      expect(columns).toContain('password');
      expect(columns).toContain('role');
      expect(columns).toContain('created_at');
    });
  });

  describe('findByEmail', () => {
    it('should find user by email (case insensitive)', async () => {
      const mockUser = { id: 1, email: 'test@example.com', name: 'Test' };
      database.query.mockResolvedValueOnce([[mockUser]]);

      const result = await userRepository.findByEmail('TEST@EXAMPLE.COM');

      expect(result).toEqual(mockUser);
      expect(database.query).toHaveBeenCalledWith(
        expect.any(String),
        expect.arrayContaining(['test@example.com'])
      );
    });

    it('should return null when user not found', async () => {
      database.query.mockResolvedValueOnce([[]]);

      const result = await userRepository.findByEmail('notfound@example.com');

      expect(result).toBeNull();
    });

    it('should lowercase email before query', async () => {
      database.query.mockResolvedValueOnce([[]]);

      await userRepository.findByEmail('User@Example.COM');

      expect(database.query).toHaveBeenCalledWith(
        expect.any(String),
        expect.arrayContaining(['user@example.com'])
      );
    });
  });

  describe('findByIdentifier', () => {
    it('should find user by email', async () => {
      const mockUser = { id: 1, email: 'user@test.com', name: 'User' };
      database.query.mockResolvedValueOnce([[mockUser]]);

      const result = await userRepository.findByIdentifier('user@test.com');

      expect(result).toEqual(mockUser);
      expect(database.query).toHaveBeenCalledWith(
        expect.stringContaining('WHERE email = ? OR name = ?'),
        ['user@test.com', 'user@test.com']
      );
    });

    it('should find user by username', async () => {
      const mockUser = { id: 1, email: 'user@test.com', name: 'johndoe' };
      database.query.mockResolvedValueOnce([[mockUser]]);

      const result = await userRepository.findByIdentifier('johndoe');

      expect(result).toEqual(mockUser);
    });

    it('should return null when no match', async () => {
      database.query.mockResolvedValueOnce([[]]);

      const result = await userRepository.findByIdentifier('nonexistent');

      expect(result).toBeNull();
    });

    it('should return first match if multiple users', async () => {
      const mockUsers = [
        { id: 1, email: 'test@test.com', name: 'test' },
        { id: 2, email: 'test2@test.com', name: 'test' },
      ];
      database.query.mockResolvedValueOnce([mockUsers]);

      const result = await userRepository.findByIdentifier('test');

      expect(result.id).toBe(1);
    });

    it('should include password in result for auth', async () => {
      const mockUser = { id: 1, email: 'test@test.com', password: 'hashedpassword' };
      database.query.mockResolvedValueOnce([[mockUser]]);

      const result = await userRepository.findByIdentifier('test@test.com');

      expect(result.password).toBe('hashedpassword');
    });
  });

  describe('emailExists', () => {
    it('should return true when email exists', async () => {
      database.query.mockResolvedValueOnce([[{ count: 1 }]]);

      const result = await userRepository.emailExists('existing@test.com');

      expect(result).toBe(true);
    });

    it('should return false when email does not exist', async () => {
      database.query.mockResolvedValueOnce([[{ count: 0 }]]);

      const result = await userRepository.emailExists('new@test.com');

      expect(result).toBe(false);
    });

    it('should lowercase email', async () => {
      database.query.mockResolvedValueOnce([[{ count: 0 }]]);

      await userRepository.emailExists('USER@TEST.COM');

      expect(database.query).toHaveBeenCalledWith(
        expect.any(String),
        expect.arrayContaining(['user@test.com'])
      );
    });
  });

  describe('createUser', () => {
    it('should create user with all fields', async () => {
      const userData = {
        name: 'New User',
        email: 'NEW@TEST.COM',
        password: 'hashedpassword',
        role: 'user',
      };

      database.query.mockResolvedValueOnce([{ insertId: 1 }]);
      database.query.mockResolvedValueOnce([[{ id: 1, ...userData, email: 'new@test.com' }]]);

      const result = await userRepository.createUser(userData);

      expect(result.id).toBe(1);
      expect(result.email).toBe('new@test.com'); // lowercase
    });

    it('should use default role if not provided', async () => {
      const userData = {
        name: 'New User',
        email: 'user@test.com',
        password: 'hashedpassword',
      };

      database.query.mockResolvedValueOnce([{ insertId: 1 }]);
      database.query.mockResolvedValueOnce([[{ id: 1, ...userData, role: 'user' }]]);

      const result = await userRepository.createUser(userData);

      expect(result.role).toBe('user');
    });

    it('should lowercase email before saving', async () => {
      const userData = {
        name: 'Test',
        email: 'USER@EXAMPLE.COM',
        password: 'hash',
      };

      database.query.mockResolvedValueOnce([{ insertId: 1 }]);
      database.query.mockResolvedValueOnce([[{ id: 1, email: 'user@example.com' }]]);

      await userRepository.createUser(userData);

      expect(database.query).toHaveBeenCalledWith(
        expect.stringContaining('INSERT INTO'),
        expect.arrayContaining(['user@example.com'])
      );
    });

    it('should create admin user', async () => {
      const userData = {
        name: 'Admin User',
        email: 'admin@test.com',
        password: 'hashedpassword',
        role: 'admin',
      };

      database.query.mockResolvedValueOnce([{ insertId: 1 }]);
      database.query.mockResolvedValueOnce([[{ id: 1, ...userData }]]);

      const result = await userRepository.createUser(userData);

      expect(result.role).toBe('admin');
    });
  });

  describe('updatePassword', () => {
    it('should update user password', async () => {
      database.query.mockResolvedValueOnce([{ affectedRows: 1 }]);
      database.query.mockResolvedValueOnce([[{ id: 1 }]]);

      await userRepository.updatePassword(1, 'newhashedpassword');

      expect(database.query).toHaveBeenCalledWith(
        expect.stringContaining('UPDATE'),
        expect.arrayContaining(['newhashedpassword', 1])
      );
    });

    it('should only update password field', async () => {
      database.query.mockResolvedValueOnce([{ affectedRows: 1 }]);
      database.query.mockResolvedValueOnce([[{ id: 1 }]]);

      await userRepository.updatePassword(1, 'newhash');

      expect(database.query).toHaveBeenCalledWith(
        expect.stringContaining('password'),
        expect.any(Array)
      );
    });
  });

  describe('findByRole', () => {
    it('should find users by role', async () => {
      const mockUsers = [
        { id: 1, name: 'Admin 1', role: 'admin' },
        { id: 2, name: 'Admin 2', role: 'admin' },
      ];
      database.query.mockResolvedValueOnce([mockUsers]);

      const result = await userRepository.findByRole('admin');

      expect(result).toEqual(mockUsers);
      expect(database.query).toHaveBeenCalledWith(
        expect.stringContaining('role'),
        expect.arrayContaining(['admin'])
      );
    });

    it('should return empty array for no matches', async () => {
      database.query.mockResolvedValueOnce([[]]);

      const result = await userRepository.findByRole('superadmin');

      expect(result).toEqual([]);
    });

    it('should apply options', async () => {
      database.query.mockResolvedValueOnce([[]]);

      await userRepository.findByRole('user', { limit: 10, orderBy: 'name' });

      expect(database.query).toHaveBeenCalledWith(
        expect.stringContaining('ORDER BY'),
        expect.any(Array)
      );
    });
  });

  describe('update', () => {
    it('should update user fields', async () => {
      database.query.mockResolvedValueOnce([{ affectedRows: 1 }]);
      database.query.mockResolvedValueOnce([[{ id: 1, name: 'Updated Name' }]]);

      const result = await userRepository.update(1, { name: 'Updated Name' });

      expect(result.name).toBe('Updated Name');
    });

    it('should update role', async () => {
      database.query.mockResolvedValueOnce([{ affectedRows: 1 }]);
      database.query.mockResolvedValueOnce([[{ id: 1, role: 'admin' }]]);

      const result = await userRepository.update(1, { role: 'admin' });

      expect(result.role).toBe('admin');
    });
  });

  describe('delete', () => {
    it('should delete user by ID', async () => {
      database.query.mockResolvedValueOnce([{ affectedRows: 1 }]);

      const result = await userRepository.delete(1);

      expect(result).toBe(true);
      expect(database.query).toHaveBeenCalledWith(expect.stringContaining('DELETE FROM'), [1]);
    });

    it('should return false when user not found', async () => {
      database.query.mockResolvedValueOnce([{ affectedRows: 0 }]);

      const result = await userRepository.delete(999);

      expect(result).toBe(false);
    });
  });

  describe('findById', () => {
    it('should find user by ID', async () => {
      const mockUser = { id: 1, name: 'User', email: 'user@test.com', role: 'user' };
      database.query.mockResolvedValueOnce([[mockUser]]);

      const result = await userRepository.findById(1);

      expect(result).toEqual(mockUser);
    });

    it('should return null for non-existent user', async () => {
      database.query.mockResolvedValueOnce([[]]);

      const result = await userRepository.findById(999);

      expect(result).toBeNull();
    });
  });

  describe('count', () => {
    it('should count all users', async () => {
      database.query.mockResolvedValueOnce([[{ count: 100 }]]);

      const result = await userRepository.count();

      expect(result).toBe(100);
    });

    it('should count users by condition', async () => {
      database.query.mockResolvedValueOnce([[{ count: 5 }]]);

      const result = await userRepository.count({ role: 'admin' });

      expect(result).toBe(5);
    });
  });
});

