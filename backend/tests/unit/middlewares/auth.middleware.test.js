/**
 * Auth Middleware Tests
 * Tests for authentication middleware
 */
const jwt = require('jsonwebtoken');

// Mock config before importing middleware
jest.mock('../../../src/config', () => ({
  jwt: {
    accessSecret: 'test-jwt-secret',
    accessExpiresIn: '1h',
  },
}));

const { authenticate, optionalAuth } = require('../../../src/middlewares/auth.middleware');
const { AuthenticationError } = require('../../../src/errors');

// Use the same secret as mocked config
const TEST_JWT_SECRET = 'test-jwt-secret';

describe('Auth Middleware', () => {
  const mockRequest = (headers = {}) => ({
    headers,
  });

  const mockResponse = () => {
    const res = {};
    res.status = jest.fn().mockReturnValue(res);
    res.json = jest.fn().mockReturnValue(res);
    return res;
  };

  const mockNext = () => jest.fn();

  const validToken = jwt.sign({ id: 1, email: 'test@example.com', role: 'user' }, TEST_JWT_SECRET, {
    expiresIn: '1h',
  });

  describe('authenticate', () => {
    it('should authenticate with valid token', () => {
      const req = mockRequest({
        authorization: `Bearer ${validToken}`,
      });
      const res = mockResponse();
      const next = mockNext();

      authenticate(req, res, next);

      expect(req.user).toBeDefined();
      expect(req.user).toHaveProperty('id', 1);
      expect(req.user).toHaveProperty('email', 'test@example.com');
      expect(next).toHaveBeenCalled();
    });

    it('should throw AuthenticationError when no token provided', () => {
      const req = mockRequest({});
      const res = mockResponse();
      const next = mockNext();

      expect(() => authenticate(req, res, next)).toThrow(AuthenticationError);
    });

    it('should throw AuthenticationError when no authorization header', () => {
      const req = mockRequest({});
      const res = mockResponse();
      const next = mockNext();

      expect(() => authenticate(req, res, next)).toThrow(AuthenticationError);
    });

    it('should throw AuthenticationError for invalid token format', () => {
      const req = mockRequest({
        authorization: 'InvalidFormat token123',
      });
      const res = mockResponse();
      const next = mockNext();

      expect(() => authenticate(req, res, next)).toThrow(AuthenticationError);
    });

    it('should throw AuthenticationError for malformed Bearer token', () => {
      const req = mockRequest({
        authorization: 'Bearer',
      });
      const res = mockResponse();
      const next = mockNext();

      expect(() => authenticate(req, res, next)).toThrow(AuthenticationError);
    });

    it('should throw AuthenticationError for invalid token', () => {
      const req = mockRequest({
        authorization: 'Bearer invalid-token',
      });
      const res = mockResponse();
      const next = mockNext();

      expect(() => authenticate(req, res, next)).toThrow(AuthenticationError);
    });

    it('should throw AuthenticationError for expired token', () => {
      const expiredToken = jwt.sign(
        { id: 1, email: 'test@example.com' },
        TEST_JWT_SECRET,
        { expiresIn: '-1h' } // Already expired
      );

      const req = mockRequest({
        authorization: `Bearer ${expiredToken}`,
      });
      const res = mockResponse();
      const next = mockNext();

      expect(() => authenticate(req, res, next)).toThrow(AuthenticationError);
    });

    it('should throw AuthenticationError for token signed with wrong secret', () => {
      const wrongSecretToken = jwt.sign({ id: 1, email: 'test@example.com' }, 'wrong-secret', {
        expiresIn: '1h',
      });

      const req = mockRequest({
        authorization: `Bearer ${wrongSecretToken}`,
      });
      const res = mockResponse();
      const next = mockNext();

      expect(() => authenticate(req, res, next)).toThrow(AuthenticationError);
    });
  });

  describe('optionalAuth', () => {
    it('should set user when valid token provided', () => {
      const req = mockRequest({
        authorization: `Bearer ${validToken}`,
      });
      const res = mockResponse();
      const next = mockNext();

      optionalAuth(req, res, next);

      expect(req.user).toBeDefined();
      expect(req.user).toHaveProperty('id', 1);
      expect(next).toHaveBeenCalled();
    });

    it('should set user to null when no token provided', () => {
      const req = mockRequest({});
      const res = mockResponse();
      const next = mockNext();

      optionalAuth(req, res, next);

      expect(req.user).toBeNull();
      expect(next).toHaveBeenCalled();
    });

    it('should set user to null for invalid token format', () => {
      const req = mockRequest({
        authorization: 'InvalidFormat',
      });
      const res = mockResponse();
      const next = mockNext();

      optionalAuth(req, res, next);

      expect(req.user).toBeNull();
      expect(next).toHaveBeenCalled();
    });

    it('should set user to null for invalid token', () => {
      const req = mockRequest({
        authorization: 'Bearer invalid-token',
      });
      const res = mockResponse();
      const next = mockNext();

      optionalAuth(req, res, next);

      expect(req.user).toBeNull();
      expect(next).toHaveBeenCalled();
    });

    it('should set user to null for expired token', () => {
      const expiredToken = jwt.sign({ id: 1, email: 'test@example.com' }, TEST_JWT_SECRET, {
        expiresIn: '-1h',
      });

      const req = mockRequest({
        authorization: `Bearer ${expiredToken}`,
      });
      const res = mockResponse();
      const next = mockNext();

      optionalAuth(req, res, next);

      expect(req.user).toBeNull();
      expect(next).toHaveBeenCalled();
    });
  });
});
