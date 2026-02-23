/**
 * Common Validator Unit Tests
 */
const {
  isValidEmail,
  isValidPhone,
  hasMinLength,
  hasMaxLength,
  isPositiveNumber,
  isNonNegativeNumber,
  isPositiveInteger,
  isNonNegativeInteger,
  sanitizeString,
  validateRequired,
  VALIDATION_RULES,
} = require('../../../src/validators/common.validator');

describe('Common Validator', () => {
  // ── isValidEmail ────────────────────────────────────────
  describe('isValidEmail', () => {
    it('should return true for valid emails', () => {
      expect(isValidEmail('user@example.com')).toBe(true);
      expect(isValidEmail('a@b.co')).toBe(true);
    });

    it('should return false for invalid emails', () => {
      expect(isValidEmail('')).toBe(false);
      expect(isValidEmail('notanemail')).toBe(false);
      expect(isValidEmail('@no-local.com')).toBe(false);
      expect(isValidEmail('no-domain@')).toBe(false);
    });

    it('should return false for null/undefined/non-string', () => {
      expect(isValidEmail(null)).toBe(false);
      expect(isValidEmail(undefined)).toBe(false);
      expect(isValidEmail(123)).toBe(false);
    });
  });

  // ── isValidPhone ────────────────────────────────────────
  describe('isValidPhone', () => {
    it('should return true for valid Vietnamese phone numbers', () => {
      expect(isValidPhone('0901234567')).toBe(true);
      expect(isValidPhone('0351234567')).toBe(true);
    });

    it('should return false for invalid phones', () => {
      expect(isValidPhone('')).toBe(false);
      expect(isValidPhone('123')).toBe(false);
      expect(isValidPhone(null)).toBe(false);
    });
  });

  // ── hasMinLength ────────────────────────────────────────
  describe('hasMinLength', () => {
    it('should return true when string meets minimum length', () => {
      expect(hasMinLength('hello', 3)).toBe(true);
      expect(hasMinLength('ab', 2)).toBe(true);
    });

    it('should return false when too short', () => {
      expect(hasMinLength('a', 3)).toBe(false);
    });

    it('should return false for non-string/falsy values', () => {
      expect(hasMinLength(null, 1)).toBe(false);
      expect(hasMinLength('', 1)).toBe(false);
      expect(hasMinLength(undefined, 1)).toBe(false);
    });

    it('should trim whitespace before checking', () => {
      expect(hasMinLength('  a  ', 2)).toBe(false);
    });
  });

  // ── hasMaxLength ────────────────────────────────────────
  describe('hasMaxLength', () => {
    it('should return true when within max length', () => {
      expect(hasMaxLength('abc', 5)).toBe(true);
    });

    it('should return false when exceeding max length', () => {
      expect(hasMaxLength('toolong', 3)).toBe(false);
    });

    it('should return true for falsy input', () => {
      expect(hasMaxLength(null, 10)).toBe(true);
      expect(hasMaxLength('', 10)).toBe(true);
    });
  });

  // ── isPositiveNumber ────────────────────────────────────
  describe('isPositiveNumber', () => {
    it('should return true for positive numbers', () => {
      expect(isPositiveNumber(1)).toBe(true);
      expect(isPositiveNumber(0.5)).toBe(true);
      expect(isPositiveNumber('10')).toBe(true);
    });

    it('should return false for zero, negative, non-numbers', () => {
      expect(isPositiveNumber(0)).toBe(false);
      expect(isPositiveNumber(-1)).toBe(false);
      expect(isPositiveNumber('abc')).toBe(false);
      expect(isPositiveNumber(NaN)).toBe(false);
      expect(isPositiveNumber(Infinity)).toBe(false);
    });
  });

  // ── isNonNegativeNumber ─────────────────────────────────
  describe('isNonNegativeNumber', () => {
    it('should return true for zero and positive numbers', () => {
      expect(isNonNegativeNumber(0)).toBe(true);
      expect(isNonNegativeNumber(5)).toBe(true);
    });

    it('should return false for negative numbers', () => {
      expect(isNonNegativeNumber(-1)).toBe(false);
    });
  });

  // ── isPositiveInteger ───────────────────────────────────
  describe('isPositiveInteger', () => {
    it('should return true for positive integers', () => {
      expect(isPositiveInteger(1)).toBe(true);
      expect(isPositiveInteger('5')).toBe(true);
    });

    it('should return false for zero, floats, negatives', () => {
      expect(isPositiveInteger(0)).toBe(false);
      expect(isPositiveInteger(1.5)).toBe(false);
      expect(isPositiveInteger(-1)).toBe(false);
    });
  });

  // ── isNonNegativeInteger ────────────────────────────────
  describe('isNonNegativeInteger', () => {
    it('should return true for zero and positive integers', () => {
      expect(isNonNegativeInteger(0)).toBe(true);
      expect(isNonNegativeInteger(10)).toBe(true);
    });

    it('should return false for negatives and floats', () => {
      expect(isNonNegativeInteger(-1)).toBe(false);
      expect(isNonNegativeInteger(1.5)).toBe(false);
    });
  });

  // ── sanitizeString ──────────────────────────────────────
  describe('sanitizeString', () => {
    it('should trim whitespace', () => {
      expect(sanitizeString('  hello  ')).toBe('hello');
    });

    it('should return empty string for non-string input', () => {
      expect(sanitizeString(null)).toBe('');
      expect(sanitizeString(undefined)).toBe('');
      expect(sanitizeString(123)).toBe('');
    });
  });

  // ── validateRequired ────────────────────────────────────
  describe('validateRequired', () => {
    it('should return isValid true when all fields present', () => {
      const result = validateRequired({ name: 'A', email: 'a@b.c' }, ['name', 'email']);
      expect(result.isValid).toBe(true);
      expect(result.missing).toEqual([]);
    });

    it('should return missing field names', () => {
      const result = validateRequired({ name: '' }, ['name', 'email']);
      expect(result.isValid).toBe(false);
      expect(result.missing).toContain('name');
      expect(result.missing).toContain('email');
    });

    it('should detect null and undefined as missing', () => {
      const result = validateRequired({ a: null, b: undefined }, ['a', 'b']);
      expect(result.isValid).toBe(false);
      expect(result.missing).toEqual(['a', 'b']);
    });
  });

  // ── VALIDATION_RULES ────────────────────────────────────
  describe('VALIDATION_RULES', () => {
    it('should export expected rules', () => {
      expect(VALIDATION_RULES).toHaveProperty('PASSWORD_MIN_LENGTH');
      expect(VALIDATION_RULES).toHaveProperty('PASSWORD_MAX_LENGTH');
      expect(VALIDATION_RULES).toHaveProperty('NAME_MIN_LENGTH');
      expect(VALIDATION_RULES).toHaveProperty('NAME_MAX_LENGTH');
    });
  });
});

