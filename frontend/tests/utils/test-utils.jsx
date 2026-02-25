/**
 * Test Utilities
 * Helper functions for testing React components
 */
import React from 'react';
import { render } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import { AuthProvider } from '../src/contexts/AuthContext';
import { CartProvider } from '../src/contexts/CartContext';
import { vi } from 'vitest';

/**
 * Custom render function that wraps components with providers
 */
export const renderWithProviders = (ui, options = {}) => {
  const { initialAuthState = null, initialCartState = [], route = '/', ...renderOptions } = options;

  // Set initial route
  window.history.pushState({}, 'Test page', route);

  const Wrapper = ({ children }) => {
    return (
      <BrowserRouter>
        <AuthProvider initialUser={initialAuthState}>
          <CartProvider initialItems={initialCartState}>{children}</CartProvider>
        </AuthProvider>
      </BrowserRouter>
    );
  };

  return {
    ...render(ui, { wrapper: Wrapper, ...renderOptions }),
  };
};

/**
 * Render with Router only
 */
export const renderWithRouter = (ui, { route = '/' } = {}) => {
  window.history.pushState({}, 'Test page', route);

  return render(<BrowserRouter>{ui}</BrowserRouter>);
};

/**
 * Wait for async operations
 */
export const waitForAsync = (ms = 0) => new Promise((resolve) => setTimeout(resolve, ms));

/**
 * Mock fetch responses
 */
export const mockFetch = (data, options = {}) => {
  const { status = 200, ok = true } = options;

  return vi.fn().mockResolvedValue({
    ok,
    status,
    json: () => Promise.resolve(data),
  });
};

/**
 * Mock fetch error
 */
export const mockFetchError = (message = 'Network error') => {
  return vi.fn().mockRejectedValue(new Error(message));
};

/**
 * Create mock API response
 */
export const createApiResponse = (data, success = true) => ({
  success,
  data,
  message: success ? 'Success' : 'Error',
});

// Re-export everything from testing-library
export * from '@testing-library/react';
export { default as userEvent } from '@testing-library/user-event';
