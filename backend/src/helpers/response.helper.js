/**
 * API Response Helper
 * Standardized response format for all API endpoints
 * Vietnamese messages
 */
const { HTTP_STATUS } = require('../constants');

/**
 * Success response
 * @param {Object} res - Express response object
 * @param {Object} options - Response options
 * @param {any} options.data - Response data
 * @param {string} options.message - Success message
 * @param {number} options.statusCode - HTTP status code
 * @param {Object} options.meta - Additional metadata (pagination, etc.)
 */
const success = (res, { data = null, message = 'Thành công', statusCode = HTTP_STATUS.OK, meta = null } = {}) => {
  const response = {
    success: true,
    message,
    data,
  };

  if (meta) {
    response.meta = meta;
  }

  return res.status(statusCode).json(response);
};

/**
 * Error response
 * @param {Object} res - Express response object
 * @param {Object} options - Response options
 * @param {string} options.code - Error code
 * @param {string} options.message - Error message
 * @param {number} options.statusCode - HTTP status code
 * @param {any} options.details - Error details
 */
const error = (res, { code = 'SERVER_ERROR', message = 'Đã xảy ra lỗi', statusCode = HTTP_STATUS.INTERNAL_SERVER_ERROR, details = null } = {}) => {
  const response = {
    success: false,
    error: {
      code,
      message,
    },
  };

  if (details) {
    response.error.details = details;
  }

  return res.status(statusCode).json(response);
};

/**
 * Created response (201)
 */
const created = (res, data, message = 'Tạo mới thành công') => {
  return success(res, { data, message, statusCode: HTTP_STATUS.CREATED });
};

/**
 * No Content response (204)
 */
const noContent = (res) => {
  return res.status(HTTP_STATUS.NO_CONTENT).send();
};

/**
 * Paginated response
 * @param {Object} res - Express response object
 * @param {Object} options - Response options
 * @param {Array} options.data - Array of items
 * @param {number} options.page - Current page
 * @param {number} options.limit - Items per page
 * @param {number} options.total - Total items count
 * @param {string} options.message - Success message
 */
const paginated = (res, { data, page, limit, total, message = 'Thành công' }) => {
  const totalPages = Math.ceil(total / limit);

  return success(res, {
    data,
    message,
    meta: {
      pagination: {
        page,
        limit,
        total,
        totalPages,
        hasNextPage: page < totalPages,
        hasPrevPage: page > 1,
      },
    },
  });
};

module.exports = {
  success,
  error,
  created,
  noContent,
  paginated,
};
