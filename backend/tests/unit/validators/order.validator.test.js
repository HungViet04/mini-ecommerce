/**
 * Order Validator Tests
 * Tests for order validation functions
 */
const {
  validateCreateOrder,
  validateStatusUpdate,
  validateOrderId,
} = require('../../../src/validators/order.validator');
const { ValidationError } = require('../../../src/errors');

describe('Order Validator', () => {
  describe('validateCreateOrder', () => {
    const validShippingInfo = {
      fullName: 'NguyềE Văn A',
      phone: '0901234567',
      province: 'HềEChí Minh',
      district: 'Quận 1',
      ward: 'Phường Bến Nghé',
      address: '123 Đường ABC',
    };

    describe('Valid data', () => {
      it('should return validated data for valid input', () => {
        const data = {
          items: [
            { productId: 1, quantity: 2 },
            { productId: 2, quantity: 1 },
          ],
          shippingInfo: validShippingInfo,
          paymentMethod: 'cod',
        };

        const result = validateCreateOrder(data);

        expect(result).toHaveProperty('items');
        expect(result.items).toHaveLength(2);
        expect(result.items[0]).toEqual({ productId: 1, quantity: 2 });
        expect(result).toHaveProperty('shippingFee');
      });

      it('should accept product_id as productId', () => {
        const data = {
          items: [{ product_id: 1, quantity: 2 }],
          shippingInfo: validShippingInfo,
          paymentMethod: 'cod',
        };

        const result = validateCreateOrder(data);

        expect(result.items[0].productId).toBe(1);
      });

      it('should accept both cod and bank_transfer as payment methods', () => {
        const dataCod = {
          items: [{ productId: 1, quantity: 1 }],
          shippingInfo: validShippingInfo,
          paymentMethod: 'cod',
        };

        const dataBankTransfer = {
          items: [{ productId: 1, quantity: 1 }],
          shippingInfo: validShippingInfo,
          paymentMethod: 'bank_transfer',
        };

        expect(() => validateCreateOrder(dataCod)).not.toThrow();
        expect(() => validateCreateOrder(dataBankTransfer)).not.toThrow();
      });
    });

    describe('Items validation', () => {
      it('should throw ValidationError when items is missing', () => {
        const data = {
          shippingInfo: validShippingInfo,
          paymentMethod: 'cod',
        };

        expect(() => validateCreateOrder(data)).toThrow(ValidationError);
      });

      it('should throw ValidationError when items is empty array', () => {
        const data = {
          items: [],
          shippingInfo: validShippingInfo,
          paymentMethod: 'cod',
        };

        expect(() => validateCreateOrder(data)).toThrow(ValidationError);
      });

      it('should throw ValidationError when items is not an array', () => {
        const data = {
          items: 'not an array',
          shippingInfo: validShippingInfo,
          paymentMethod: 'cod',
        };

        expect(() => validateCreateOrder(data)).toThrow(ValidationError);
      });

      it('should throw ValidationError when item productId is invalid', () => {
        const data = {
          items: [{ productId: -1, quantity: 1 }],
          shippingInfo: validShippingInfo,
          paymentMethod: 'cod',
        };

        expect(() => validateCreateOrder(data)).toThrow(ValidationError);
      });

      it('should throw ValidationError when item productId is missing', () => {
        const data = {
          items: [{ quantity: 1 }],
          shippingInfo: validShippingInfo,
          paymentMethod: 'cod',
        };

        expect(() => validateCreateOrder(data)).toThrow(ValidationError);
      });

      it('should throw ValidationError when item quantity is invalid', () => {
        const data = {
          items: [{ productId: 1, quantity: 0 }],
          shippingInfo: validShippingInfo,
          paymentMethod: 'cod',
        };

        expect(() => validateCreateOrder(data)).toThrow(ValidationError);
      });

      it('should throw ValidationError when item quantity is negative', () => {
        const data = {
          items: [{ productId: 1, quantity: -5 }],
          shippingInfo: validShippingInfo,
          paymentMethod: 'cod',
        };

        expect(() => validateCreateOrder(data)).toThrow(ValidationError);
      });

      it('should throw ValidationError when item quantity is not integer', () => {
        const data = {
          items: [{ productId: 1, quantity: 1.5 }],
          shippingInfo: validShippingInfo,
          paymentMethod: 'cod',
        };

        expect(() => validateCreateOrder(data)).toThrow(ValidationError);
      });
    });

    describe('Shipping info validation', () => {
      it('should throw ValidationError when fullName is missing', () => {
        const data = {
          items: [{ productId: 1, quantity: 1 }],
          shippingInfo: {
            ...validShippingInfo,
            fullName: '',
          },
          paymentMethod: 'cod',
        };

        expect(() => validateCreateOrder(data)).toThrow(ValidationError);
      });

      it('should throw ValidationError when phone is missing', () => {
        const data = {
          items: [{ productId: 1, quantity: 1 }],
          shippingInfo: {
            ...validShippingInfo,
            phone: '',
          },
          paymentMethod: 'cod',
        };

        expect(() => validateCreateOrder(data)).toThrow(ValidationError);
      });

      it('should throw ValidationError for invalid phone format', () => {
        const invalidPhones = [
          '12345',
          '090123456', // too short
          '09012345678', // too long
          '1234567890', // doesn't start with 0
          'abcdefghij', // not numbers
        ];

        invalidPhones.forEach((phone) => {
          const data = {
            items: [{ productId: 1, quantity: 1 }],
            shippingInfo: {
              ...validShippingInfo,
              phone,
            },
            paymentMethod: 'cod',
          };

          expect(() => validateCreateOrder(data)).toThrow(ValidationError);
        });
      });

      it('should accept valid phone formats', () => {
        const validPhones = ['0901234567', '0351234567', '0701234567', '0812345678', '0912345678'];

        validPhones.forEach((phone) => {
          const data = {
            items: [{ productId: 1, quantity: 1 }],
            shippingInfo: {
              ...validShippingInfo,
              phone,
            },
            paymentMethod: 'cod',
          };

          expect(() => validateCreateOrder(data)).not.toThrow();
        });
      });

      it('should throw ValidationError when province is missing', () => {
        const data = {
          items: [{ productId: 1, quantity: 1 }],
          shippingInfo: {
            ...validShippingInfo,
            province: '',
          },
          paymentMethod: 'cod',
        };

        expect(() => validateCreateOrder(data)).toThrow(ValidationError);
      });

      it('should throw ValidationError when district is missing', () => {
        const data = {
          items: [{ productId: 1, quantity: 1 }],
          shippingInfo: {
            ...validShippingInfo,
            district: '',
          },
          paymentMethod: 'cod',
        };

        expect(() => validateCreateOrder(data)).toThrow(ValidationError);
      });

      it('should throw ValidationError when ward is missing', () => {
        const data = {
          items: [{ productId: 1, quantity: 1 }],
          shippingInfo: {
            ...validShippingInfo,
            ward: '',
          },
          paymentMethod: 'cod',
        };

        expect(() => validateCreateOrder(data)).toThrow(ValidationError);
      });

      it('should throw ValidationError when address is missing', () => {
        const data = {
          items: [{ productId: 1, quantity: 1 }],
          shippingInfo: {
            ...validShippingInfo,
            address: '',
          },
          paymentMethod: 'cod',
        };

        expect(() => validateCreateOrder(data)).toThrow(ValidationError);
      });
    });

    describe('Payment method validation', () => {
      it('should default to cod for invalid payment method', () => {
        const data = {
          items: [{ productId: 1, quantity: 1 }],
          shippingInfo: validShippingInfo,
          paymentMethod: 'credit_card',
        };

        // Invalid payment methods default to 'cod' instead of throwing
        const result = validateCreateOrder(data);
        expect(result.paymentMethod).toBe('cod');
      });
    });

    describe('User ID validation', () => {
      it('should accept valid userId', () => {
        const data = {
          items: [{ productId: 1, quantity: 1 }],
          shippingInfo: validShippingInfo,
          paymentMethod: 'cod',
          userId: 5,
        };

        const result = validateCreateOrder(data);

        expect(result.userId).toBe(5);
      });
    });
  });

  describe('validateStatusUpdate', () => {
    it('should return validated status for valid input', () => {
      // Actual valid statuses from ORDER_STATUS constant
      const validStatuses = ['pending', 'paid', 'shipped', 'delivered'];

      validStatuses.forEach((status) => {
        const result = validateStatusUpdate({ status });
        expect(result.status).toBe(status);
      });
    });

    it('should throw ValidationError when status is missing', () => {
      expect(() => validateStatusUpdate({})).toThrow(ValidationError);
    });

    it('should throw ValidationError for invalid status', () => {
      expect(() => validateStatusUpdate({ status: 'invalid' })).toThrow(ValidationError);
      expect(() => validateStatusUpdate({ status: 'processing' })).toThrow(ValidationError);
    });
  });

  describe('validateOrderId', () => {
    it('should return number for valid string id', () => {
      const result = validateOrderId('123');

      expect(result).toBe(123);
      expect(typeof result).toBe('number');
    });

    it('should return number for valid number id', () => {
      const result = validateOrderId(456);

      expect(result).toBe(456);
    });

    it('should throw ValidationError for invalid id', () => {
      expect(() => validateOrderId('abc')).toThrow(ValidationError);
      expect(() => validateOrderId(-1)).toThrow(ValidationError);
      expect(() => validateOrderId(0)).toThrow(ValidationError);
      expect(() => validateOrderId(null)).toThrow(ValidationError);
      expect(() => validateOrderId(undefined)).toThrow(ValidationError);
    });
  });
});
