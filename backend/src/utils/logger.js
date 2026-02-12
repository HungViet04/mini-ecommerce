/**
 * Logger Utility
 * Centralized logging for the application
 * Can be extended to use winston, pino, etc.
 */
const config = require('../config');

/**
 * Log levels
 */
const LOG_LEVELS = {
  ERROR: 'ERROR',
  WARN: 'WARN',
  INFO: 'INFO',
  DEBUG: 'DEBUG',
};

/**
 * ANSI color codes for terminal output
 */
const COLORS = {
  reset: '\x1b[0m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  green: '\x1b[32m',
  cyan: '\x1b[36m',
  gray: '\x1b[90m',
};

/**
 * Format timestamp
 * @returns {string} Formatted timestamp
 */
const getTimestamp = () => {
  return new Date().toISOString();
};

/**
 * Format log message
 * @param {string} level - Log level
 * @param {string} message - Log message
 * @param {Object} meta - Additional metadata
 * @returns {string} Formatted message
 */
const formatMessage = (level, message, meta = {}) => {
  const timestamp = getTimestamp();
  const metaStr = Object.keys(meta).length > 0 ? ` ${JSON.stringify(meta)}` : '';
  return `[${timestamp}] [${level}] ${message}${metaStr}`;
};

/**
 * Logger class
 */
class Logger {
  /**
   * Log error message
   * @param {string} message - Error message
   * @param {Object|Error} meta - Additional metadata or Error object
   */
  error(message, meta = {}) {
    if (meta instanceof Error) {
      meta = {
        name: meta.name,
        message: meta.message,
        ...(config.env === 'development' && { stack: meta.stack }),
      };
    }
    console.error(`${COLORS.red}${formatMessage(LOG_LEVELS.ERROR, message, meta)}${COLORS.reset}`);
  }

  /**
   * Log warning message
   * @param {string} message - Warning message
   * @param {Object} meta - Additional metadata
   */
  warn(message, meta = {}) {
    console.warn(`${COLORS.yellow}${formatMessage(LOG_LEVELS.WARN, message, meta)}${COLORS.reset}`);
  }

  /**
   * Log info message
   * @param {string} message - Info message
   * @param {Object} meta - Additional metadata
   */
  info(message, meta = {}) {
    console.log(`${COLORS.green}${formatMessage(LOG_LEVELS.INFO, message, meta)}${COLORS.reset}`);
  }

  /**
   * Log debug message (only in development)
   * @param {string} message - Debug message
   * @param {Object} meta - Additional metadata
   */
  debug(message, meta = {}) {
    if (config.env === 'development') {
      console.log(`${COLORS.gray}${formatMessage(LOG_LEVELS.DEBUG, message, meta)}${COLORS.reset}`);
    }
  }

  /**
   * Log HTTP request
   * @param {Object} options - Request options
   */
  http({ method, url, status, duration, userId = null }) {
    const statusColor =
      status >= 500
        ? COLORS.red
        : status >= 400
          ? COLORS.yellow
          : status >= 300
            ? COLORS.cyan
            : COLORS.green;

    const userStr = userId ? ` [user:${userId}]` : '';
    console.log(
      `${statusColor}${method}${COLORS.reset} ${url} ${statusColor}${status}${COLORS.reset} - ${duration}ms${userStr}`
    );
  }

  /**
   * Log database operation
   * @param {string} operation - Operation name
   * @param {Object} meta - Additional metadata
   */
  db(operation, meta = {}) {
    if (config.env === 'development') {
      console.log(`${COLORS.cyan}[DB] ${operation}${COLORS.reset}`, meta);
    }
  }
}

// Export singleton instance
module.exports = new Logger();
