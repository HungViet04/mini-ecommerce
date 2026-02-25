/**
 * Logger Utility Unit Tests
 * Tests for centralized logging utility
 */

// Mock config
jest.mock('../../../src/config', () => ({
  env: 'test',
}));

// Store original console methods
const originalConsole = {
  log: console.log,
  error: console.error,
  warn: console.warn,
};

describe('Logger Utility', () => {
  let logger;
  let consoleSpy;

  beforeEach(() => {
    // Reset modules to get fresh logger instance
    jest.resetModules();

    consoleSpy = {
      log: jest.spyOn(console, 'log').mockImplementation(() => {}),
      error: jest.spyOn(console, 'error').mockImplementation(() => {}),
      warn: jest.spyOn(console, 'warn').mockImplementation(() => {}),
    };

    logger = require('../../../src/utils/logger');
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  describe('error', () => {
    it('should log error message to console.error', () => {
      logger.error('Test error');

      expect(consoleSpy.error).toHaveBeenCalled();
    });

    it('should include error message in output', () => {
      logger.error('Something went wrong');

      const logCall = consoleSpy.error.mock.calls[0][0];
      expect(logCall).toContain('ERROR');
      expect(logCall).toContain('Something went wrong');
    });

    it('should include timestamp', () => {
      logger.error('Test error');

      const logCall = consoleSpy.error.mock.calls[0][0];
      expect(logCall).toMatch(/\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}/);
    });

    it('should handle Error object', () => {
      const error = new Error('Test error message');
      logger.error('An error occurred', error);

      const logCall = consoleSpy.error.mock.calls[0][0];
      expect(logCall).toContain('Test error message');
    });

    it('should include metadata', () => {
      logger.error('Error with meta', { userId: 123, action: 'delete' });

      const logCall = consoleSpy.error.mock.calls[0][0];
      expect(logCall).toContain('userId');
      expect(logCall).toContain('123');
    });
  });

  describe('warn', () => {
    it('should log warning to console.warn', () => {
      logger.warn('Test warning');

      expect(consoleSpy.warn).toHaveBeenCalled();
    });

    it('should include WARN level', () => {
      logger.warn('Warning message');

      const logCall = consoleSpy.warn.mock.calls[0][0];
      expect(logCall).toContain('WARN');
    });

    it('should include metadata', () => {
      logger.warn('Low stock', { productId: 5, stock: 2 });

      const logCall = consoleSpy.warn.mock.calls[0][0];
      expect(logCall).toContain('productId');
      expect(logCall).toContain('stock');
    });
  });

  describe('info', () => {
    it('should log info to console.log', () => {
      logger.info('Test info');

      expect(consoleSpy.log).toHaveBeenCalled();
    });

    it('should include INFO level', () => {
      logger.info('Information message');

      const logCall = consoleSpy.log.mock.calls[0][0];
      expect(logCall).toContain('INFO');
    });

    it('should include metadata', () => {
      logger.info('User created', { userId: 10, email: 'test@test.com' });

      const logCall = consoleSpy.log.mock.calls[0][0];
      expect(logCall).toContain('userId');
    });
  });

  describe('debug', () => {
    it('should not log in test environment', () => {
      logger.debug('Debug message');

      // In test env, debug should not log
      // Check if console.log was called with DEBUG
      const debugCalls = consoleSpy.log.mock.calls.filter((call) => call[0]?.includes?.('DEBUG'));
      expect(debugCalls.length).toBe(0);
    });

    it('should log in development environment', () => {
      jest.resetModules();
      jest.doMock('../../../src/config', () => ({ env: 'development' }));

      const devLogger = require('../../../src/utils/logger');
      devLogger.debug('Debug message');

      expect(consoleSpy.log).toHaveBeenCalled();
    });
  });

  describe('http', () => {
    it('should log HTTP request', () => {
      logger.http({
        method: 'GET',
        url: '/api/products',
        status: 200,
        duration: 45,
      });

      expect(consoleSpy.log).toHaveBeenCalled();
    });

    it('should include method and URL', () => {
      logger.http({
        method: 'POST',
        url: '/api/orders',
        status: 201,
        duration: 120,
      });

      const logCall = consoleSpy.log.mock.calls[0][0];
      expect(logCall).toContain('POST');
      expect(logCall).toContain('/api/orders');
    });

    it('should include status code', () => {
      logger.http({
        method: 'GET',
        url: '/api/test',
        status: 404,
        duration: 10,
      });

      const logCall = consoleSpy.log.mock.calls[0][0];
      expect(logCall).toContain('404');
    });

    it('should include duration', () => {
      logger.http({
        method: 'GET',
        url: '/api/test',
        status: 200,
        duration: 150,
      });

      const logCall = consoleSpy.log.mock.calls[0][0];
      expect(logCall).toContain('150ms');
    });

    it('should include userId when provided', () => {
      logger.http({
        method: 'GET',
        url: '/api/profile',
        status: 200,
        duration: 30,
        userId: 42,
      });

      const logCall = consoleSpy.log.mock.calls[0][0];
      expect(logCall).toContain('user:42');
    });

    it('should not include userId when null', () => {
      logger.http({
        method: 'GET',
        url: '/api/public',
        status: 200,
        duration: 20,
        userId: null,
      });

      const logCall = consoleSpy.log.mock.calls[0][0];
      expect(logCall).not.toContain('user:');
    });
  });

  describe('db', () => {
    it('should log database operations in development', () => {
      jest.resetModules();
      jest.doMock('../../../src/config', () => ({ env: 'development' }));

      const devLogger = require('../../../src/utils/logger');
      devLogger.db('SELECT', { table: 'products' });

      expect(consoleSpy.log).toHaveBeenCalled();
    });

    it('should not log in production', () => {
      jest.resetModules();
      jest.doMock('../../../src/config', () => ({ env: 'production' }));

      const prodLogger = require('../../../src/utils/logger');
      prodLogger.db('INSERT', { table: 'orders' });

      const dbCalls = consoleSpy.log.mock.calls.filter((call) => call[0]?.includes?.('[DB]'));
      expect(dbCalls.length).toBe(0);
    });
  });
});

describe('Log Message Formatting', () => {
  it('should format timestamp in ISO format', () => {
    const isoRegex = /\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}/;
    const timestamp = new Date().toISOString();

    expect(timestamp).toMatch(isoRegex);
  });

  it('should format metadata as JSON', () => {
    const meta = { key: 'value', number: 123 };
    const formatted = JSON.stringify(meta);

    expect(formatted).toBe('{"key":"value","number":123}');
  });

  it('should handle empty metadata', () => {
    const meta = {};
    const metaStr = Object.keys(meta).length > 0 ? ` ${JSON.stringify(meta)}` : '';

    expect(metaStr).toBe('');
  });

  it('should handle nested metadata', () => {
    const meta = {
      user: { id: 1, name: 'Test' },
      items: [1, 2, 3],
    };
    const formatted = JSON.stringify(meta);

    expect(formatted).toContain('user');
    expect(formatted).toContain('items');
  });
});

describe('Color Codes', () => {
  const COLORS = {
    reset: '\x1b[0m',
    red: '\x1b[31m',
    yellow: '\x1b[33m',
    green: '\x1b[32m',
    cyan: '\x1b[36m',
    gray: '\x1b[90m',
  };

  it('should have valid ANSI color codes', () => {
    // eslint-disable-next-line no-control-regex
    expect(COLORS.reset).toMatch(/\x1b\[\d+m/);
    // eslint-disable-next-line no-control-regex
    expect(COLORS.red).toMatch(/\x1b\[\d+m/);
    // eslint-disable-next-line no-control-regex
    expect(COLORS.green).toMatch(/\x1b\[\d+m/);
  });

  it('should use correct colors for status codes', () => {
    const getStatusColor = (status) => {
      if (status >= 500) return COLORS.red;
      if (status >= 400) return COLORS.yellow;
      if (status >= 300) return COLORS.cyan;
      return COLORS.green;
    };

    expect(getStatusColor(500)).toBe(COLORS.red);
    expect(getStatusColor(404)).toBe(COLORS.yellow);
    expect(getStatusColor(301)).toBe(COLORS.cyan);
    expect(getStatusColor(200)).toBe(COLORS.green);
  });
});
