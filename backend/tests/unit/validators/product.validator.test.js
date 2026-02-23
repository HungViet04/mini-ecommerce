/**
 * Product Validator Tests
 * Tests for product validation functions
 */
const {
  validateCreateProduct,
  validateUpdateProduct,
  validateProductId,
  validateSearchQuery,
} = require('../../../src/validators/product.validator');
const { ValidationError } = require('../../../src/errors');

describe('Product Validator', () => {
  describe('validateCreateProduct', () => {
    describe('Valid data', () => {
      it('should return validated data for minimal valid input', () => {
        const data = {
          name: 'Sản phẩm test',
          price: 100000,
        };

        const result = validateCreateProduct(data);

        expect(result).toMatchObject({
          name: 'Sản phẩm test',
          price: 100000,
          stock: 0,
        });
      });

      it('should return validated data for complete input', () => {
        const data = {
          name: 'Sản phẩm test',
          description: 'Mô tả sản phẩm',
          price: 150000,
          stock: 100,
          category_id: 1,
          image_url: 'https://example.com/image.jpg',
        };

        const result = validateCreateProduct(data);

        expect(result).toEqual({
          name: 'Sản phẩm test',
          description: 'Mô tả sản phẩm',
          price: 150000,
          stock: 100,
          category_id: 1,
          image_url: 'https://example.com/image.jpg',
        });
      });

      it('should accept camelCase field names', () => {
        const data = {
          name: 'Test Product',
          price: 100000,
          categoryId: 1,
          imageUrl: 'https://example.com/image.jpg',
        };

        const result = validateCreateProduct(data);

        expect(result.category_id).toBe(1);
        expect(result.image_url).toBe('https://example.com/image.jpg');
      });

      it('should convert price to number', () => {
        const data = {
          name: 'Test Product',
          price: '99000',
        };

        const result = validateCreateProduct(data);

        expect(result.price).toBe(99000);
        expect(typeof result.price).toBe('number');
      });

      it('should default stock to 0 if not provided', () => {
        const data = {
          name: 'Test Product',
          price: 100000,
        };

        const result = validateCreateProduct(data);

        expect(result.stock).toBe(0);
      });
    });

    describe('Name validation', () => {
      it('should throw ValidationError when name is missing', () => {
        const data = {
          price: 100000,
        };

        expect(() => validateCreateProduct(data)).toThrow(ValidationError);
      });

      it('should throw ValidationError when name is empty string', () => {
        const data = {
          name: '',
          price: 100000,
        };

        expect(() => validateCreateProduct(data)).toThrow(ValidationError);
      });

      it('should throw ValidationError when name exceeds 255 characters', () => {
        const data = {
          name: 'A'.repeat(256),
          price: 100000,
        };

        expect(() => validateCreateProduct(data)).toThrow(ValidationError);
      });
    });

    describe('Price validation', () => {
      it('should throw ValidationError when price is missing', () => {
        const data = {
          name: 'Test Product',
        };

        expect(() => validateCreateProduct(data)).toThrow(ValidationError);
      });

      it('should throw ValidationError when price is negative', () => {
        const data = {
          name: 'Test Product',
          price: -100,
        };

        expect(() => validateCreateProduct(data)).toThrow(ValidationError);
      });

      it('should throw ValidationError when price is not a number', () => {
        const data = {
          name: 'Test Product',
          price: 'abc',
        };

        expect(() => validateCreateProduct(data)).toThrow(ValidationError);
      });

      it('should accept price as 0', () => {
        const data = {
          name: 'Test Product',
          price: 0,
        };

        const result = validateCreateProduct(data);

        expect(result.price).toBe(0);
      });

      it('should accept decimal prices', () => {
        const data = {
          name: 'Test Product',
          price: 99.99,
        };

        const result = validateCreateProduct(data);

        expect(result.price).toBe(99.99);
      });
    });

    describe('Stock validation', () => {
      it('should throw ValidationError when stock is negative', () => {
        const data = {
          name: 'Test Product',
          price: 100000,
          stock: -5,
        };

        expect(() => validateCreateProduct(data)).toThrow(ValidationError);
      });

      it('should throw ValidationError when stock is not an integer', () => {
        const data = {
          name: 'Test Product',
          price: 100000,
          stock: 5.5,
        };

        expect(() => validateCreateProduct(data)).toThrow(ValidationError);
      });

      it('should accept stock as 0', () => {
        const data = {
          name: 'Test Product',
          price: 100000,
          stock: 0,
        };

        const result = validateCreateProduct(data);

        expect(result.stock).toBe(0);
      });
    });

    describe('Category ID validation', () => {
      it('should throw ValidationError when category_id is not a positive integer', () => {
        const data = {
          name: 'Test Product',
          price: 100000,
          category_id: -1,
        };

        expect(() => validateCreateProduct(data)).toThrow(ValidationError);
      });

      it('should allow category_id 0 as falsy value (treated as null)', () => {
        const data = {
          name: 'Test Product',
          price: 100000,
          category_id: 0,
        };

        // category_id: 0 is falsy, so it's treated like undefined/null
        const result = validateCreateProduct(data);
        expect(result.category_id).toBeNull();
      });

      it('should allow null category_id', () => {
        const data = {
          name: 'Test Product',
          price: 100000,
          category_id: null,
        };

        const result = validateCreateProduct(data);

        expect(result.category_id).toBeNull();
      });

      it('should allow undefined category_id', () => {
        const data = {
          name: 'Test Product',
          price: 100000,
        };

        const result = validateCreateProduct(data);

        expect(result.category_id).toBeNull();
      });
    });

    describe('Image URL validation', () => {
      it('should throw ValidationError when image_url exceeds 1024 characters', () => {
        const data = {
          name: 'Test Product',
          price: 100000,
          image_url: 'https://example.com/' + 'a'.repeat(1010),
        };

        expect(() => validateCreateProduct(data)).toThrow(ValidationError);
      });

      it('should allow empty image_url', () => {
        const data = {
          name: 'Test Product',
          price: 100000,
          image_url: '',
        };

        const result = validateCreateProduct(data);

        expect(result.image_url).toBeNull();
      });
    });
  });

  describe('validateUpdateProduct', () => {
    it('should throw ValidationError when no valid fields provided', () => {
      const data = {};

      expect(() => validateUpdateProduct(data)).toThrow(ValidationError);
    });

    it('should only validate provided fields', () => {
      const data = {
        price: 200000,
      };

      const result = validateUpdateProduct(data);

      expect(result).toEqual({ price: 200000 });
      expect(result.name).toBeUndefined();
    });

    it('should validate name when provided', () => {
      const data = {
        name: 'Updated Product',
      };

      const result = validateUpdateProduct(data);

      expect(result.name).toBe('Updated Product');
    });

    it('should throw ValidationError for invalid name', () => {
      const data = {
        name: '',
      };

      expect(() => validateUpdateProduct(data)).toThrow(ValidationError);
    });

    it('should validate multiple fields', () => {
      const data = {
        name: 'Updated Product',
        price: 150000,
        stock: 50,
      };

      const result = validateUpdateProduct(data);

      expect(result).toEqual({
        name: 'Updated Product',
        price: 150000,
        stock: 50,
      });
    });
  });

  describe('validateProductId', () => {
    it('should return number for valid string id', () => {
      const result = validateProductId('123');

      expect(result).toBe(123);
      expect(typeof result).toBe('number');
    });

    it('should return number for valid number id', () => {
      const result = validateProductId(456);

      expect(result).toBe(456);
    });

    it('should throw ValidationError for invalid id', () => {
      expect(() => validateProductId('abc')).toThrow(ValidationError);
      expect(() => validateProductId(-1)).toThrow(ValidationError);
      expect(() => validateProductId(0)).toThrow(ValidationError);
      expect(() => validateProductId(null)).toThrow(ValidationError);
      expect(() => validateProductId(undefined)).toThrow(ValidationError);
    });
  });

  describe('validateSearchQuery', () => {
    it('should return trimmed query for valid input', () => {
      const result = validateSearchQuery('  test query  ');

      expect(result).toBe('test query');
    });

    it('should return empty string for empty input', () => {
      const result = validateSearchQuery('');

      expect(result).toBe('');
    });

    it('should return empty string for whitespace only', () => {
      const result = validateSearchQuery('   ');

      expect(result).toBe('');
    });

    it('should handle null/undefined', () => {
      expect(validateSearchQuery(null)).toBe('');
      expect(validateSearchQuery(undefined)).toBe('');
    });
  });
});

