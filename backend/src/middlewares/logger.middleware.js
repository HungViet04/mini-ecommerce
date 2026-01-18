/**
 * Request Logger Middleware
 * Logs incoming requests for debugging and monitoring
 */
const config = require('../config');
const logger = require('../utils/logger');

/**
 * Request logger middleware
 * @param {Object} req - Express request
 * @param {Object} res - Express response
 * @param {Function} next - Next middleware
 */
const requestLogger = (req, res, next) => {
  const startTime = Date.now();

  // Log request on response finish
  res.on('finish', () => {
    const duration = Date.now() - startTime;
    
    logger.http({
      method: req.method,
      url: req.originalUrl,
      status: res.statusCode,
      duration,
      userId: req.user?.id || null,
    });

    // Log detailed info in development for errors
    if (config.env === 'development' && res.statusCode >= 400) {
      logger.debug('Request details', {
        ip: req.ip || req.connection.remoteAddress,
        userAgent: req.get('User-Agent'),
      });
    }
  });

  next();
};

/**
 * Request ID middleware - adds unique ID to each request
 */
const requestId = (req, res, next) => {
  const id = `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  req.id = id;
  res.setHeader('X-Request-ID', id);
  next();
};

module.exports = {
  requestLogger,
  requestId,
};
