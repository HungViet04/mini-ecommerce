/**
 * Auth Service Tests
 * Comprehensive tests for authentication API service
 */
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { authService } from '../../src/services/auth.service';
import httpClient from '../../src/services/http.client';

// Mock http client
vi.mock('../../src/services/http.client', () => ({
  default: {
    post: vi.fn(),
    get: vi.fn(),
    put: vi.fn(),
    addRequestInterceptor: vi.fn(),
    addResponseInterceptor: vi.fn(),
  },
}));

describe('AuthService', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('login', () => {
    it('should login with email and password', async () => {
      const mockResponse = {
        data: {
          accessToken: 'access-token',
          refreshToken: 'refresh-token',
          user: { id: 1, email: 'test@test.com', role: 'user' },
        },
      };
      httpClient.post.mockResolvedValueOnce(mockResponse);

      const result = await authService.login({ email: 'test@test.com', password: 'password123' });

      expect(httpClient.post).toHaveBeenCalledWith(
        '/auth/login',
        {
          identifier: 'test@test.com',
          password: 'password123',
        },
        { skipAuth: true }
      );
      expect(result.accessToken).toBe('access-token');
      expect(result.user.email).toBe('test@test.com');
    });

    it('should login with identifier instead of email', async () => {
      const mockResponse = {
        data: {
          accessToken: 'token',
          user: { id: 1 },
        },
      };
      httpClient.post.mockResolvedValueOnce(mockResponse);

      await authService.login({ identifier: 'username', password: 'pass' });

      expect(httpClient.post).toHaveBeenCalledWith(
        '/auth/login',
        {
          identifier: 'username',
          password: 'pass',
        },
        { skipAuth: true }
      );
    });

    it('should skip auth for login request', async () => {
      httpClient.post.mockResolvedValueOnce({ data: { accessToken: 'token' } });

      await authService.login({ email: 'test@test.com', password: 'pass' });

      expect(httpClient.post).toHaveBeenCalledWith(
        expect.any(String),
        expect.any(Object),
        expect.objectContaining({ skipAuth: true })
      );
    });

    it('should handle login response without data wrapper', async () => {
      const mockResponse = {
        accessToken: 'token',
        user: { id: 1, email: 'test@test.com' },
      };
      httpClient.post.mockResolvedValueOnce(mockResponse);

      const result = await authService.login({ email: 'test@test.com', password: 'pass' });

      expect(result.accessToken).toBe('token');
    });

    it('should decode token if user not in response', async () => {
      const mockToken =
        'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6MSwibmFtZSI6IlRlc3QifQ.signature';
      httpClient.post.mockResolvedValueOnce({
        data: { accessToken: mockToken },
      });

      const result = await authService.login({ email: 'test@test.com', password: 'pass' });

      expect(result.user).toBeDefined();
    });

    it('should throw error on login failure', async () => {
      httpClient.post.mockRejectedValueOnce(new Error('Invalid credentials'));

      await expect(
        authService.login({ email: 'test@test.com', password: 'wrong' })
      ).rejects.toThrow('Invalid credentials');
    });
  });

  describe('register', () => {
    it('should register new user', async () => {
      const mockResponse = {
        data: { id: 1, name: 'New User', email: 'new@test.com' },
      };
      httpClient.post.mockResolvedValueOnce(mockResponse);

      const result = await authService.register({
        name: 'New User',
        email: 'new@test.com',
        password: 'password123',
      });

      expect(httpClient.post).toHaveBeenCalledWith(
        '/auth/register',
        {
          name: 'New User',
          email: 'new@test.com',
          password: 'password123',
        },
        { skipAuth: true }
      );
      expect(result.email).toBe('new@test.com');
    });

    it('should skip auth for register request', async () => {
      httpClient.post.mockResolvedValueOnce({ data: { id: 1 } });

      await authService.register({ name: 'Test', email: 'test@test.com', password: 'pass' });

      expect(httpClient.post).toHaveBeenCalledWith(
        expect.any(String),
        expect.any(Object),
        expect.objectContaining({ skipAuth: true })
      );
    });

    it('should throw error on registration failure', async () => {
      httpClient.post.mockRejectedValueOnce(new Error('Email already exists'));

      await expect(
        authService.register({ name: 'Test', email: 'existing@test.com', password: 'pass' })
      ).rejects.toThrow('Email already exists');
    });
  });

  describe('refreshToken', () => {
    it('should refresh access token', async () => {
      const mockResponse = {
        data: { accessToken: 'new-access-token' },
      };
      httpClient.post.mockResolvedValueOnce(mockResponse);

      const result = await authService.refreshToken('old-refresh-token');

      expect(httpClient.post).toHaveBeenCalledWith(
        '/auth/refresh',
        {
          refreshToken: 'old-refresh-token',
        },
        { skipAuth: true }
      );
      expect(result.accessToken).toBe('new-access-token');
    });

    it('should skip auth for refresh request', async () => {
      httpClient.post.mockResolvedValueOnce({ data: {} });

      await authService.refreshToken('token');

      expect(httpClient.post).toHaveBeenCalledWith(
        expect.any(String),
        expect.any(Object),
        expect.objectContaining({ skipAuth: true })
      );
    });
  });

  describe('getProfile', () => {
    it('should get current user profile', async () => {
      const mockProfile = {
        data: { id: 1, name: 'User', email: 'user@test.com', role: 'user' },
      };
      httpClient.get.mockResolvedValueOnce(mockProfile);

      const result = await authService.getProfile();

      expect(httpClient.get).toHaveBeenCalledWith('/auth/profile');
      expect(result.email).toBe('user@test.com');
    });

    it('should require authentication', async () => {
      httpClient.get.mockResolvedValueOnce({ data: {} });

      await authService.getProfile();

      // Should NOT have skipAuth option
      expect(httpClient.get).toHaveBeenCalledWith('/auth/profile');
    });
  });

  describe('changePassword', () => {
    it('should change user password', async () => {
      httpClient.put.mockResolvedValueOnce({});

      await authService.changePassword('oldPassword', 'newPassword');

      expect(httpClient.put).toHaveBeenCalledWith('/auth/password', {
        currentPassword: 'oldPassword',
        newPassword: 'newPassword',
      });
    });

    it('should throw error on password change failure', async () => {
      httpClient.put.mockRejectedValueOnce(new Error('Current password incorrect'));

      await expect(authService.changePassword('wrong', 'new')).rejects.toThrow(
        'Current password incorrect'
      );
    });
  });

  describe('decodeToken', () => {
    it('should decode valid JWT token', () => {
      // Create a simple JWT with payload { id: 1, name: "Test" }
      const payload = { id: 1, name: 'Test User' };
      const base64Payload = btoa(JSON.stringify(payload));
      const token = `header.${base64Payload}.signature`;

      const result = authService.decodeToken(token);

      expect(result.id).toBe(1);
      expect(result.name).toBe('Test User');
    });

    it('should return null for invalid token', () => {
      const result = authService.decodeToken('invalid-token');

      expect(result).toBeNull();
    });

    it('should return null for malformed token', () => {
      const result = authService.decodeToken('not.valid.jwt.token');

      expect(result).toBeNull();
    });

    it('should handle token with special characters', () => {
      const payload = { name: 'Nguyễn Văn A' };
      const base64Payload = btoa(unescape(encodeURIComponent(JSON.stringify(payload))));
      const token = `header.${base64Payload}.sig`;

      const result = authService.decodeToken(token);

      // Should not throw
      expect(result).toBeDefined();
    });
  });
});
