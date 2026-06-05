/**
 * Stats Service
 * API calls for dashboard statistics
 */
import httpClient from './http.client';

export const statsService = {
  /**
   * Get dashboard statistics (admin only)
   * @returns {Promise<Object>}
   */
  async getDashboard(range = null) {
    const hasRange = range && range.from && range.to;
    const query = hasRange ? `?from=${range.from}&to=${range.to}` : '';
    const response = await httpClient.get(`/stats/dashboard${query}`);
    return response.data || response;
  },
};

export default statsService;
