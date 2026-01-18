/**
 * Validation utilities
 */

/**
 * Email validation
 * @param {string} email
 * @returns {boolean}
 */
export function isValidEmail(email) {
  const regex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return regex.test(email);
}

/**
 * Password validation (min 6 chars)
 * @param {string} password
 * @returns {boolean}
 */
export function isValidPassword(password) {
  return password && password.length >= 6;
}

/**
 * Required field validation
 * @param {string} value
 * @returns {boolean}
 */
export function isRequired(value) {
  return value && value.trim().length > 0;
}

/**
 * Min length validation
 * @param {string} value
 * @param {number} minLength
 * @returns {boolean}
 */
export function hasMinLength(value, minLength) {
  return value && value.length >= minLength;
}

/**
 * Validate form data
 * @param {Object} data - Form data
 * @param {Object} rules - Validation rules
 * @returns {Object} { isValid, errors }
 */
export function validateForm(data, rules) {
  const errors = {};

  for (const [field, fieldRules] of Object.entries(rules)) {
    const value = data[field];

    for (const rule of fieldRules) {
      const error = rule(value, data);
      if (error) {
        errors[field] = error;
        break;
      }
    }
  }

  return {
    isValid: Object.keys(errors).length === 0,
    errors,
  };
}
