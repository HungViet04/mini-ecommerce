/**
 * Role Authorization Middleware
 * Checks if user has required role(s)
 */
const { AuthorizationError } = require('../errors');
const { USER_ROLES } = require('../constants');

/**
 * Create role authorization middleware
 * @param {...string} allowedRoles - Allowed roles
 * @returns {Function} Middleware function
 */
const authorize = (...allowedRoles) => {
  // Normalize roles to lowercase
  const normalizedRoles = allowedRoles.map((role) => 
    String(role || '').toLowerCase()
  );

  return (req, res, next) => {
    if (!req.user) {
      throw new AuthorizationError('Yêu cầu xác thực');
    }

    const userRole = String(req.user.role || '').toLowerCase();

    if (!normalizedRoles.includes(userRole)) {
      throw new AuthorizationError(
        `Truy cập bị từ chối. Yêu cầu quyền: ${allowedRoles.join(' hoặc ')}`
      );
    }

    next();
  };
};

/**
 * Admin only middleware
 */
const adminOnly = authorize(USER_ROLES.ADMIN);

/**
 * User or Admin middleware
 */
const authenticated = authorize(USER_ROLES.USER, USER_ROLES.ADMIN);

module.exports = {
  authorize,
  adminOnly,
  authenticated,
};
