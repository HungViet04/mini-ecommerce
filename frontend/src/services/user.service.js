/**
 * User Service
 * API calls for user management (admin)
 */
import httpClient from './http.client';

export const userService = {
  /**
   * Get all users (admin only)
   * @param {Object} params - { page, limit, role, search }
   * @returns {Promise<Object>}
   */
  async getAll(params = {}) {
    const query = new URLSearchParams();
    if (params.page) query.set('page', params.page);
    if (params.limit) query.set('limit', params.limit);
    if (params.role) query.set('role', params.role);
    if (params.search) query.set('search', params.search);

    const queryString = query.toString();
    const path = queryString ? `/users?${queryString}` : '/users';

    const response = await httpClient.get(path);
    if (response && response.meta) {
      return response;
    }
    return response.data || response;
  },

  /**
   * Get user by ID
   * @param {number} id - User ID
   * @returns {Promise<Object>}
   */
  async getById(id) {
    const response = await httpClient.get(`/users/${id}`);
    return response.data || response;
  },

  /**
   * Get user's orders
   * @param {number} id - User ID
   * @returns {Promise<Array>}
   */
  async getUserOrders(id) {
    const response = await httpClient.get(`/users/${id}/orders`);
    return response.data || response;
  },

  /**
   * Update user role
   * @param {number} id - User ID
   * @param {string} role - New role
   * @returns {Promise<Object>}
   */
  async updateRole(id, role) {
    const response = await httpClient.patch(`/users/${id}/role`, { role });
    return response.data || response;
  },

  /**
   * Delete user
   * @param {number} id - User ID
   * @returns {Promise<Object>}
   */
  async delete(id) {
    const response = await httpClient.delete(`/users/${id}`);
    return response.data || response;
  },
};

export default userService;
