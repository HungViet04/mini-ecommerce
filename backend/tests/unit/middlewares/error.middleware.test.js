/**
 * Error Middleware Tests
 * Tests for global error handler middleware
 */

// Mock config
jest.mock('../../../src/config', () => ({
  env: 'test',
}));

// Mock logger
jest.mock('../../../src/utils/logger', () => ({
  error: jest.fn(),
  warn: jest.fn(),
  info: jest.fn(),
}));

const { errorHandler } = require('../../../src/middlewares/error.middleware');
const {
  AppError,
  ValidationError,
  NotFoundError,
  AuthenticationError,
  AuthorizationError,
  ConflictError,
} = require('../../../src/errors');

describe('Error Middleware', () => {
  const mockRequest = () => ({
    method: 'GET',
    path: '/test',
    headers: {},
  });

  const mockResponse = () => {
    const res = {};
    res.status = jest.fn().mockReturnValue(res);
    res.json = jest.fn().mockReturnValue(res);
    return res;
  };

  const mockNext = () => jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('AppError handling', () => {
    it('should handle ValidationError', () => {
      const error = new ValidationError('Invalid data', [
        { field: 'email', message: 'Email format invalid' },
      ]);
      const req = mockRequest();
      const res = mockResponse();
      const next = mockNext();

      errorHandler(error, req, res, next);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          success: false,
          error: expect.objectContaining({
            message: 'Invalid data',
          }),
        })
      );
    });

    it('should handle NotFoundError', () => {
      const error = new NotFoundError('Product');
      const req = mockRequest();
      const res = mockResponse();
      const next = mockNext();

      errorHandler(error, req, res, next);

      expect(res.status).toHaveBeenCalledWith(404);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          success: false,
        })
      );
    });

    it('should handle AuthenticationError', () => {
      const error = new AuthenticationError('Invalid token');
      const req = mockRequest();
      const res = mockResponse();
      const next = mockNext();

      errorHandler(error, req, res, next);

      expect(res.status).toHaveBeenCalledWith(401);
    });

    it('should handle AuthorizationError', () => {
      const error = new AuthorizationError('Access denied');
      const req = mockRequest();
      const res = mockResponse();
      const next = mockNext();

      errorHandler(error, req, res, next);

      expect(res.status).toHaveBeenCalledWith(403);
    });

    it('should handle ConflictError', () => {
      const error = new ConflictError('Email already exists');
      const req = mockRequest();
      const res = mockResponse();
      const next = mockNext();

      errorHandler(error, req, res, next);

      expect(res.status).toHaveBeenCalledWith(409);
    });
  });

  describe('JWT error handling', () => {
    it('should handle JsonWebTokenError', () => {
      const error = new Error('jwt malformed');
      error.name = 'JsonWebTokenError';
      const req = mockRequest();
      const res = mockResponse();
      const next = mockNext();

      errorHandler(error, req, res, next);

      expect(res.status).toHaveBeenCalledWith(401);
    });

    it('should handle TokenExpiredError', () => {
      const error = new Error('jwt expired');
      error.name = 'TokenExpiredError';
      const req = mockRequest();
      const res = mockResponse();
      const next = mockNext();

      errorHandler(error, req, res, next);

      expect(res.status).toHaveBeenCalledWith(401);
    });
  });

  describe('Database error handling', () => {
    it('should handle MySQL duplicate entry error', () => {
      const error = new Error('Duplicate entry');
      error.code = 'ER_DUP_ENTRY';
      const req = mockRequest();
      const res = mockResponse();
      const next = mockNext();

      errorHandler(error, req, res, next);

      expect(res.status).toHaveBeenCalledWith(409);
    });
  });

  describe('Syntax error handling', () => {
    it('should handle JSON syntax error', () => {
      const error = new SyntaxError('Unexpected token');
      error.status = 400;
      error.body = '{"invalid json}';
      const req = mockRequest();
      const res = mockResponse();
      const next = mockNext();

      errorHandler(error, req, res, next);

      expect(res.status).toHaveBeenCalledWith(400);
    });
  });

  describe('Generic error handling', () => {
    it('should handle unknown errors with 500 status', () => {
      const error = new Error('Unknown error');
      const req = mockRequest();
      const res = mockResponse();
      const next = mockNext();

      errorHandler(error, req, res, next);

      expect(res.status).toHaveBeenCalledWith(500);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          success: false,
        })
      );
    });

    it('should use error statusCode if available', () => {
      const error = new Error('Custom error');
      error.statusCode = 422;
      const req = mockRequest();
      const res = mockResponse();
      const next = mockNext();

      errorHandler(error, req, res, next);

      expect(res.status).toHaveBeenCalledWith(422);
    });

    it('should use error status if statusCode not available', () => {
      const error = new Error('Custom error');
      error.status = 418;
      const req = mockRequest();
      const res = mockResponse();
      const next = mockNext();

      errorHandler(error, req, res, next);

      expect(res.status).toHaveBeenCalledWith(418);
    });
  });

  describe('Response structure', () => {
    it('should always return success: false', () => {
      const errors = [new ValidationError('Test'), new NotFoundError('Test'), new Error('Test')];

      errors.forEach((error) => {
        const req = mockRequest();
        const res = mockResponse();
        const next = mockNext();

        errorHandler(error, req, res, next);

        expect(res.json).toHaveBeenCalledWith(
          expect.objectContaining({
            success: false,
          })
        );
      });
    });

    it('should always include error object in response', () => {
      const error = new ValidationError('Test');
      const req = mockRequest();
      const res = mockResponse();
      const next = mockNext();

      errorHandler(error, req, res, next);

      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          error: expect.any(Object),
        })
      );
    });
  });
});
