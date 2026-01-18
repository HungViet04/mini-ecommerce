/**
 * Pagination Helper
 * Parse and validate pagination parameters
 */
const config = require('../config');

/**
 * Parse pagination parameters from request query
 * @param {Object} query - Request query object
 * @returns {Object} Parsed pagination object
 */
const parsePagination = (query = {}) => {
  const { pagination } = config;

  let page = parseInt(query.page, 10) || pagination.defaultPage;
  let limit = parseInt(query.limit, 10) || pagination.defaultLimit;

  // Ensure positive values
  page = Math.max(1, page);
  limit = Math.max(1, Math.min(limit, pagination.maxLimit));

  const offset = (page - 1) * limit;

  return { page, limit, offset };
};

/**
 * Build pagination metadata
 * @param {number} total - Total count
 * @param {number} page - Current page
 * @param {number} limit - Items per page
 * @returns {Object} Pagination metadata
 */
const buildPaginationMeta = (total, page, limit) => {
  const totalPages = Math.ceil(total / limit);

  return {
    page,
    limit,
    total,
    totalPages,
    hasNextPage: page < totalPages,
    hasPrevPage: page > 1,
  };
};

module.exports = {
  parsePagination,
  buildPaginationMeta,
};
