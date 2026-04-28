/**
 * Frontend Utils Tests
 * Tests for real utility functions: validation.js, format.js, storage.js
 */
import { describe, it, expect, vi, beforeEach } from 'vitest';

// Import REAL source modules
import {
  isValidEmail,
  isValidPassword,
  isRequired,
  hasMinLength,
  validateForm,
} from '../../src/utils/validation';

import { formatPrice, formatDate, truncate, capitalize } from '../../src/utils/format';

import { tokenStorage, refreshTokenStorage, createStorage } from '../../src/utils/storage';

// ─── validation.js ──────────────────────────────────────────────

describe('Validation Utils', () => {
  describe('isValidEmail', () => {
    it('should accept valid emails', () => {
      expect(isValidEmail('user@example.com')).toBe(true);
      expect(isValidEmail('test.name@domain.co')).toBe(true);
      expect(isValidEmail('a@b.c')).toBe(true);
    });

    it('should reject invalid emails', () => {
      expect(isValidEmail('')).toBe(false);
      expect(isValidEmail('noatsign.com')).toBe(false);
      expect(isValidEmail('@nodomain')).toBe(false);
      expect(isValidEmail('user@')).toBe(false);
      expect(isValidEmail('user @example.com')).toBe(false);
    });
  });

  describe('isValidPassword', () => {
    it('should accept passwords with 6+ chars', () => {
      expect(isValidPassword('123456')).toBe(true);
      expect(isValidPassword('abcdefgh')).toBe(true);
    });

    it('should reject passwords shorter than 6 chars', () => {
      expect(isValidPassword('12345')).toBe(false);
      expect(isValidPassword('ab')).toBe(false);
    });

    it('should reject empty/falsy values', () => {
      expect(isValidPassword('')).toBe(false);
      expect(isValidPassword(null)).toBe(false);
      expect(isValidPassword(undefined)).toBe(false);
    });
  });

  describe('isRequired', () => {
    it('should accept non-empty strings', () => {
      expect(isRequired('hello')).toBeTruthy();
      expect(isRequired('  a  ')).toBeTruthy();
    });

    it('should reject empty or blank strings', () => {
      expect(isRequired('')).toBeFalsy();
      expect(isRequired('   ')).toBeFalsy();
    });

    it('should reject falsy values', () => {
      expect(isRequired(null)).toBeFalsy();
      expect(isRequired(undefined)).toBeFalsy();
    });
  });

  describe('hasMinLength', () => {
    it('should pass when value meets min length', () => {
      expect(hasMinLength('abcde', 5)).toBeTruthy();
      expect(hasMinLength('abcdef', 5)).toBeTruthy();
    });

    it('should fail when value is too short', () => {
      expect(hasMinLength('ab', 5)).toBeFalsy();
    });

    it('should fail for falsy value', () => {
      expect(hasMinLength(null, 1)).toBeFalsy();
      expect(hasMinLength(undefined, 1)).toBeFalsy();
    });
  });

  describe('validateForm', () => {
    it('should return isValid true when all rules pass', () => {
      const data = { name: 'Test', email: 'a@b.com' };
      const rules = {
        name: [(v) => (!v ? 'Required' : null)],
        email: [(v) => (!v ? 'Required' : null)],
      };

      const result = validateForm(data, rules);
      expect(result.isValid).toBe(true);
      expect(result.errors).toEqual({});
    });

    it('should return errors for failing rules', () => {
      const data = { name: '', email: 'a@b.com' };
      const rules = {
        name: [(v) => (!v ? 'Name is required' : null)],
        email: [(v) => (!v ? 'Email required' : null)],
      };

      const result = validateForm(data, rules);
      expect(result.isValid).toBe(false);
      expect(result.errors.name).toBe('Name is required');
      expect(result.errors.email).toBeUndefined();
    });

    it('should stop at first error per field', () => {
      const data = { name: '' };
      const rules = {
        name: [(v) => (!v ? 'Required' : null), (v) => (v.length < 3 ? 'Too short' : null)],
      };

      const result = validateForm(data, rules);
      expect(result.errors.name).toBe('Required');
    });

    it('should pass the full data object to each rule', () => {
      const data = { password: '123', confirm: '456' };
      const rules = {
        confirm: [
          (value, allData) => (value !== allData.password ? 'Passwords do not match' : null),
        ],
      };

      const result = validateForm(data, rules);
      expect(result.isValid).toBe(false);
      expect(result.errors.confirm).toBe('Passwords do not match');
    });
  });
});

// ─── format.js ──────────────────────────────────────────────────

