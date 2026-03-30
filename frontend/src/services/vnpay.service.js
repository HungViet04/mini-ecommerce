/**
 * VNPay Service
 * Handles VNPay payment API calls
 * Pattern: Service Layer
 */
import httpClient from './http.client';

export const vnpayService = {
  /**
   * Create VNPay payment URL
   * @param {number} orderId - Order ID
   * @param {string} bankCode - Bank code (optional)
   * @returns {Promise<Object>} { paymentUrl }
   */
  async createPaymentUrl(orderId, bankCode = null) {
    const response = await httpClient.post('/vnpay/create-payment-url', {
      orderId,
      bankCode,
    });
    return response.data || response;
  },

  /**
   * Verify VNPay return URL params
   * @param {Object} params - VNPay return URL query params
   * @returns {Promise<Object>} Payment result
   */
  async verifyReturn(params) {
    const queryString = new URLSearchParams(params).toString();
    const response = await httpClient.get(`/vnpay/return?${queryString}`);
    return response.data || response;
  },

  /**
   * Get payment status
   * @param {number} orderId - Order ID
   * @returns {Promise<Object>} Payment status
   */
  async getPaymentStatus(orderId) {
    const response = await httpClient.get(`/vnpay/status/${orderId}`);
    return response.data || response;
  },
};

export default vnpayService;
