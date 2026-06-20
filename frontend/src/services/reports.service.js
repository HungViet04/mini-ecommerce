/**
 * Reports Service
 * Admin reports API calls
 */
import httpClient from './http.client';

export const reportsService = {
  async getProductsForReport(limit = 200) {
    const response = await httpClient.get(`/reports/products?limit=${limit}`);
    return response.data || response;
  },

  async getTopProductsReport({ from, to, categoryId, productIds } = {}) {
    const params = new URLSearchParams();
    if (from) params.set('from', from);
    if (to) params.set('to', to);
    if (categoryId) params.set('categoryId', String(categoryId));
    if (productIds && productIds.length > 0) params.set('productIds', productIds.join(','));

    const response = await httpClient.get(`/reports/top-products?${params.toString()}`);
    return response.data || response;
  },

  async downloadTopProductsCsv({ from, to, categoryId, productIds } = {}) {
    const params = new URLSearchParams();
    if (from) params.set('from', from);
    if (to) params.set('to', to);
    if (categoryId) params.set('categoryId', String(categoryId));
    if (productIds && productIds.length > 0) params.set('productIds', productIds.join(','));

    // Download directly - backend sets attachment headers.
    // httpClient (fetch-based) returns the parsed body.
    const blob = await httpClient.get(
      `/reports/top-products/export?${params.toString()}`,
      {
        responseType: 'blob',
      }
    );

    return blob;
  },
};

export default reportsService;