describe('Format Utils', () => {
  describe('formatPrice', () => {
    it('should format price in VND by default', () => {
      const result = formatPrice(1000000);
      expect(result).toContain('1.000.000');
    });

    it('should handle zero', () => {
      const result = formatPrice(0);
      expect(result).toContain('0');
    });

    it('should accept different currency', () => {
      const result = formatPrice(100, 'USD');
      expect(result).toBeDefined();
      // Should contain the formatted number
      expect(typeof result).toBe('string');
    });
  });

  describe('formatDate', () => {
    it('should format date in Vietnamese locale', () => {
      const result = formatDate('2024-06-15T10:30:00');
      expect(typeof result).toBe('string');
      expect(result.length).toBeGreaterThan(0);
      // Should contain year
      expect(result).toContain('2024');
    });

    it('should handle Date objects', () => {
      const result = formatDate(new Date('2024-01-01'));
      expect(result).toContain('2024');
    });
  });

  describe('truncate', () => {
    it('should truncate long text', () => {
      const text = 'a'.repeat(100);
      const result = truncate(text, 50);
      expect(result).toHaveLength(53); // 50 + '...'
      expect(result.endsWith('...')).toBe(true);
    });

    it('should not truncate short text', () => {
      expect(truncate('hello', 50)).toBe('hello');
    });

    it('should use default maxLength of 50', () => {
      const text = 'a'.repeat(60);
      const result = truncate(text);
      expect(result).toHaveLength(53);
    });

    it('should handle null/empty', () => {
      expect(truncate(null)).toBeNull();
      expect(truncate('')).toBe('');
    });
  });

  describe('capitalize', () => {
    it('should capitalize first letter', () => {
      expect(capitalize('hello')).toBe('Hello');
      expect(capitalize('world test')).toBe('World test');
    });

    it('should handle single char', () => {
      expect(capitalize('a')).toBe('A');
    });

    it('should return empty for falsy input', () => {
      expect(capitalize('')).toBe('');
      expect(capitalize(null)).toBe('');
      expect(capitalize(undefined)).toBe('');
    });
  });
});

// ─── storage.js ─────────────────────────────────────────────────

describe('Storage Utils', () => {
  beforeEach(() => {
    // localStorage is mocked in setup.js
    vi.clearAllMocks();
  });

  describe('tokenStorage', () => {
    it('should get token from localStorage', () => {
      window.localStorage.getItem.mockReturnValue('my-token');
      expect(tokenStorage.get()).toBe('my-token');
      expect(window.localStorage.getItem).toHaveBeenCalledWith('ecom_access_token');
    });

    it('should set token in localStorage', () => {
      tokenStorage.set('new-token');
      expect(window.localStorage.setItem).toHaveBeenCalledWith('ecom_access_token', 'new-token');
    });

    it('should clear both tokens on clear()', () => {
      tokenStorage.clear();
      expect(window.localStorage.removeItem).toHaveBeenCalledWith('ecom_access_token');
      expect(window.localStorage.removeItem).toHaveBeenCalledWith('ecom_refresh_token');
    });
  });

  describe('refreshTokenStorage', () => {
    it('should get refresh token', () => {
      window.localStorage.getItem.mockReturnValue('refresh-123');
      expect(refreshTokenStorage.get()).toBe('refresh-123');
      expect(window.localStorage.getItem).toHaveBeenCalledWith('ecom_refresh_token');
    });

    it('should set refresh token', () => {
      refreshTokenStorage.set('refresh-456');
      expect(window.localStorage.setItem).toHaveBeenCalledWith('ecom_refresh_token', 'refresh-456');
    });

    it('should clear refresh token', () => {
      refreshTokenStorage.clear();
      expect(window.localStorage.removeItem).toHaveBeenCalledWith('ecom_refresh_token');
    });
  });

  describe('createStorage', () => {
    it('should get parsed JSON value', () => {
      window.localStorage.getItem.mockReturnValue('{"a":1}');
      const store = createStorage('mykey');
      expect(store.get()).toEqual({ a: 1 });
      expect(window.localStorage.getItem).toHaveBeenCalledWith('mykey');
    });

    it('should return null when no value stored', () => {
      window.localStorage.getItem.mockReturnValue(null);
      const store = createStorage('mykey');
      expect(store.get()).toBeNull();
    });

    it('should return null on JSON parse error', () => {
      window.localStorage.getItem.mockReturnValue('not-json');
      const store = createStorage('mykey');
      expect(store.get()).toBeNull();
    });

    it('should set value as JSON string', () => {
      const store = createStorage('mykey');
      store.set({ items: [1, 2] });
      expect(window.localStorage.setItem).toHaveBeenCalledWith(
        'mykey',
        JSON.stringify({ items: [1, 2] })
      );
    });

    it('should clear stored value', () => {
      const store = createStorage('mykey');
      store.clear();
      expect(window.localStorage.removeItem).toHaveBeenCalledWith('mykey');
    });
  });
});
