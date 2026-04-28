/**
 * Product Service
 * Handles all product-related API calls
 * Pattern: Service Layer
 */
import httpClient from './http.client';

export const productService = {
  /**
   * Get all products with pagination
   * @param {Object} params - { page, limit }
   * @returns {Promise<Object>} { items, total, page, limit }
   */
  async getAll(params = {}) {
    const query = new URLSearchParams();
    if (params.page) query.set('page', params.page);
    if (params.limit) query.set('limit', params.limit);

    const queryString = query.toString();
    const path = queryString ? `/products?${queryString}` : '/products';

    const response = await httpClient.get(path, { skipAuth: true });
    if (response && response.meta) {
      return response;
    }
    return response.data || response;
  },

  /**
   * Get product by ID
   * @param {number} id - Product ID
   * @returns {Promise<Object>}
   */
  async getById(id) {
    const response = await httpClient.get(`/products/${id}`, { skipAuth: true });
    return response.data || response;
  },

  /**
   * Search products by name
   * @param {string} query - Search query
   * @returns {Promise<Array>}
   */
  async search(query) {
    const response = await httpClient.get(`/products/search?q=${encodeURIComponent(query)}`, {
      skipAuth: true,
    });
    return response.data || response;
  },

  async searchAndFilter(filters = {}) {
    const query = new URLSearchParams();
    if (filters.keyword) query.set('keyword', filters.keyword);
    if (filters.category_id) query.set('category_id', filters.category_id);
    if (filters.min_price !== undefined && filters.min_price !== '')
      query.set('min_price', filters.min_price);
    if (filters.max_price !== undefined && filters.max_price !== '')
      query.set('max_price', filters.max_price);
    if (filters.page) query.set('page', filters.page);
    if (filters.limit) query.set('limit', filters.limit);
    if (filters.orderBy) query.set('orderBy', filters.orderBy);
    if (filters.order) query.set('order', filters.order);

    const queryString = query.toString();
    const path = queryString ? `/products/filter?${queryString}` : '/products/filter';

    const response = await httpClient.get(path, { skipAuth: true });
    return response;
  },

  /**
   * Get products by category
   * @param {number} categoryId - Category ID
   * @returns {Promise<Array>}
   */
  async getByCategory(categoryId) {
    const response = await httpClient.get(`/products/category/${categoryId}`, {
      skipAuth: true,
    });
    return response.data || response;
  },

  /**
   * Create new product (Admin only)
   * @param {Object} data - { name, price, stock, category_id, image_url }
   * @returns {Promise<Object>}
   */
  async create(data) {
    const response = await httpClient.post('/products', {
      name: data.name,
      price: Number(data.price),
      stock: Number(data.stock),
      category_id: data.category_id || null,
      description: data.description || '',
      image_url: data.image_url || '',
    });
    return response.data || response;
  },

  /**
   * Update product (Admin only)
   * @param {number} id - Product ID
   * @param {Object} data - Update data
   * @returns {Promise<Object>}
   */
  async update(id, data) {
    const response = await httpClient.put(`/products/${id}`, data);
    return response.data || response;
  },

  /**
   * Delete product (Admin only)
   * @param {number} id - Product ID
   * @returns {Promise<void>}
   */
  async delete(id) {
    await httpClient.delete(`/products/${id}`);
  },

  /**
   * Check product availability
   * @param {number} id - Product ID
   * @returns {Promise<Object>}
   */
  async checkAvailability(id) {
    const response = await httpClient.get(`/products/${id}/availability`, {
      skipAuth: true,
    });
    return response.data || response;
  },
};

export default productService;
