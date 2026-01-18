/**
 * Auth Service
 * Handles all authentication-related API calls
 * Pattern: Service Layer
 */
import httpClient from "./http.client";
import { tokenStorage } from "../utils/storage";

export const authService = {
  /**
   * Login user
   * @param {Object} credentials - { email, password } or { identifier, password }
   * @returns {Promise<Object>} { accessToken, refreshToken, user }
   */
  async login(credentials) {
    const body = {
      identifier: credentials.email || credentials.identifier,
      password: credentials.password,
    };

    const response = await httpClient.post("/auth/login", body, {
      skipAuth: true,
    });

    const data = response.data || response;

    return {
      accessToken: data.accessToken,
      refreshToken: data.refreshToken,
      user: data.user || this.decodeToken(data.accessToken),
    };
  },

  /**
   * Register new user
   * @param {Object} data - { name, email, password }
   * @returns {Promise<Object>}
   */
  async register(data) {
    const response = await httpClient.post(
      "/auth/register",
      {
        name: data.name,
        email: data.email,
        password: data.password,
      },
      { skipAuth: true }
    );

    return response.data || response;
  },

  /**
   * Refresh access token
   * @param {string} refreshToken
   * @returns {Promise<Object>}
   */
  async refreshToken(refreshToken) {
    const response = await httpClient.post(
      "/auth/refresh",
      {
        refreshToken,
      },
      { skipAuth: true }
    );

    return response.data || response;
  },

  /**
   * Get current user profile
   * @returns {Promise<Object>}
   */
  async getProfile() {
    const response = await httpClient.get("/auth/profile");
    return response.data || response;
  },

  /**
   * Change password
   * @param {string} currentPassword
   * @param {string} newPassword
   * @returns {Promise<void>}
   */
  async changePassword(currentPassword, newPassword) {
    await httpClient.put("/auth/password", {
      currentPassword,
      newPassword,
    });
  },

  /**
   * Decode JWT token payload
   * @param {string} token
   * @returns {Object|null}
   */
  decodeToken(token) {
    try {
      const payload = token.split(".")[1];
      return JSON.parse(atob(payload));
    } catch {
      return null;
    }
  },

  /**
   * Check if token is expired
   * @param {Object} decoded - Decoded token payload
   * @returns {boolean}
   */
  isTokenExpired(decoded) {
    if (!decoded?.exp) return true;
    return Date.now() >= decoded.exp * 1000;
  },
};

// Setup auth interceptor
httpClient.addRequestInterceptor((config) => {
  if (config.skipAuth) return config;

  const token = tokenStorage.get();
  if (token) {
    config.headers = {
      ...config.headers,
      Authorization: `Bearer ${token}`,
    };
  }

  return config;
});

export default authService;
