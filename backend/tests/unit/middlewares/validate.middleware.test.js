/**
 * Validate Middleware Unit Tests
 */
const { ValidationError } = require('../../../src/errors');
const {
  validate,
  validateBody,
  validateQuery,
  validateParams,
} = require('../../../src/middlewares/validate.middleware');

describe('Validate Middleware', () => {
  let req, res, next;

  beforeEach(() => {
    req = { body: {}, query: {}, params: {} };
    res = {};
    next = jest.fn();
  });

  describe('validate', () => {
    it('should call validator with request source data and set validated result', () => {
      const validator = jest.fn().mockReturnValue({ name: 'cleaned' });
      const originalBody = { name: '  cleaned  ' };
      req.body = originalBody;

      const middleware = validate(validator, 'body');
      middleware(req, res, next);

      expect(validator).toHaveBeenCalledWith(originalBody);
      expect(req.body).toEqual({ name: 'cleaned' });
      expect(next).toHaveBeenCalledWith();
    });

    it('should forward ValidationError to next', () => {
      const error = new ValidationError('Bad data');
      const validator = jest.fn().mockImplementation(() => {
        throw error;
      });

      const middleware = validate(validator, 'body');
      middleware(req, res, next);

      expect(next).toHaveBeenCalledWith(error);
    });

    it('should wrap generic errors in ValidationError', () => {
      const validator = jest.fn().mockImplementation(() => {
        throw new Error('oops');
      });

      const middleware = validate(validator, 'body');
      middleware(req, res, next);

      expect(next).toHaveBeenCalledWith(expect.any(ValidationError));
      expect(next.mock.calls[0][0].message).toBe('oops');
    });

    it('should default source to body', () => {
      const validator = jest.fn().mockReturnValue({ ok: true });
      req.body = { field: 'value' };

      const middleware = validate(validator);
      middleware(req, res, next);

      expect(validator).toHaveBeenCalledWith({ field: 'value' });
    });
  });

  describe('validateBody', () => {
    it('should validate req.body', () => {
      const validator = jest.fn().mockReturnValue({ name: 'test' });
      req.body = { name: 'test' };

      const middleware = validateBody(validator);
      middleware(req, res, next);

      expect(validator).toHaveBeenCalledWith(req.body);
      expect(next).toHaveBeenCalledWith();
    });
  });

  describe('validateQuery', () => {
    it('should validate req.query', () => {
      const validator = jest.fn().mockReturnValue({ q: 'search' });
      req.query = { q: 'search' };

      const middleware = validateQuery(validator);
      middleware(req, res, next);

      expect(validator).toHaveBeenCalledWith(req.query);
      expect(next).toHaveBeenCalledWith();
    });
  });

  describe('validateParams', () => {
    it('should validate req.params', () => {
      const validator = jest.fn().mockReturnValue({ id: 1 });
      req.params = { id: '1' };

      const middleware = validateParams(validator);
      middleware(req, res, next);

      expect(validator).toHaveBeenCalledWith({ id: '1' });
      expect(next).toHaveBeenCalledWith();
    });
  });
});

