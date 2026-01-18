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
  async getDashboard() {
    const response = await httpClient.get('/stats/dashboard');
    return response.data || response;
  },
};

export default statsService;
