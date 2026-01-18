/**
 * Validation Utilities
 * Common validation functions
 */
const { REGEX_PATTERNS, VALIDATION_RULES } = require('../constants');

/**
 * Check if value is a valid email
 * @param {string} email
 * @returns {boolean}
 */
const isValidEmail = (email) => {
  if (!email || typeof email !== 'string') return false;
  return REGEX_PATTERNS.EMAIL.test(email.toLowerCase());
};

/**
 * Check if value is a valid phone number
 * @param {string} phone
 * @returns {boolean}
 */
const isValidPhone = (phone) => {
  if (!phone || typeof phone !== 'string') return false;
  return REGEX_PATTERNS.PHONE.test(phone);
};

/**
 * Check if string meets minimum length
 * @param {string} str
 * @param {number} minLength
 * @returns {boolean}
 */
const hasMinLength = (str, minLength) => {
  if (!str || typeof str !== 'string') return false;
  return str.trim().length >= minLength;
};

/**
 * Check if string meets maximum length
 * @param {string} str
 * @param {number} maxLength
 * @returns {boolean}
 */
const hasMaxLength = (str, maxLength) => {
  if (!str || typeof str !== 'string') return true;
  return str.trim().length <= maxLength;
};

/**
 * Check if value is a positive number
 * @param {any} value
 * @returns {boolean}
 */
const isPositiveNumber = (value) => {
  const num = Number(value);
  return Number.isFinite(num) && num > 0;
};

/**
 * Check if value is a non-negative number
 * @param {any} value
 * @returns {boolean}
 */
const isNonNegativeNumber = (value) => {
  const num = Number(value);
  return Number.isFinite(num) && num >= 0;
};

/**
 * Check if value is a positive integer
 * @param {any} value
 * @returns {boolean}
 */
const isPositiveInteger = (value) => {
  const num = Number(value);
  return Number.isInteger(num) && num > 0;
};

/**
 * Check if value is a non-negative integer
 * @param {any} value
 * @returns {boolean}
 */
const isNonNegativeInteger = (value) => {
  const num = Number(value);
  return Number.isInteger(num) && num >= 0;
};

/**
 * Sanitize string input
 * @param {string} str
 * @returns {string}
 */
const sanitizeString = (str) => {
  if (!str || typeof str !== 'string') return '';
  return str.trim();
};

/**
 * Validate required fields
 * @param {Object} data - Data object
 * @param {Array<string>} fields - Required field names
 * @returns {Object} { isValid: boolean, missing: Array<string> }
 */
const validateRequired = (data, fields) => {
  const missing = [];
  for (const field of fields) {
    const value = data[field];
    if (value === undefined || value === null || value === '') {
      missing.push(field);
    }
  }

  return {
    isValid: missing.length === 0,
    missing,
  };
};

module.exports = {
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
};
