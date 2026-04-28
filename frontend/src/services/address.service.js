/**
 * Address Service
 * Handles user address API calls
 */
import httpClient from './http.client';

export const addressService = {
  async getMyAddresses() {
    const response = await httpClient.get('/addresses');
    return response.data || response;
  },

  async create(data) {
    const response = await httpClient.post('/addresses', data);
    return response.data || response;
  },

  async update(id, data) {
    const response = await httpClient.patch(`/addresses/${id}`, data);
    return response.data || response;
  },

  async remove(id) {
    const response = await httpClient.delete(`/addresses/${id}`);
    return response.data || response;
  },

  async setDefault(id) {
    const response = await httpClient.post(`/addresses/${id}/default`);
    return response.data || response;
  },
};

export default addressService;
