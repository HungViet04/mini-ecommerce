/**
 * AuthContext Tests
 * Tests for authentication context
 */
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, act, waitFor } from '@testing-library/react';
import { AuthProvider, useAuth } from '../../src/contexts/AuthContext';

// Mock authService
vi.mock('../../src/services/auth.service', () => ({
  authService: {
    login: vi.fn(),
    register: vi.fn(),
    getProfile: vi.fn(),
    decodeToken: vi.fn(),
    isTokenExpired: vi.fn(),
  },
}));

// Mock tokenStorage
vi.mock('../../src/utils/storage', () => ({
  tokenStorage: {
    get: vi.fn(),
    set: vi.fn(),
    clear: vi.fn(),
  },
}));

import { authService } from '../../src/services/auth.service';
import { tokenStorage } from '../../src/utils/storage';

const wrapper = ({ children }) => <AuthProvider>{children}</AuthProvider>;

describe('AuthContext', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    tokenStorage.get.mockReturnValue(null);
  });

  describe('Initial state', () => {
    it('should have null user when no token', async () => {
      tokenStorage.get.mockReturnValue(null);

      const { result } = renderHook(() => useAuth(), { wrapper });

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      expect(result.current.user).toBeNull();
      expect(result.current.isAuthenticated).toBe(false);
    });

    it('should initialize user from valid token', async () => {
      const mockUser = { id: 1, email: 'test@example.com', role: 'user' };

      tokenStorage.get.mockReturnValue('valid-token');
      authService.decodeToken.mockReturnValue(mockUser);
      authService.isTokenExpired.mockReturnValue(false);

      const { result } = renderHook(() => useAuth(), { wrapper });

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      expect(result.current.user).toBeDefined();
      expect(result.current.isAuthenticated).toBe(true);
    });

    it('should clear token if expired', async () => {
      tokenStorage.get.mockReturnValue('expired-token');
      authService.decodeToken.mockReturnValue({ id: 1, exp: Date.now() / 1000 - 3600 });
      authService.isTokenExpired.mockReturnValue(true);

      const { result } = renderHook(() => useAuth(), { wrapper });

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      expect(result.current.user).toBeNull();
      expect(tokenStorage.clear).toHaveBeenCalled();
    });
  });

  describe('login', () => {
    it('should login successfully', async () => {
      tokenStorage.get.mockReturnValue(null);

      const loginResult = {
        accessToken: 'new-token',
        user: { id: 1, name: 'Test User', email: 'test@example.com', role: 'user' },
      };
      authService.login.mockResolvedValue(loginResult);

      const { result } = renderHook(() => useAuth(), { wrapper });

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      let loginResponse;
      await act(async () => {
        loginResponse = await result.current.login({
          identifier: 'test@example.com',
          password: 'password123',
        });
      });

      expect(authService.login).toHaveBeenCalledWith({
        identifier: 'test@example.com',
        password: 'password123',
      });
      expect(tokenStorage.set).toHaveBeenCalledWith('new-token');
      expect(result.current.user).toBeDefined();
    });

    it('should handle login error', async () => {
      tokenStorage.get.mockReturnValue(null);
      authService.login.mockRejectedValue(new Error('Invalid credentials'));

      const { result } = renderHook(() => useAuth(), { wrapper });

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      await expect(
        act(async () => {
          await result.current.login({
            identifier: 'wrong@example.com',
            password: 'wrongpassword',
          });
        })
      ).rejects.toThrow('Invalid credentials');
    });
  });

  describe('register', () => {
    it('should register successfully', async () => {
      tokenStorage.get.mockReturnValue(null);

      const registerResult = {
        id: 1,
        name: 'New User',
        email: 'new@example.com',
      };
      authService.register.mockResolvedValue(registerResult);

      const { result } = renderHook(() => useAuth(), { wrapper });

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      let response;
      await act(async () => {
        response = await result.current.register({
          name: 'New User',
          email: 'new@example.com',
          password: 'password123',
        });
      });

      expect(authService.register).toHaveBeenCalledWith({
        name: 'New User',
        email: 'new@example.com',
        password: 'password123',
      });
      expect(response).toEqual(registerResult);
    });

    it('should handle registration error', async () => {
      tokenStorage.get.mockReturnValue(null);
      authService.register.mockRejectedValue(new Error('Email already exists'));

      const { result } = renderHook(() => useAuth(), { wrapper });

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      await expect(
        act(async () => {
          await result.current.register({
            name: 'Test',
            email: 'existing@example.com',
            password: 'password123',
          });
        })
      ).rejects.toThrow('Email already exists');
    });
  });

  describe('logout', () => {
    it('should logout and clear state', async () => {
      const mockUser = { id: 1, email: 'test@example.com', role: 'user' };

      tokenStorage.get.mockReturnValue('valid-token');
      authService.decodeToken.mockReturnValue(mockUser);
      authService.isTokenExpired.mockReturnValue(false);

      const { result } = renderHook(() => useAuth(), { wrapper });

      await waitFor(() => {
        expect(result.current.user).toBeDefined();
      });

      // Mock tokenStorage.get to return null after clear
      tokenStorage.get.mockReturnValue(null);

      act(() => {
        result.current.logout();
      });

      expect(tokenStorage.clear).toHaveBeenCalled();

      await waitFor(() => {
        expect(result.current.isAuthenticated).toBe(false);
      });
    });
  });

  describe('isAdmin', () => {
    it('should return true for admin user', async () => {
      const adminUser = { id: 1, email: 'admin@example.com', role: 'admin' };

      tokenStorage.get.mockReturnValue('valid-token');
      authService.decodeToken.mockReturnValue(adminUser);
      authService.isTokenExpired.mockReturnValue(false);

      const { result } = renderHook(() => useAuth(), { wrapper });

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      expect(result.current.isAdmin).toBe(true);
    });

    it('should return false for regular user', async () => {
      const regularUser = { id: 1, email: 'user@example.com', role: 'user' };

      tokenStorage.get.mockReturnValue('valid-token');
      authService.decodeToken.mockReturnValue(regularUser);
      authService.isTokenExpired.mockReturnValue(false);

      const { result } = renderHook(() => useAuth(), { wrapper });

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      expect(result.current.isAdmin).toBe(false);
    });
  });

  describe('useAuth hook', () => {
    it('should throw error when used outside provider', () => {
      expect(() => {
        renderHook(() => useAuth());
      }).toThrow('useAuth must be used within an AuthProvider');
    });
  });
});

