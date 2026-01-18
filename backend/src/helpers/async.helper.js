/**
 * Async Handler Wrapper
 * Wraps async route handlers to catch errors and pass to error middleware
 */

/**
 * Wrap async function to handle promise rejections
 * @param {Function} fn - Async function to wrap
 * @returns {Function} Express middleware
 */
const asyncHandler = (fn) => {
  return (req, res, next) => {
    Promise.resolve(fn(req, res, next)).catch(next);
  };
};

/**
 * Wrap multiple async functions
 * @param {...Function} fns - Async functions to wrap
 * @returns {Array<Function>} Array of wrapped middlewares
 */
const asyncHandlers = (...fns) => {
  return fns.map((fn) => asyncHandler(fn));
};

module.exports = {
  asyncHandler,
  asyncHandlers,
};
