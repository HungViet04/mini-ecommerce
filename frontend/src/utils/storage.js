/**
 * Storage utilities
 * Token and local storage management
 */

const TOKEN_KEY = 'ecom_access_token';
const REFRESH_TOKEN_KEY = 'ecom_refresh_token';

/**
 * Token storage utility
 */
export const tokenStorage = {
  get: () => localStorage.getItem(TOKEN_KEY),
  set: (token) => localStorage.setItem(TOKEN_KEY, token),
  clear: () => {
    localStorage.removeItem(TOKEN_KEY);
    localStorage.removeItem(REFRESH_TOKEN_KEY);
  },
};

/**
 * Refresh token storage utility
 */
export const refreshTokenStorage = {
  get: () => localStorage.getItem(REFRESH_TOKEN_KEY),
  set: (token) => localStorage.setItem(REFRESH_TOKEN_KEY, token),
  clear: () => localStorage.removeItem(REFRESH_TOKEN_KEY),
};

/**
 * Generic storage utility factory
 * @param {string} key - Storage key
 * @returns {Object} Storage methods
 */
export function createStorage(key) {
  return {
    get: () => {
      try {
        const value = localStorage.getItem(key);
        return value ? JSON.parse(value) : null;
      } catch {
        return null;
      }
    },
    set: (value) => {
      localStorage.setItem(key, JSON.stringify(value));
    },
    clear: () => {
      localStorage.removeItem(key);
    },
  };
}
