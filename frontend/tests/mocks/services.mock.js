/**
 * Service Mocks
 * Mock implementations for API services
 * Must match real service interfaces in src/services/
 */
import { vi } from 'vitest';

export const mockAuthService = {
  login: vi.fn(),
  register: vi.fn(),
  getProfile: vi.fn(),
  changePassword: vi.fn(),
  refreshToken: vi.fn(),
  decodeToken: vi.fn(),
  isTokenExpired: vi.fn(),
};

export const mockProductService = {
  getAll: vi.fn(),
  getById: vi.fn(),
  create: vi.fn(),
  update: vi.fn(),
  delete: vi.fn(),
  search: vi.fn(),
  getByCategory: vi.fn(),
  checkAvailability: vi.fn(),
};

export const mockCategoryService = {
  getAll: vi.fn(),
  getById: vi.fn(),
  create: vi.fn(),
  update: vi.fn(),
  delete: vi.fn(),
};

export const mockOrderService = {
  getAll: vi.fn(),
  getById: vi.fn(),
  create: vi.fn(),
  getMyOrders: vi.fn(),
  updateStatus: vi.fn(),
  cancel: vi.fn(),
  confirmDelivery: vi.fn(),
};

export const mockStatsService = {
  getDashboard: vi.fn(),
};

export const mockUserService = {
  getAll: vi.fn(),
  getById: vi.fn(),
  getUserOrders: vi.fn(),
  updateRole: vi.fn(),
  delete: vi.fn(),
};

export const mockUploadService = {
  uploadImage: vi.fn(),
  deleteImage: vi.fn(),
  deleteByPath: vi.fn(),
  getImageUrl: vi.fn(),
};

export const resetAllMocks = () => {
  [
    mockAuthService,
    mockProductService,
    mockCategoryService,
    mockOrderService,
    mockStatsService,
    mockUserService,
    mockUploadService,
  ].forEach((service) => {
    Object.values(service).forEach((mock) => mock.mockReset());
  });
};
