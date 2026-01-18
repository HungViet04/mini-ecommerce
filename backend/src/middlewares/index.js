/**
 * Middlewares Index
 * Export all middleware modules
 */
const { authenticate, optionalAuth } = require('./auth.middleware');
const { authorize, adminOnly, authenticated } = require('./role.middleware');
const { errorHandler, notFoundHandler } = require('./error.middleware');
const { validate, validateBody, validateQuery, validateParams } = require('./validate.middleware');
const { requestLogger, requestId } = require('./logger.middleware');

module.exports = {
  // Authentication
  authenticate,
  optionalAuth,

  // Authorization
  authorize,
  adminOnly,
  authenticated,

  // Error handling
  errorHandler,
  notFoundHandler,

  // Validation
  validate,
  validateBody,
  validateQuery,
  validateParams,

  // Logging
  requestLogger,
  requestId,
};
