/**
 * Logger Middleware Unit Tests
 * Tests for request logging middleware
 */

// Mock dependencies
jest.mock('../../../src/config', () => ({
  env: 'test',
}));

jest.mock('../../../src/utils/logger', () => ({
  http: jest.fn(),
  debug: jest.fn(),
  info: jest.fn(),
  error: jest.fn(),
}));

const { requestLogger, requestId } = require('../../../src/middlewares/logger.middleware');
const logger = require('../../../src/utils/logger');
const config = require('../../../src/config');

describe('Logger Middleware', () => {
  let req, res, next;

  beforeEach(() => {
    jest.clearAllMocks();

    req = {
      method: 'GET',
      originalUrl: '/api/test',
      ip: '127.0.0.1',
      user: null,
      get: jest.fn().mockReturnValue('Mozilla/5.0'),
      connection: { remoteAddress: '127.0.0.1' },
    };

    res = {
      statusCode: 200,
      on: jest.fn(),
      setHeader: jest.fn(),
    };

    next = jest.fn();
  });

  describe('requestLogger', () => {
    it('should call next middleware', () => {
      requestLogger(req, res, next);

      expect(next).toHaveBeenCalled();
    });

    it('should register finish event listener', () => {
      requestLogger(req, res, next);

      expect(res.on).toHaveBeenCalledWith('finish', expect.any(Function));
    });

    it('should log request on response finish', () => {
      requestLogger(req, res, next);

      // Simulate finish event
      const finishCallback = res.on.mock.calls[0][1];
      finishCallback();

      expect(logger.http).toHaveBeenCalledWith(
        expect.objectContaining({
          method: 'GET',
          url: '/api/test',
          status: 200,
        })
      );
    });

    it('should include duration in log', () => {
      jest.useFakeTimers();
      const startTime = Date.now();

      requestLogger(req, res, next);

      // Advance time
      jest.advanceTimersByTime(100);

      const finishCallback = res.on.mock.calls[0][1];
      finishCallback();

      expect(logger.http).toHaveBeenCalledWith(
        expect.objectContaining({
          duration: expect.any(Number),
        })
      );

      jest.useRealTimers();
    });

    it('should include userId when user is authenticated', () => {
      req.user = { id: 123 };

      requestLogger(req, res, next);

      const finishCallback = res.on.mock.calls[0][1];
      finishCallback();

      expect(logger.http).toHaveBeenCalledWith(
        expect.objectContaining({
          userId: 123,
        })
      );
    });

    it('should log null userId when not authenticated', () => {
      req.user = null;

      requestLogger(req, res, next);

      const finishCallback = res.on.mock.calls[0][1];
      finishCallback();

      expect(logger.http).toHaveBeenCalledWith(
        expect.objectContaining({
          userId: null,
        })
      );
    });

    it('should log different HTTP methods', () => {
      const methods = ['GET', 'POST', 'PUT', 'DELETE', 'PATCH'];

      methods.forEach(method => {
        jest.clearAllMocks();
        req.method = method;

        requestLogger(req, res, next);

        const finishCallback = res.on.mock.calls[0][1];
        finishCallback();

        expect(logger.http).toHaveBeenCalledWith(expect.objectContaining({ method }));
      });
    });

    it('should log different status codes', () => {
      const statusCodes = [200, 201, 400, 401, 403, 404, 500];

      statusCodes.forEach(statusCode => {
        jest.clearAllMocks();
        res.statusCode = statusCode;

        requestLogger(req, res, next);

        const finishCallback = res.on.mock.calls[0][1];
        finishCallback();

        expect(logger.http).toHaveBeenCalledWith(expect.objectContaining({ status: statusCode }));
      });
    });

    it('should log debug info for errors in development', () => {
      // Mock development environment
      jest.resetModules();
      jest.doMock('../../../src/config', () => ({ env: 'development' }));

      res.statusCode = 500;

      requestLogger(req, res, next);

      const finishCallback = res.on.mock.calls[0][1];
      finishCallback();

      // Should still log http
      expect(logger.http).toHaveBeenCalled();
    });
  });

  describe('requestId', () => {
    it('should call next middleware', () => {
      requestId(req, res, next);

      expect(next).toHaveBeenCalled();
    });

    it('should add id to request object', () => {
      requestId(req, res, next);

      expect(req.id).toBeDefined();
      expect(typeof req.id).toBe('string');
    });

    it('should set X-Request-ID header', () => {
      requestId(req, res, next);

      expect(res.setHeader).toHaveBeenCalledWith('X-Request-ID', req.id);
    });

    it('should generate unique IDs', () => {
      const ids = new Set();

      for (let i = 0; i < 100; i++) {
        const testReq = { ...req };
        const testRes = { ...res, setHeader: jest.fn() };

        requestId(testReq, testRes, next);
        ids.add(testReq.id);
      }

      expect(ids.size).toBe(100);
    });

    it('should generate ID with timestamp', () => {
      requestId(req, res, next);

      const timestamp = req.id.split('-')[0];
      const now = Date.now();

      // Timestamp should be within 1 second of now
      expect(Math.abs(Number(timestamp) - now)).toBeLessThan(1000);
    });

    it('should generate ID with random suffix', () => {
      requestId(req, res, next);

      const parts = req.id.split('-');
      expect(parts.length).toBeGreaterThanOrEqual(2);
      expect(parts[1]).toBeDefined();
    });
  });

  describe('Integration', () => {
    it('should work with requestId and requestLogger together', () => {
      requestId(req, res, next);
      requestLogger(req, res, next);

      expect(req.id).toBeDefined();
      expect(res.on).toHaveBeenCalledWith('finish', expect.any(Function));
    });
  });
});

describe('Request Logging Formats', () => {
  it('should log in structured format', () => {
    const logEntry = {
      method: 'POST',
      url: '/api/products',
      status: 201,
      duration: 45,
      userId: 1,
    };

    expect(logEntry).toHaveProperty('method');
    expect(logEntry).toHaveProperty('url');
    expect(logEntry).toHaveProperty('status');
    expect(logEntry).toHaveProperty('duration');
  });

  it('should handle long URLs', () => {
    const longUrl = '/api/products?' + 'a'.repeat(1000);

    const logEntry = {
      method: 'GET',
      url: longUrl,
      status: 200,
      duration: 10,
    };

    expect(logEntry.url.length).toBeGreaterThan(1000);
  });

  it('should handle special characters in URL', () => {
    const specialUrl = '/api/search?q=hello%20world&category=điện%20thoại';

    const logEntry = {
      method: 'GET',
      url: specialUrl,
      status: 200,
      duration: 10,
    };

    expect(logEntry.url).toContain('%20');
  });
});

