/**
 * Role Middleware Tests
 * Tests for role authorization middleware
 */
const { authorize, adminOnly, authenticated } = require('../../../src/middlewares/role.middleware');
const { AuthorizationError } = require('../../../src/errors');

describe('Role Middleware', () => {
  const mockRequest = (user = null) => ({
    user,
  });

  const mockResponse = () => {
    const res = {};
    res.status = jest.fn().mockReturnValue(res);
    res.json = jest.fn().mockReturnValue(res);
    return res;
  };

  const mockNext = () => jest.fn();

  describe('authorize', () => {
    it('should allow access when user has required role', () => {
      const middleware = authorize('admin');
      const req = mockRequest({ id: 1, role: 'admin' });
      const res = mockResponse();
      const next = mockNext();

      middleware(req, res, next);

      expect(next).toHaveBeenCalled();
    });

    it('should allow access for any of multiple allowed roles', () => {
      const middleware = authorize('user', 'admin');
      const req = mockRequest({ id: 1, role: 'user' });
      const res = mockResponse();
      const next = mockNext();

      middleware(req, res, next);

      expect(next).toHaveBeenCalled();
    });

    it('should throw AuthorizationError when user is not authenticated', () => {
      const middleware = authorize('admin');
      const req = mockRequest(null);
      const res = mockResponse();
      const next = mockNext();

      expect(() => middleware(req, res, next)).toThrow(AuthorizationError);
    });

    it('should throw AuthorizationError when user does not have required role', () => {
      const middleware = authorize('admin');
      const req = mockRequest({ id: 1, role: 'user' });
      const res = mockResponse();
      const next = mockNext();

      expect(() => middleware(req, res, next)).toThrow(AuthorizationError);
    });

    it('should be case-insensitive for role comparison', () => {
      const middleware = authorize('ADMIN');
      const req = mockRequest({ id: 1, role: 'admin' });
      const res = mockResponse();
      const next = mockNext();

      middleware(req, res, next);

      expect(next).toHaveBeenCalled();
    });

    it('should handle mixed case roles', () => {
      const middleware = authorize('Admin', 'User');
      const req = mockRequest({ id: 1, role: 'USER' });
      const res = mockResponse();
      const next = mockNext();

      middleware(req, res, next);

      expect(next).toHaveBeenCalled();
    });

    it('should handle undefined role in user object', () => {
      const middleware = authorize('admin');
      const req = mockRequest({ id: 1 }); // No role property
      const res = mockResponse();
      const next = mockNext();

      expect(() => middleware(req, res, next)).toThrow(AuthorizationError);
    });
  });

  describe('adminOnly', () => {
    it('should allow access for admin', () => {
      const req = mockRequest({ id: 1, role: 'admin' });
      const res = mockResponse();
      const next = mockNext();

      adminOnly(req, res, next);

      expect(next).toHaveBeenCalled();
    });

    it('should deny access for user role', () => {
      const req = mockRequest({ id: 1, role: 'user' });
      const res = mockResponse();
      const next = mockNext();

      expect(() => adminOnly(req, res, next)).toThrow(AuthorizationError);
    });

    it('should deny access when not authenticated', () => {
      const req = mockRequest(null);
      const res = mockResponse();
      const next = mockNext();

      expect(() => adminOnly(req, res, next)).toThrow(AuthorizationError);
    });
  });

  describe('authenticated', () => {
    it('should allow access for user role', () => {
      const req = mockRequest({ id: 1, role: 'user' });
      const res = mockResponse();
      const next = mockNext();

      authenticated(req, res, next);

      expect(next).toHaveBeenCalled();
    });

    it('should allow access for admin role', () => {
      const req = mockRequest({ id: 1, role: 'admin' });
      const res = mockResponse();
      const next = mockNext();

      authenticated(req, res, next);

      expect(next).toHaveBeenCalled();
    });

    it('should deny access for unknown role', () => {
      const req = mockRequest({ id: 1, role: 'guest' });
      const res = mockResponse();
      const next = mockNext();

      expect(() => authenticated(req, res, next)).toThrow(AuthorizationError);
    });

    it('should deny access when not authenticated', () => {
      const req = mockRequest(null);
      const res = mockResponse();
      const next = mockNext();

      expect(() => authenticated(req, res, next)).toThrow(AuthorizationError);
    });
  });
});
