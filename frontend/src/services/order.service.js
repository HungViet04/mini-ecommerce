/**
 * Order Service
 * Handles all order-related API calls
 * Pattern: Service Layer
 */
import httpClient from './http.client';

export const orderService = {
  /**
   * Create new order
   * @param {Object} data - { items, shippingInfo, paymentMethod }
   * @returns {Promise<Object>}
   */
  async create(data, options) {
    const payload = {
      items: data.items.map((item) => ({
        productId: item.productId,
        quantity: Number(item.quantity),
      })),
      shippingInfo: data.shippingInfo || null,
      shippingAddressId: data.shippingAddressId || null,
      paymentMethod: data.paymentMethod || 'cod',
    };

    const response = options
      ? await httpClient.post('/orders', payload, options)
      : await httpClient.post('/orders', payload);
    return response.data || response;
  },

  /**
   * Get current user's orders
   * @returns {Promise<Array>}
   */
  async getMyOrders(options) {
    const response = options
      ? await httpClient.get('/orders/my', options)
      : await httpClient.get('/orders/my');
    return response.data || response;
  },

  /**
   * Get order by ID
   * @param {number} id - Order ID
   * @returns {Promise<Object>}
   */
  async getById(id, options) {
    const response = options
      ? await httpClient.get(`/orders/${id}`, options)
      : await httpClient.get(`/orders/${id}`);
    return response.data || response;
  },

  /**
   * Cancel order
   * @param {number} id - Order ID
   * @returns {Promise<Object>}
   */
  async cancel(id, options) {
    const response = options
      ? await httpClient.post(`/orders/${id}/cancel`, null, options)
      : await httpClient.post(`/orders/${id}/cancel`);
    return response.data || response;
  },

  /**
   * Get all orders (Admin only)
   * @param {Object} params - { page, limit, status, search }
   * @returns {Promise<Object>}
   */
  async getAll(params = {}, options) {
    const query = new URLSearchParams();
    if (params.page) query.set('page', params.page);
    if (params.limit) query.set('limit', params.limit);
    if (params.status) query.set('status', params.status);
    if (params.search) query.set('search', params.search);

    const queryString = query.toString();
    const path = queryString ? `/orders?${queryString}` : '/orders';

    const response = options ? await httpClient.get(path, options) : await httpClient.get(path);
    return response.data || response;
  },

  /**
   * Update order status (Admin only)
   * @param {number} id - Order ID
   * @param {string} status - New status
   * @returns {Promise<Object>}
   */
  async updateStatus(id, status, options) {
    const response = options
      ? await httpClient.patch(`/orders/${id}/status`, { status }, options)
      : await httpClient.patch(`/orders/${id}/status`, { status });
    return response.data || response;
  },

  /**
   * Confirm delivery - user confirms they received the order
   * @param {number} id - Order ID
   * @returns {Promise<Object>}
   */
  async confirmDelivery(id, options) {
    const response = options
      ? await httpClient.post(`/orders/${id}/confirm-delivery`, null, options)
      : await httpClient.post(`/orders/${id}/confirm-delivery`);
    return response.data || response;
  },
};

export default orderService;
