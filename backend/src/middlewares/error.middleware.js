/**
 * Global Error Handler Middleware
 * Catches all errors and sends standardized response
 */
const config = require('../config');
const { AppError } = require('../errors');
const { HTTP_STATUS, ERROR_CODES } = require('../constants');
const logger = require('../utils/logger');

/**
 * Error handler middleware
 * @param {Error} err - Error object
 * @param {Object} req - Express request
 * @param {Object} res - Express response
 * @param {Function} next - Next middleware
 */
const errorHandler = (err, req, res, next) => {
  // Log error based on environment and type
  if (config.env === 'development') {
    logger.error('Request Error', err);
  } else if (err.isOperational) {
    logger.warn('Operational Error', { message: err.message });
  } else {
    logger.error('Unexpected Error', err);
  }

  // Handle AppError (operational errors)
  if (err instanceof AppError) {
    return res.status(err.statusCode).json({
      success: false,
      error: err.toJSON(),
    });
  }

  // Handle specific error types
  if (err.name === 'JsonWebTokenError') {
    return res.status(HTTP_STATUS.UNAUTHORIZED).json({
      success: false,
      error: {
        code: ERROR_CODES.INVALID_TOKEN,
        message: 'Token không hợp lệ',
      },
    });
  }

  if (err.name === 'TokenExpiredError') {
    return res.status(HTTP_STATUS.UNAUTHORIZED).json({
      success: false,
      error: {
        code: ERROR_CODES.TOKEN_EXPIRED,
        message: 'Token đã hết hạn',
      },
    });
  }

  // Handle MySQL duplicate entry error
  if (err.code === 'ER_DUP_ENTRY') {
    return res.status(HTTP_STATUS.CONFLICT).json({
      success: false,
      error: {
        code: ERROR_CODES.DUPLICATE_ENTRY,
        message: 'Dữ liệu bị trùng lặp',
      },
    });
  }

  // Handle validation errors (from express-validator or similar)
  if (err.name === 'ValidationError') {
    return res.status(HTTP_STATUS.BAD_REQUEST).json({
      success: false,
      error: {
        code: ERROR_CODES.VALIDATION_ERROR,
        message: err.message,
        details: err.details || null,
      },
    });
  }

  // Handle syntax error in JSON body
  if (err instanceof SyntaxError && err.status === 400 && 'body' in err) {
    return res.status(HTTP_STATUS.BAD_REQUEST).json({
      success: false,
      error: {
        code: ERROR_CODES.INVALID_INPUT,
        message: 'Dữ liệu JSON không hợp lệ',
      },
    });
  }

  // Default error response (for unexpected errors)
  const statusCode = err.statusCode || err.status || HTTP_STATUS.INTERNAL_SERVER_ERROR;
  const message = config.env === 'development' ? err.message : 'Đã xảy ra lỗi không mong muốn';

  return res.status(statusCode).json({
    success: false,
    error: {
      code: ERROR_CODES.SERVER_ERROR,
      message,
      ...(config.env === 'development' && { stack: err.stack }),
    },
  });
};

/**
 * 404 Not Found handler
 */
const notFoundHandler = (req, res) => {
  res.status(HTTP_STATUS.NOT_FOUND).json({
    success: false,
    error: {
      code: ERROR_CODES.NOT_FOUND,
      message: `Đường dẫn ${req.method} ${req.originalUrl} không tìm thấy`,
    },
  });
};

module.exports = {
  errorHandler,
  notFoundHandler,
};
