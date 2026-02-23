/**
 * Vitest Setup File
 * Runs before all tests
 */
import { expect, afterEach, vi } from 'vitest';
import { cleanup } from '@testing-library/react';
import * as matchers from '@testing-library/jest-dom/matchers';

// Extend Vitest's expect with React Testing Library matchers
expect.extend(matchers);

// Cleanup after each test
afterEach(() => {
  cleanup();
});

// Mock window.matchMedia
Object.defineProperty(window, 'matchMedia', {
  writable: true,
  value: vi.fn().mockImplementation(query => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: vi.fn(),
    removeListener: vi.fn(),
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
    dispatchEvent: vi.fn(),
  })),
});

// Mock window.scrollTo
Object.defineProperty(window, 'scrollTo', {
  writable: true,
  value: vi.fn(),
});

// Mock localStorage
const localStorageMock = {
  getItem: vi.fn(),
  setItem: vi.fn(),
  removeItem: vi.fn(),
  clear: vi.fn(),
};
Object.defineProperty(window, 'localStorage', {
  value: localStorageMock,
});

// Mock sessionStorage
const sessionStorageMock = {
  getItem: vi.fn(),
  setItem: vi.fn(),
  removeItem: vi.fn(),
  clear: vi.fn(),
};
Object.defineProperty(window, 'sessionStorage', {
  value: sessionStorageMock,
});

// Mock IntersectionObserver
class IntersectionObserverMock {
  constructor(callback) {
    this.callback = callback;
  }
  observe = vi.fn();
  unobserve = vi.fn();
  disconnect = vi.fn();
}
Object.defineProperty(window, 'IntersectionObserver', {
  writable: true,
  value: IntersectionObserverMock,
});

// Mock ResizeObserver
class ResizeObserverMock {
  observe = vi.fn();
  unobserve = vi.fn();
  disconnect = vi.fn();
}
Object.defineProperty(window, 'ResizeObserver', {
  writable: true,
  value: ResizeObserverMock,
});

// Suppress console errors during tests (optional)
// vi.spyOn(console, 'error').mockImplementation(() => {});

// Global test utilities
global.testUtils = {
  /**
   * Create a mock user object
   */
  createMockUser: (overrides = {}) => ({
    id: 1,
    name: 'Test User',
    email: 'test@example.com',
    role: 'user',
    ...overrides,
  }),

  /**
   * Create a mock admin object
   */
  createMockAdmin: (overrides = {}) => ({
    id: 1,
    name: 'Admin User',
    email: 'admin@example.com',
    role: 'admin',
    ...overrides,
  }),

  /**
   * Create a mock product object
   */
  createMockProduct: (overrides = {}) => ({
    id: 1,
    name: 'Test Product',
    description: 'Test description',
    price: 100000,
    stock: 50,
    categoryId: 1,
    imageUrl: '/images/product.jpg',
    ...overrides,
  }),

  /**
   * Create a mock cart item
   */
  createMockCartItem: (overrides = {}) => ({
    id: 1,
    name: 'Test Product',
    price: 100000,
    quantity: 1,
    imageUrl: '/images/product.jpg',
    ...overrides,
  }),

  /**
   * Create a mock order
   */
  createMockOrder: (overrides = {}) => ({
    id: 1,
    userId: 1,
    total: 130000,
    status: 'pending',
    items: [],
    createdAt: new Date().toISOString(),
    ...overrides,
  }),
};

