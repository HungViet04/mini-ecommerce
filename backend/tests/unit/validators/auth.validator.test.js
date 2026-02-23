/**
 * Auth Validator Tests
 * Tests for authentication validation functions
 */
const { validateRegister, validateLogin } = require('../../../src/validators/auth.validator');
const { ValidationError } = require('../../../src/errors');

describe('Auth Validator', () => {
  describe('validateRegister', () => {
    describe('Valid data', () => {
      it('should return validated data for valid input', () => {
        const data = {
          name: 'NguyềE Văn A',
          email: 'test@example.com',
          password: 'password123',
        };

        const result = validateRegister(data);

        expect(result).toEqual({
          name: 'NguyềE Văn A',
          email: 'test@example.com',
          password: 'password123',
        });
      });

      it('should accept username as name', () => {
        const data = {
          username: 'TestUser',
          email: 'test@example.com',
          password: 'password123',
        };

        const result = validateRegister(data);

        expect(result.name).toBe('TestUser');
      });

      it('should convert email to lowercase', () => {
        const data = {
          name: 'Test User',
          email: 'TEST@EXAMPLE.COM',
          password: 'password123',
        };

        const result = validateRegister(data);

        expect(result.email).toBe('test@example.com');
      });

      it('should trim whitespace from name and email', () => {
        const data = {
          name: '  Test User  ',
          email: '  test@example.com  ',
          password: 'password123',
        };

        const result = validateRegister(data);

        expect(result.name).toBe('Test User');
        expect(result.email).toBe('test@example.com');
      });
    });

    describe('Name validation', () => {
      it('should throw ValidationError when name is missing', () => {
        const data = {
          email: 'test@example.com',
          password: 'password123',
        };

        expect(() => validateRegister(data)).toThrow(ValidationError);
        try {
          validateRegister(data);
        } catch (error) {
          expect(error.details).toContainEqual(expect.objectContaining({ field: 'name' }));
        }
      });

      it('should throw ValidationError when name is empty string', () => {
        const data = {
          name: '',
          email: 'test@example.com',
          password: 'password123',
        };

        expect(() => validateRegister(data)).toThrow(ValidationError);
      });

      it('should throw ValidationError when name is too short', () => {
        const data = {
          name: 'A',
          email: 'test@example.com',
          password: 'password123',
        };

        expect(() => validateRegister(data)).toThrow(ValidationError);
      });

      it('should throw ValidationError when name is too long', () => {
        const data = {
          name: 'A'.repeat(101),
          email: 'test@example.com',
          password: 'password123',
        };

        expect(() => validateRegister(data)).toThrow(ValidationError);
      });
    });

    describe('Email validation', () => {
      it('should throw ValidationError when email is missing', () => {
        const data = {
          name: 'Test User',
          password: 'password123',
        };

        expect(() => validateRegister(data)).toThrow(ValidationError);
        try {
          validateRegister(data);
        } catch (error) {
          expect(error.details).toContainEqual(expect.objectContaining({ field: 'email' }));
        }
      });

      it('should throw ValidationError when email is empty string', () => {
        const data = {
          name: 'Test User',
          email: '',
          password: 'password123',
        };

        expect(() => validateRegister(data)).toThrow(ValidationError);
      });

      it('should throw ValidationError for invalid email format', () => {
        const invalidEmails = [
          'notanemail',
          'missing@domain',
          '@nodomain.com',
          'spaces in@email.com',
          'double@@at.com',
        ];

        invalidEmails.forEach(email => {
          const data = {
            name: 'Test User',
            email,
            password: 'password123',
          };

          expect(() => validateRegister(data)).toThrow(ValidationError);
        });
      });

      it('should accept valid email formats', () => {
        const validEmails = [
          'simple@example.com',
          'user.name@domain.org',
          'user+tag@subdomain.domain.com',
        ];

        validEmails.forEach(email => {
          const data = {
            name: 'Test User',
            email,
            password: 'password123',
          };

          expect(() => validateRegister(data)).not.toThrow();
        });
      });
    });

    describe('Password validation', () => {
      it('should throw ValidationError when password is missing', () => {
        const data = {
          name: 'Test User',
          email: 'test@example.com',
        };

        expect(() => validateRegister(data)).toThrow(ValidationError);
        try {
          validateRegister(data);
        } catch (error) {
          expect(error.details).toContainEqual(expect.objectContaining({ field: 'password' }));
        }
      });

      it('should throw ValidationError when password is empty string', () => {
        const data = {
          name: 'Test User',
          email: 'test@example.com',
          password: '',
        };

        expect(() => validateRegister(data)).toThrow(ValidationError);
      });

      it('should throw ValidationError when password is too short', () => {
        const data = {
          name: 'Test User',
          email: 'test@example.com',
          password: '12345',
        };

        expect(() => validateRegister(data)).toThrow(ValidationError);
      });

      it('should throw ValidationError when password is too long', () => {
        const data = {
          name: 'Test User',
          email: 'test@example.com',
          password: 'a'.repeat(129),
        };

        expect(() => validateRegister(data)).toThrow(ValidationError);
      });
    });

    describe('Multiple validation errors', () => {
      it('should return all validation errors at once', () => {
        const data = {
          name: '',
          email: 'invalid',
          password: '',
        };

        try {
          validateRegister(data);
        } catch (error) {
          expect(error).toBeInstanceOf(ValidationError);
          expect(error.details.length).toBeGreaterThanOrEqual(3);
        }
      });
    });
  });

  describe('validateLogin', () => {
    describe('Valid data', () => {
      it('should return validated data for valid input with email', () => {
        const data = {
          email: 'test@example.com',
          password: 'password123',
        };

        const result = validateLogin(data);

        expect(result).toEqual({
          identifier: 'test@example.com',
          password: 'password123',
        });
      });

      it('should return validated data for valid input with identifier', () => {
        const data = {
          identifier: 'test@example.com',
          password: 'password123',
        };

        const result = validateLogin(data);

        expect(result.identifier).toBe('test@example.com');
      });

      it('should accept username as identifier', () => {
        const data = {
          username: 'testuser',
          password: 'password123',
        };

        const result = validateLogin(data);

        expect(result.identifier).toBe('testuser');
      });
    });

    describe('Identifier validation', () => {
      it('should throw ValidationError when identifier/email/username is missing', () => {
        const data = {
          password: 'password123',
        };

        expect(() => validateLogin(data)).toThrow(ValidationError);
        try {
          validateLogin(data);
        } catch (error) {
          expect(error.details).toContainEqual(expect.objectContaining({ field: 'identifier' }));
        }
      });

      it('should throw ValidationError when identifier is empty string', () => {
        const data = {
          identifier: '',
          password: 'password123',
        };

        expect(() => validateLogin(data)).toThrow(ValidationError);
      });

      it('should throw ValidationError when identifier is only whitespace', () => {
        const data = {
          identifier: '   ',
          password: 'password123',
        };

        expect(() => validateLogin(data)).toThrow(ValidationError);
      });
    });

    describe('Password validation', () => {
      it('should throw ValidationError when password is missing', () => {
        const data = {
          identifier: 'test@example.com',
        };

        expect(() => validateLogin(data)).toThrow(ValidationError);
        try {
          validateLogin(data);
        } catch (error) {
          expect(error.details).toContainEqual(expect.objectContaining({ field: 'password' }));
        }
      });

      it('should throw ValidationError when password is empty string', () => {
        const data = {
          identifier: 'test@example.com',
          password: '',
        };

        expect(() => validateLogin(data)).toThrow(ValidationError);
      });
    });

    describe('Multiple validation errors', () => {
      it('should return all validation errors at once', () => {
        const data = {
          identifier: '',
          password: '',
        };

        try {
          validateLogin(data);
        } catch (error) {
          expect(error).toBeInstanceOf(ValidationError);
          expect(error.details.length).toBe(2);
        }
      });
    });
  });
});

