/**
 * Error Handler Tests
 * Tests for centralized error handling
 */

const {
  AppError,
  NotFoundError,
  ValidationError,
  AuthenticationError,
  AuthorizationError,
} = require('../../../src/errors');
const { errorHandler } = require('../../../src/middlewares/error.middleware');

describe('Custom Error Classes', () => {
  describe('AppError', () => {
    it('should create error with message and status', () => {
      const error = new AppError('Something went wrong', 500);

      expect(error.message).toBe('Something went wrong');
      expect(error.statusCode).toBe(500);
      expect(error.isOperational).toBe(true);
    });

    it('should default to 500 status', () => {
      const error = new AppError('Error');

      expect(error.statusCode).toBe(500);
    });

    it('should be instance of Error', () => {
      const error = new AppError('Error');

      expect(error).toBeInstanceOf(Error);
    });

    it('should capture stack trace', () => {
      const error = new AppError('Error');

      expect(error.stack).toBeDefined();
    });
  });

  describe('NotFoundError', () => {
    it('should create 404 error', () => {
      const error = new NotFoundError('Product');

      expect(error.message).toBe('Sản phẩm không tồn tại');
      expect(error.statusCode).toBe(404);
    });

    it('should have default message', () => {
      const error = new NotFoundError();

      expect(error.message).toBe('Tài nguyên không tồn tại');
    });
  });

  describe('ValidationError', () => {
    it('should create 400 error', () => {
      const error = new ValidationError('Invalid input');

      expect(error.message).toBe('Invalid input');
      expect(error.statusCode).toBe(400);
    });

    it('should include validation details', () => {
      const details = [{ field: 'email', message: 'Invalid email' }];
      const error = new ValidationError('Validation failed', details);

      expect(error.details).toEqual(details);
    });
  });

  describe('AuthenticationError', () => {
    it('should create 401 error', () => {
      const error = new AuthenticationError('Not authenticated');

      expect(error.message).toBe('Not authenticated');
      expect(error.statusCode).toBe(401);
    });
  });

  describe('AuthorizationError', () => {
    it('should create 403 error', () => {
      const error = new AuthorizationError('Access denied');

      expect(error.message).toBe('Access denied');
      expect(error.statusCode).toBe(403);
    });
  });
});

describe('Error Handler Middleware', () => {
  let mockReq, mockRes, mockNext;

  beforeEach(() => {
    mockReq = {};
    mockRes = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn(),
    };
    mockNext = jest.fn();
  });

  describe('Operational Errors', () => {
    it('should handle AppError', () => {
      const error = new AppError('Test error', 400);

      errorHandler(error, mockReq, mockRes, mockNext);

      expect(mockRes.status).toHaveBeenCalledWith(400);
      expect(mockRes.json).toHaveBeenCalledWith(
        expect.objectContaining({
          success: false,
        })
      );
    });

    it('should handle NotFoundError', () => {
      const error = new NotFoundError('User');

      errorHandler(error, mockReq, mockRes, mockNext);

      expect(mockRes.status).toHaveBeenCalledWith(404);
    });

    it('should handle ValidationError with details', () => {
      const details = [{ field: 'email', message: 'Invalid' }];
      const error = new ValidationError('Validation failed', details);

      errorHandler(error, mockReq, mockRes, mockNext);

      expect(mockRes.status).toHaveBeenCalledWith(400);
      expect(mockRes.json).toHaveBeenCalledWith(
        expect.objectContaining({
          success: false,
        })
      );
    });
  });

  describe('Programming Errors', () => {
    it('should handle generic Error', () => {
      const error = new Error('Unexpected error');

      errorHandler(error, mockReq, mockRes, mockNext);

      expect(mockRes.status).toHaveBeenCalledWith(500);
    });

    it('should not expose error details in production', () => {
      const originalEnv = process.env.NODE_ENV;
      process.env.NODE_ENV = 'production';

      const error = new Error('Database connection failed');

      errorHandler(error, mockReq, mockRes, mockNext);

      expect(mockRes.json).toHaveBeenCalledWith(
        expect.objectContaining({
          success: false,
          error: expect.objectContaining({
            message: expect.any(String),
          }),
        })
      );

      process.env.NODE_ENV = originalEnv;
    });
  });

  describe('MySQL Errors', () => {
    it('should handle duplicate entry error', () => {
      const error = new Error('Duplicate entry');
      error.code = 'ER_DUP_ENTRY';

      errorHandler(error, mockReq, mockRes, mockNext);

      expect(mockRes.status).toHaveBeenCalledWith(409);
    });

    it('should handle connection error', () => {
      const error = new Error('Connection refused');
      error.code = 'ECONNREFUSED';

      errorHandler(error, mockReq, mockRes, mockNext);

      expect(mockRes.status).toHaveBeenCalledWith(500);
    });
  });

  describe('JWT Errors', () => {
    it('should handle JsonWebTokenError', () => {
      const error = new Error('jwt malformed');
      error.name = 'JsonWebTokenError';

      errorHandler(error, mockReq, mockRes, mockNext);

      expect(mockRes.status).toHaveBeenCalledWith(401);
    });

    it('should handle TokenExpiredError', () => {
      const error = new Error('jwt expired');
      error.name = 'TokenExpiredError';

      errorHandler(error, mockReq, mockRes, mockNext);

      expect(mockRes.status).toHaveBeenCalledWith(401);
    });
  });
});
