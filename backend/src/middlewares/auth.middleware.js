/**
 * Authentication Middleware
 * Verifies JWT token and attaches user to request
 */
const jwt = require('jsonwebtoken');
const config = require('../config');
const { AuthenticationError } = require('../errors');

/**
 * Authenticate user via JWT token
 * @param {Object} req - Express request
 * @param {Object} res - Express response
 * @param {Function} next - Next middleware
 */
const authenticate = (req, res, next) => {
  const authHeader = req.headers.authorization;

  if (!authHeader) {
    throw new AuthenticationError('Không có token được cung cấp', 'NO_TOKEN');
  }

  const parts = authHeader.split(' ');
  if (parts.length !== 2 || !/^Bearer$/i.test(parts[0])) {
    throw new AuthenticationError('Định dạng token không hợp lệ', 'INVALID_TOKEN');
  }

  const token = parts[1];

  try {
    const decoded = jwt.verify(token, config.jwt.accessSecret);
    req.user = decoded;
    next();
  } catch (error) {
    if (error.name === 'TokenExpiredError') {
      throw new AuthenticationError('Token đã hết hạn', 'TOKEN_EXPIRED');
    }
    throw new AuthenticationError('Token không hợp lệ', 'INVALID_TOKEN');
  }
};

/**
 * Optional authentication - attach user if token present, but don't require it
 * @param {Object} req - Express request
 * @param {Object} res - Express response
 * @param {Function} next - Next middleware
 */
const optionalAuth = (req, res, next) => {
  const authHeader = req.headers.authorization;

  if (!authHeader) {
    req.user = null;
    return next();
  }

  const parts = authHeader.split(' ');
  if (parts.length !== 2 || !/^Bearer$/i.test(parts[0])) {
    req.user = null;
    return next();
  }

  const token = parts[1];

  try {
    const decoded = jwt.verify(token, config.jwt.accessSecret);
    req.user = decoded;
  } catch (error) {
    req.user = null;
  }

  next();
};

module.exports = {
  authenticate,
  optionalAuth,
};
