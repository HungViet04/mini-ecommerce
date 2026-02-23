/**
 * Auth Controller Unit Tests
 * Tests for authentication HTTP request handling
 */

// Mock dependencies
jest.mock('../../../src/services', () => ({
  authService: {
    register: jest.fn(),
    login: jest.fn(),
    getProfile: jest.fn(),
    changePassword: jest.fn()
  }
}));

jest.mock('../../../src/helpers', () => ({
  response: {
    success: jest.fn((res, data) => res.status(200).json(data)),
    created: jest.fn((res, data, message) => res.status(201).json({ success: true, data, message })),
    error: jest.fn((res, message, code) => res.status(code || 500).json({ success: false, error: { message } }))
  }
}));

const { authService } = require('../../../src/services');
const { response } = require('../../../src/helpers');
const authController = require('../../../src/controllers/auth.controller');

describe('Auth Controller', () => {
  let req, res, next;

  beforeEach(() => {
    jest.clearAllMocks();

    req = {
      body: {},
      user: null,
      params: {}
    };

    res = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn().mockReturnThis()
    };

    next = jest.fn();
  });

  describe('register', () => {
    it('should register new user successfully', async () => {
      const userData = {
        name: 'Test User',
        email: 'test@test.com',
        password: 'password123'
      };
      const createdUser = { id: 1, name: 'Test User', email: 'test@test.com', role: 'user' };

      req.body = userData;
      authService.register.mockResolvedValueOnce(createdUser);

      await authController.register(req, res, next);

      expect(authService.register).toHaveBeenCalledWith(userData);
      expect(response.created).toHaveBeenCalledWith(res, createdUser, 'Đăng ký thành công');
    });

    it('should handle registration error', async () => {
      req.body = { email: 'existing@test.com' };
      const error = new Error('Email đã tồn tại');
      authService.register.mockRejectedValueOnce(error);

      await authController.register(req, res, next);
      await Promise.resolve(); // Allow asyncHandler's catch to execute

      expect(next).toHaveBeenCalledWith(error);
    });

    it('should pass validation errors to next', async () => {
      req.body = {};
      const error = new Error('Validation failed');
      authService.register.mockRejectedValueOnce(error);

      await authController.register(req, res, next);
      await Promise.resolve(); // Allow asyncHandler's catch to execute

      expect(next).toHaveBeenCalledWith(error);
    });
  });

  describe('login', () => {
    it('should login user successfully', async () => {
      const credentials = { email: 'test@test.com', password: 'password123' };
      const loginResult = {
        user: { id: 1, name: 'Test', email: 'test@test.com', role: 'user' },
        accessToken: 'access-token',
        refreshToken: 'refresh-token'
      };

      req.body = credentials;
      authService.login.mockResolvedValueOnce(loginResult);

      await authController.login(req, res, next);

      expect(authService.login).toHaveBeenCalledWith(credentials);
      expect(response.success).toHaveBeenCalledWith(res, {
        data: loginResult,
        message: 'Đăng nhập thành công'
      });
    });

    it('should handle invalid credentials', async () => {
      req.body = { email: 'test@test.com', password: 'wrong' };
      const error = new Error('Invalid credentials');
      authService.login.mockRejectedValueOnce(error);

      await authController.login(req, res, next);
      await Promise.resolve(); // Allow asyncHandler's catch to execute

      expect(next).toHaveBeenCalledWith(error);
    });

    it('should handle non-existent user', async () => {
      req.body = { email: 'notfound@test.com', password: 'password' };
      const error = new Error('User not found');
      authService.login.mockRejectedValueOnce(error);

      await authController.login(req, res, next);
      await Promise.resolve(); // Allow asyncHandler's catch to execute

      expect(next).toHaveBeenCalledWith(error);
    });
  });

  describe('getProfile', () => {
    it('should return user profile', async () => {
      const profile = { id: 1, name: 'Test User', email: 'test@test.com', role: 'user' };

      req.user = { id: 1 };
      authService.getProfile.mockResolvedValueOnce(profile);

      await authController.getProfile(req, res, next);

      expect(authService.getProfile).toHaveBeenCalledWith(1);
      expect(response.success).toHaveBeenCalledWith(res, { data: profile });
    });

    it('should handle profile not found', async () => {
      req.user = { id: 999 };
      const error = new Error('User not found');
      authService.getProfile.mockRejectedValueOnce(error);

      await authController.getProfile(req, res, next);
      await Promise.resolve(); // Allow asyncHandler's catch to execute

      expect(next).toHaveBeenCalledWith(error);
    });
  });

  describe('changePassword', () => {
    it('should change password successfully', async () => {
      req.user = { id: 1 };
      req.body = { currentPassword: 'old123', newPassword: 'new123' };
      authService.changePassword.mockResolvedValueOnce(true);

      await authController.changePassword(req, res, next);

      expect(authService.changePassword).toHaveBeenCalledWith(1, 'old123', 'new123');
      expect(response.success).toHaveBeenCalledWith(res, {
        message: 'Đổi mật khẩu thành công'
      });
    });

    it('should handle wrong current password', async () => {
      req.user = { id: 1 };
      req.body = { currentPassword: 'wrong', newPassword: 'new123' };
      const error = new Error('Mật khẩu hiện tại không đúng');
      authService.changePassword.mockRejectedValueOnce(error);

      await authController.changePassword(req, res, next);
      await Promise.resolve(); // Allow asyncHandler's catch to execute

      expect(next).toHaveBeenCalledWith(error);
    });

    it('should pass user id from authenticated request', async () => {
      req.user = { id: 42 };
      req.body = { currentPassword: 'old', newPassword: 'new' };
      authService.changePassword.mockResolvedValueOnce(true);

      await authController.changePassword(req, res, next);

      expect(authService.changePassword).toHaveBeenCalledWith(42, 'old', 'new');
    });
  });
});

