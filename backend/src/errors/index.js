/**
 * Custom Application Error Classes
 * Extends Error with additional properties for API error handling
 * Vietnamese error messages
 */
const { HTTP_STATUS, ERROR_CODES } = require('../constants');

/**
 * Base Application Error
 */
class AppError extends Error {
  constructor(
    message,
    statusCode = HTTP_STATUS.INTERNAL_SERVER_ERROR,
    code = ERROR_CODES.SERVER_ERROR,
    details = null
  ) {
    super(message);
    this.name = this.constructor.name;
    this.statusCode = statusCode;
    this.code = code;
    this.details = details;
    this.isOperational = true;

    Error.captureStackTrace(this, this.constructor);
  }

  toJSON() {
    return {
      code: this.code,
      message: this.message,
      ...(this.details && { details: this.details }),
    };
  }
}

/**
 * Validation Error - 400
 */
class ValidationError extends AppError {
  constructor(message = 'Dữ liệu không hợp lệ', details = null) {
    super(message, HTTP_STATUS.BAD_REQUEST, ERROR_CODES.VALIDATION_ERROR, details);
  }
}

/**
 * Authentication Error - 401
 */
class AuthenticationError extends AppError {
  constructor(message = 'Xác thực thất bại', code = ERROR_CODES.UNAUTHORIZED) {
    super(message, HTTP_STATUS.UNAUTHORIZED, code);
  }
}

/**
 * Authorization Error - 403
 */
class AuthorizationError extends AppError {
  constructor(message = 'Bạn không có quyền thực hiện thao tác này') {
    super(message, HTTP_STATUS.FORBIDDEN, ERROR_CODES.FORBIDDEN);
  }
}

/**
 * Not Found Error - 404
 */
class NotFoundError extends AppError {
  constructor(resource = 'Tài nguyên', message = null) {
    const resourceMap = {
      Product: 'Sản phẩm',
      Order: 'Đơn hàng',
      User: 'Người dùng',
      Category: 'Danh mục',
      Resource: 'Tài nguyên',
    };
    const vietnameseResource = resourceMap[resource] || resource;
    super(
      message || `${vietnameseResource} không tồn tại`,
      HTTP_STATUS.NOT_FOUND,
      ERROR_CODES.NOT_FOUND
    );
    this.resource = resource;
  }
}

/**
 * Conflict Error - 409 (duplicate entry, etc.)
 */
class ConflictError extends AppError {
  constructor(message = 'Dữ liệu đã tồn tại', details = null) {
    super(message, HTTP_STATUS.CONFLICT, ERROR_CODES.ALREADY_EXISTS, details);
  }
}

/**
 * Database Error - 500
 */
class DatabaseError extends AppError {
  constructor(message = 'Lỗi cơ sở dữ liệu', details = null) {
    super(message, HTTP_STATUS.INTERNAL_SERVER_ERROR, ERROR_CODES.DB_ERROR, details);
    this.isOperational = false;
  }
}

/**
 * Business Logic Error - 400
 */
class BusinessError extends AppError {
  constructor(message, code = ERROR_CODES.INVALID_INPUT, details = null) {
    super(message, HTTP_STATUS.BAD_REQUEST, code, details);
  }
}

/**
 * Out of Stock Error
 */
class OutOfStockError extends BusinessError {
  constructor(productId, availableStock = 0, requestedQuantity = 0) {
    super(
      `Sản phẩm #${productId} không đủ số lượng trong kho (còn ${availableStock}, yêu cầu ${requestedQuantity})`,
      ERROR_CODES.OUT_OF_STOCK,
      { productId, availableStock, requestedQuantity }
    );
  }
}

module.exports = {
  AppError,
  ValidationError,
  AuthenticationError,
  AuthorizationError,
  NotFoundError,
  ConflictError,
  DatabaseError,
  BusinessError,
  OutOfStockError,
};
