/**
 * Upload Service Tests
 * Tests for real uploadService (src/services/upload.service.js)
 */
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { uploadService } from '../../src/services/upload.service';
import httpClient from '../../src/services/http.client';
import { tokenStorage } from '../../src/utils/storage';

vi.mock('../../src/services/http.client', () => ({
  default: {
    get: vi.fn(),
    post: vi.fn(),
    put: vi.fn(),
    patch: vi.fn(),
    delete: vi.fn(),
    addRequestInterceptor: vi.fn(),
    addResponseInterceptor: vi.fn(),
  },
}));

vi.mock('../../src/utils/storage', () => ({
  tokenStorage: {
    get: vi.fn(),
    set: vi.fn(),
    clear: vi.fn(),
  },
  refreshTokenStorage: {
    get: vi.fn(),
    set: vi.fn(),
    clear: vi.fn(),
  },
}));

describe('UploadService', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('uploadImage', () => {
    it('should post FormData to /upload/image', async () => {
      tokenStorage.get.mockReturnValue('test-token');
      const mockFile = new File(['data'], 'photo.jpg', { type: 'image/jpeg' });
      const mockResponse = {
        data: { url: '/uploads/photo-123.jpg', filename: 'photo-123.jpg' },
      };
      httpClient.post.mockResolvedValueOnce(mockResponse);

      const result = await uploadService.uploadImage(mockFile);

      expect(httpClient.post).toHaveBeenCalledWith('/upload/image', expect.any(FormData), {
        isFormData: true,
      });
      expect(result.url).toBe('/uploads/photo-123.jpg');
    });

    it('should throw when not authenticated', async () => {
      tokenStorage.get.mockReturnValue(null);
      const mockFile = new File(['data'], 'photo.jpg', { type: 'image/jpeg' });

      await expect(uploadService.uploadImage(mockFile)).rejects.toThrow(
        'Vui lòng đăng nhập trước khi upload ảnh'
      );
      expect(httpClient.post).not.toHaveBeenCalled();
    });

    it('should handle response without data wrapper', async () => {
      tokenStorage.get.mockReturnValue('token');
      const mockFile = new File([''], 'img.png', { type: 'image/png' });
      httpClient.post.mockResolvedValueOnce({ url: '/uploads/img.png' });

      const result = await uploadService.uploadImage(mockFile);
      expect(result).toEqual({ url: '/uploads/img.png' });
    });
  });

  describe('deleteImage', () => {
    it('should call DELETE /upload/image/:filename', async () => {
      tokenStorage.get.mockReturnValue('test-token');
      httpClient.delete.mockResolvedValueOnce({});

      await uploadService.deleteImage('photo-123.jpg');

      expect(httpClient.delete).toHaveBeenCalledWith('/upload/image/photo-123.jpg');
    });

    it('should throw when not authenticated', async () => {
      tokenStorage.get.mockReturnValue(null);

      await expect(uploadService.deleteImage('photo.jpg')).rejects.toThrow(
        'Vui lòng đăng nhập trước khi xóa ảnh'
      );
    });
  });

  describe('deleteByPath', () => {
    it('should extract filename and call deleteImage', async () => {
      tokenStorage.get.mockReturnValue('token');
      httpClient.delete.mockResolvedValueOnce({});

      await uploadService.deleteByPath('/uploads/photo-123.jpg');

      expect(httpClient.delete).toHaveBeenCalledWith('/upload/image/photo-123.jpg');
    });

    it('should do nothing for invalid paths', async () => {
      await uploadService.deleteByPath(null);
      await uploadService.deleteByPath('/images/notupload.jpg');
      await uploadService.deleteByPath('');

      expect(httpClient.delete).not.toHaveBeenCalled();
    });
  });

  describe('getImageUrl', () => {
    it('should return empty string for falsy path', () => {
      expect(uploadService.getImageUrl('')).toBe('');
      expect(uploadService.getImageUrl(null)).toBe('');
      expect(uploadService.getImageUrl(undefined)).toBe('');
    });

    it('should return absolute URLs unchanged', () => {
      expect(uploadService.getImageUrl('https://cdn.example.com/img.jpg')).toBe(
        'https://cdn.example.com/img.jpg'
      );
      expect(uploadService.getImageUrl('http://localhost:3000/uploads/img.jpg')).toBe(
        'http://localhost:3000/uploads/img.jpg'
      );
    });

    it('should prepend base URL for relative paths', () => {
      const result = uploadService.getImageUrl('/uploads/product-1.jpg');
      expect(result).toContain('/uploads/product-1.jpg');
      // Base URL fallback is http://localhost:3000
      expect(result).toMatch(/^https?:\/\//);
    });
  });
});
