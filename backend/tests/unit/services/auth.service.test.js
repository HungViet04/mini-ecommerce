/**
 * Auth Service Tests
 * Tests for authentication service
 */
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

// Mock dependencies
jest.mock('../../../src/repositories', () => ({
  userRepository: {
    findByEmail: jest.fn(),
    findByIdentifier: jest.fn(),
    findByIdOrFail: jest.fn(),
    createUser: jest.fn(),
    update: jest.fn(),
    updatePassword: jest.fn(),
  },
}));

jest.mock('../../../src/config', () => ({
  jwt: {
    accessSecret: 'test-secret',
    accessExpiresIn: '1h',
  },
  bcrypt: {
    saltRounds: 4,
  },
}));

const { authService } = require('../../../src/services');
const { userRepository } = require('../../../src/repositories');
const { AuthenticationError, ConflictError, ValidationError } = require('../../../src/errors');

describe('AuthService', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('register', () => {
    const validRegisterData = {
      name: 'NguyềE Văn A',
      email: 'test@example.com',
      password: 'password123',
    };

    it('should register a new user successfully', async () => {
      const createdUser = {
        id: 1,
        name: 'NguyềE Văn A',
        email: 'test@example.com',
        password: 'hashedpassword',
        role: 'user',
        created_at: new Date(),
      };

      userRepository.findByEmail.mockResolvedValue(null);
      userRepository.createUser.mockResolvedValue(createdUser);

      const result = await authService.register(validRegisterData);

      expect(userRepository.findByEmail).toHaveBeenCalledWith('test@example.com');
      expect(userRepository.createUser).toHaveBeenCalled();
      expect(result).not.toHaveProperty('password');
      expect(result).toHaveProperty('id', 1);
      expect(result).toHaveProperty('email', 'test@example.com');
    });

    it('should throw ConflictError if email already exists', async () => {
      const existingUser = {
        id: 1,
        email: 'test@example.com',
      };

      userRepository.findByEmail.mockResolvedValue(existingUser);

      await expect(authService.register(validRegisterData)).rejects.toThrow(ConflictError);

      expect(userRepository.createUser).not.toHaveBeenCalled();
    });

    it('should throw ValidationError for invalid data', async () => {
      const invalidData = {
        name: '',
        email: 'invalid',
        password: '123',
      };

      await expect(authService.register(invalidData)).rejects.toThrow(ValidationError);
    });

    it('should hash password before saving', async () => {
      const createdUser = {
        id: 1,
        name: 'Test',
        email: 'test@example.com',
        password: 'hashedpassword',
        role: 'user',
      };

      userRepository.findByEmail.mockResolvedValue(null);
      userRepository.createUser.mockResolvedValue(createdUser);

      await authService.register(validRegisterData);

      expect(userRepository.createUser).toHaveBeenCalledWith(
        expect.objectContaining({
          password: expect.not.stringMatching(validRegisterData.password),
        })
      );
    });

    it('should set role to user by default', async () => {
      const createdUser = {
        id: 1,
        name: 'Test',
        email: 'test@example.com',
        password: 'hashedpassword',
        role: 'user',
      };

      userRepository.findByEmail.mockResolvedValue(null);
      userRepository.createUser.mockResolvedValue(createdUser);

      await authService.register(validRegisterData);

      expect(userRepository.createUser).toHaveBeenCalledWith(
        expect.objectContaining({
          role: 'user',
        })
      );
    });
  });

  describe('login', () => {
    const validLoginData = {
      identifier: 'test@example.com',
      password: 'password123',
    };

    it('should login successfully with valid credentials', async () => {
      const hashedPassword = await bcrypt.hash('password123', 4);
      const user = {
        id: 1,
        name: 'Test User',
        email: 'test@example.com',
        password: hashedPassword,
        role: 'user',
      };

      userRepository.findByIdentifier.mockResolvedValue(user);

      const result = await authService.login(validLoginData);

      expect(result).toHaveProperty('accessToken');
      expect(result).toHaveProperty('user');
      expect(result.user).toHaveProperty('id', 1);
      expect(result.user).toHaveProperty('email', 'test@example.com');
      expect(result.user).not.toHaveProperty('password');
    });

    it('should throw AuthenticationError if user not found', async () => {
      userRepository.findByIdentifier.mockResolvedValue(null);

      await expect(authService.login(validLoginData)).rejects.toThrow(AuthenticationError);
    });

    it('should throw AuthenticationError if password is incorrect', async () => {
      const user = {
        id: 1,
        email: 'test@example.com',
        password: await bcrypt.hash('differentpassword', 4),
        role: 'user',
      };

      userRepository.findByIdentifier.mockResolvedValue(user);

      await expect(authService.login(validLoginData)).rejects.toThrow(AuthenticationError);
    });

    it('should throw ValidationError for invalid data', async () => {
      const invalidData = {
        identifier: '',
        password: '',
      };

      await expect(authService.login(invalidData)).rejects.toThrow(ValidationError);
    });

    it('should generate valid JWT token', async () => {
      const hashedPassword = await bcrypt.hash('password123', 4);
      const user = {
        id: 1,
        name: 'Test User',
        email: 'test@example.com',
        password: hashedPassword,
        role: 'user',
      };

      userRepository.findByIdentifier.mockResolvedValue(user);

      const result = await authService.login(validLoginData);

      // Verify token is valid
      const decoded = jwt.verify(result.accessToken, 'test-secret');
      expect(decoded).toHaveProperty('id', 1);
      expect(decoded).toHaveProperty('role', 'user');
    });
  });

  describe('getProfile', () => {
    it('should return user profile without password', async () => {
      const user = {
        id: 1,
        name: 'Test User',
        email: 'test@example.com',
        password: 'hashedpassword',
        role: 'user',
        created_at: new Date(),
      };

      userRepository.findByIdOrFail.mockResolvedValue(user);

      const result = await authService.getProfile(1);

      expect(result).not.toHaveProperty('password');
      expect(result).toHaveProperty('id', 1);
      expect(result).toHaveProperty('email', 'test@example.com');
    });

    it('should throw NotFoundError if user not found', async () => {
      userRepository.findByIdOrFail.mockRejectedValue(new Error('User not found'));

      await expect(authService.getProfile(999)).rejects.toThrow();
    });
  });

  describe('changePassword', () => {
    it('should change password successfully', async () => {
      const currentPassword = 'oldpassword';
      const hashedPassword = await bcrypt.hash(currentPassword, 4);
      const user = {
        id: 1,
        email: 'test@example.com',
        password: hashedPassword,
      };

      userRepository.findByIdOrFail.mockResolvedValue(user);
      userRepository.updatePassword.mockResolvedValue({ ...user, password: 'newhashed' });

      const result = await authService.changePassword(1, currentPassword, 'newpassword123');

      expect(result).toBe(true);
      expect(userRepository.updatePassword).toHaveBeenCalled();
    });

    it('should throw AuthenticationError if current password is incorrect', async () => {
      const user = {
        id: 1,
        email: 'test@example.com',
        password: await bcrypt.hash('correctpassword', 4),
      };

      userRepository.findByIdOrFail.mockResolvedValue(user);

      await expect(
        authService.changePassword(1, 'wrongpassword', 'newpassword123')
      ).rejects.toThrow(AuthenticationError);
    });
  });
});
