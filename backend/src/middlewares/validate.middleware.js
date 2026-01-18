/**
 * Request Validation Middleware
 * Validates request body, query, params using validators
 */
const { ValidationError } = require('../errors');

/**
 * Create validation middleware
 * @param {Function} validator - Validator function
 * @param {string} source - Request property to validate ('body', 'query', 'params')
 * @returns {Function} Middleware function
 */
const validate = (validator, source = 'body') => {
  return (req, res, next) => {
    try {
      const data = req[source];
      const validated = validator(data);
      req[source] = validated;
      next();
    } catch (error) {
      if (error instanceof ValidationError) {
        next(error);
      } else {
        next(new ValidationError(error.message));
      }
    }
  };
};

/**
 * Validate request body
 */
const validateBody = (validator) => validate(validator, 'body');

/**
 * Validate query parameters
 */
const validateQuery = (validator) => validate(validator, 'query');

/**
 * Validate route parameters
 */
const validateParams = (validator) => validate(validator, 'params');

module.exports = {
  validate,
  validateBody,
  validateQuery,
  validateParams,
};
