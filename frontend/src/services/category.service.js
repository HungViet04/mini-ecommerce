/**
 * Category Service
 * Handles all category-related API calls
 * Pattern: Service Layer
 */
import httpClient from './http.client';

export const categoryService = {
  /**
   * Get all categories
   * @returns {Promise<Array>}
   */
  async getAll() {
    const response = await httpClient.get('/categories', { skipAuth: true });
    return response.data || response;
  },

  /**
   * Get category by ID
   * @param {number} id - Category ID
   * @returns {Promise<Object>}
   */
  async getById(id) {
    const response = await httpClient.get(`/categories/${id}`, { skipAuth: true });
    return response.data || response;
  },

  /**
   * Create new category (Admin only)
   * @param {Object} data - { name }
   * @returns {Promise<Object>}
   */
  async create(data) {
    const response = await httpClient.post('/categories', {
      name: data.name,
    });
    return response.data || response;
  },

  /**
   * Update category (Admin only)
   * @param {number} id - Category ID
   * @param {Object} data - Update data
   * @returns {Promise<Object>}
   */
  async update(id, data) {
    const response = await httpClient.put(`/categories/${id}`, data);
    return response.data || response;
  },

  /**
   * Delete category (Admin only)
   * @param {number} id - Category ID
   * @returns {Promise<void>}
   */
  async delete(id) {
    await httpClient.delete(`/categories/${id}`);
  },
};

export default categoryService;
