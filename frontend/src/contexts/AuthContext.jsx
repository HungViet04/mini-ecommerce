/**
 * Auth Context
 * Global authentication state management
 * Pattern: React Context + Provider
 */
import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { authService } from '../services/auth.service';
import { tokenStorage } from '../utils/storage';

// Create context
const AuthContext = createContext(null);

/**
 * Auth Provider Component
 * Wraps the app and provides auth state
 */
export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  // Initialize auth state from stored token
  useEffect(() => {
    // Khởi tạo user từ token khi mount
    const token = tokenStorage.get();
    async function initUser() {
      if (token) {
        const decoded = authService.decodeToken(token);
        if (decoded && !authService.isTokenExpired(decoded)) {
          let userObj = {
            id: decoded.id,
            role: decoded.role,
            email: decoded.email,
          };
          // Nếu chưa có email, gọi API lấy profile
          if (!userObj.email) {
            try {
              const profile = await authService.getProfile();
              userObj = { ...userObj, ...profile };
            } catch (err) {
              // Silent fail - user will have basic info from token
            }
          }
          setUser(userObj);
        } else {
          setUser(null);
          tokenStorage.clear();
        }
      } else {
        setUser(null);
      }
      setLoading(false);
    }
    initUser();

    // Lắng nghe sự kiện storage để đồng bộ giữa các tab
    const handleStorage = (e) => {
      if (e.key === 'ecom_access_token') {
        const token = tokenStorage.get();
        // eslint-disable-next-line no-inner-declarations
        async function syncUser() {
          if (token) {
            const decoded = authService.decodeToken(token);
            if (decoded && !authService.isTokenExpired(decoded)) {
              let userObj = {
                id: decoded.id,
                role: decoded.role,
                email: decoded.email,
              };
              if (!userObj.email) {
                try {
                  const profile = await authService.getProfile();
                  userObj = { ...userObj, ...profile };
                } catch (err) {
                  // Silent fail
                }
              }
              setUser(userObj);
            } else {
              setUser(null);
              tokenStorage.clear();
            }
          } else {
            setUser(null);
          }
        }
        syncUser();
      }
    };
    window.addEventListener('storage', handleStorage);
    return () => window.removeEventListener('storage', handleStorage);
  }, []);

  // Login handler
  const login = useCallback(async (credentials) => {
    const result = await authService.login(credentials);
    const { accessToken, user: userData } = result;
    tokenStorage.set(accessToken);
    let finalUser = userData;
    // Nếu user không có email, gọi API lấy profile
    if (!userData?.email) {
      try {
        const profile = await authService.getProfile();
        finalUser = { ...userData, ...profile };
      } catch (err) {
        // Silent fail
      }
    }
    setUser(finalUser);
    // Trigger storage event for other tabs
    window.dispatchEvent(new StorageEvent('storage', { key: 'ecom_access_token' }));
    return result;
  }, []);

  // Register handler
  const register = useCallback(async (data) => {
    return authService.register(data);
  }, []);

  // Logout handler
  const logout = useCallback(() => {
    tokenStorage.clear();
    setUser(null);
    // Trigger storage event for other tabs
    window.dispatchEvent(new StorageEvent('storage', { key: 'ecom_access_token' }));
  }, []);

  // Check if user is admin
  const isAdmin = user?.role === 'admin';

  // Check if user is authenticated
  const isAuthenticated = !!user;

  const value = {
    user,
    loading, // truyền loading ra context
    isAdmin,
    isAuthenticated,
    login,
    register,
    logout,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

/**
 * Custom hook to use auth context
 * @returns {Object} Auth context value
 */
export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}

export default AuthContext;
