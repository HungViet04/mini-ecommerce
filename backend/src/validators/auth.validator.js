/**
 * User/Auth Validators
 * Validation functions for user-related operations
 * Vietnamese error messages
 */
const { ValidationError } = require('../errors');
const {
  isValidEmail,
  hasMinLength,
  hasMaxLength,
  sanitizeString,
  VALIDATION_RULES,
} = require('./common.validator');

/**
 * Validate registration data
 * @param {Object} data - Registration data
 * @returns {Object} Validated data
 * @throws {ValidationError}
 */
const validateRegister = (data) => {
  const errors = [];

  const name = sanitizeString(data.name || data.username);
  const email = sanitizeString(data.email);
  const password = data.password || '';

  // Validate name
  if (!name) {
    errors.push({ field: 'name', message: 'Vui lòng nhập họ tên' });
  } else if (!hasMinLength(name, VALIDATION_RULES.NAME_MIN_LENGTH)) {
    errors.push({ field: 'name', message: `Họ tên phải có ít nhất ${VALIDATION_RULES.NAME_MIN_LENGTH} ký tự` });
  } else if (!hasMaxLength(name, VALIDATION_RULES.NAME_MAX_LENGTH)) {
    errors.push({ field: 'name', message: `Họ tên không được vượt quá ${VALIDATION_RULES.NAME_MAX_LENGTH} ký tự` });
  }

  // Validate email
  if (!email) {
    errors.push({ field: 'email', message: 'Vui lòng nhập email' });
  } else if (!isValidEmail(email)) {
    errors.push({ field: 'email', message: 'Email không đúng định dạng' });
  }

  // Validate password
  if (!password) {
    errors.push({ field: 'password', message: 'Vui lòng nhập mật khẩu' });
  } else if (!hasMinLength(password, VALIDATION_RULES.PASSWORD_MIN_LENGTH)) {
    errors.push({ field: 'password', message: `Mật khẩu phải có ít nhất ${VALIDATION_RULES.PASSWORD_MIN_LENGTH} ký tự` });
  } else if (!hasMaxLength(password, VALIDATION_RULES.PASSWORD_MAX_LENGTH)) {
    errors.push({ field: 'password', message: `Mật khẩu không được vượt quá ${VALIDATION_RULES.PASSWORD_MAX_LENGTH} ký tự` });
  }

  if (errors.length > 0) {
    throw new ValidationError('Dữ liệu không hợp lệ', errors);
  }

  return { name, email: email.toLowerCase(), password };
};

/**
 * Validate login data
 * @param {Object} data - Login data
 * @returns {Object} Validated data
 * @throws {ValidationError}
 */
const validateLogin = (data) => {
  const errors = [];

  const identifier = sanitizeString(data.identifier || data.email || data.username);
  const password = data.password || '';

  if (!identifier) {
    errors.push({ field: 'identifier', message: 'Vui lòng nhập email hoặc tên đăng nhập' });
  }

  if (!password) {
    errors.push({ field: 'password', message: 'Vui lòng nhập mật khẩu' });
  }

  if (errors.length > 0) {
    throw new ValidationError('Dữ liệu không hợp lệ', errors);
  }

  return { identifier, password };
};

/**
 * Validate password change
 * @param {Object} data - Password change data
 * @returns {Object} Validated data
 * @throws {ValidationError}
 */
const validatePasswordChange = (data) => {
  const errors = [];

  const { currentPassword, newPassword, confirmPassword } = data;

  if (!currentPassword) {
    errors.push({ field: 'currentPassword', message: 'Vui lòng nhập mật khẩu hiện tại' });
  }

  if (!newPassword) {
    errors.push({ field: 'newPassword', message: 'Vui lòng nhập mật khẩu mới' });
  } else if (!hasMinLength(newPassword, VALIDATION_RULES.PASSWORD_MIN_LENGTH)) {
    errors.push({ field: 'newPassword', message: `Mật khẩu mới phải có ít nhất ${VALIDATION_RULES.PASSWORD_MIN_LENGTH} ký tự` });
  }

  if (newPassword !== confirmPassword) {
    errors.push({ field: 'confirmPassword', message: 'Mật khẩu xác nhận không khớp' });
  }

  if (errors.length > 0) {
    throw new ValidationError('Dữ liệu không hợp lệ', errors);
  }

  return { currentPassword, newPassword };
};

module.exports = {
  validateRegister,
  validateLogin,
  validatePasswordChange,
};
