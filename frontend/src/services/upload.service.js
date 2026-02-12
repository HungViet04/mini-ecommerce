/**
 * Upload Service
 * Handles file upload API calls
 */

import httpClient from './http.client';
import { tokenStorage } from '../utils/storage';

export const uploadService = {
  /**
   * Upload product image
   * @param {File} file - Image file to upload
   * @returns {Promise<Object>} - { url, filename, originalName, size, mimetype }
   */
  async uploadImage(file) {
    const formData = new FormData();
    formData.append('image', file);

    // Lấy token từ storage (cùng chuẩn với httpClient)
    const token = tokenStorage.get();

    // Nếu chưa có token -> báo lỗi rõ ràng
    if (!token) {
      throw new Error('Vui lòng đăng nhập trước khi upload ảnh');
    }

    const response = await httpClient.post('/upload/image', formData, {
      isFormData: true,
      // headers bổ sung nếu cần thêm
    });

    return response.data || response;
  },

  /**
   * Delete product image
   * @param {string} filename - Filename to delete
   * @returns {Promise<void>}
   */
  async deleteImage(filename) {
    const token = tokenStorage.get();

    if (!token) {
      throw new Error('Vui lòng đăng nhập trước khi xóa ảnh');
    }

    await httpClient.delete(`/upload/image/${filename}`);
  },

  /**
   * Delete by image path (/uploads/xxx)
   */
  async deleteByPath(imagePath) {
    if (!imagePath || !imagePath.startsWith('/uploads/')) return;
    const parts = imagePath.split('/');
    const filename = parts[parts.length - 1];
    if (!filename) return;
    await this.deleteImage(filename);
  },

  /**
   * Get full URL for an uploaded image
   * @param {string} imagePath - Image path (e.g., /uploads/product-123.jpg)
   * @returns {string} - Full URL
   */
  getImageUrl(imagePath) {
    if (!imagePath) return '';

    // Nếu đã là URL đầy đủ, trả về luôn
    if (imagePath.startsWith('http://') || imagePath.startsWith('https://')) {
      return imagePath;
    }

    // Nếu là đường dẫn relative, thêm base URL
    const baseUrl =
      import.meta.env.VITE_API_BASE?.replace('/api/v1', '') || 'http://localhost:3000';
    return `${baseUrl}${imagePath}`;
  },
};

export default uploadService;
