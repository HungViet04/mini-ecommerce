/**
 * VNPay Controller Unit Tests
 */

jest.mock('../../../src/services/vnpay.service', () => ({
  createPaymentUrl: jest.fn(),
  verifyReturnUrl: jest.fn(),
  updateOrderPaymentStatus: jest.fn(),
  handleIpn: jest.fn(),
}));

jest.mock('../../../src/repositories', () => ({
  orderRepository: {
    findById: jest.fn(),
  },
}));

jest.mock('../../../src/helpers', () => ({
  response: {
    success: jest.fn((res, payload) => res.status(200).json({ success: true, ...payload })),
  },
}));

const { ValidationError, NotFoundError } = require('../../../src/errors');
const vnpayService = require('../../../src/services/vnpay.service');
const { orderRepository } = require('../../../src/repositories');
const { response } = require('../../../src/helpers');
const vnpayController = require('../../../src/controllers/vnpay.controller');

describe('VNPay Controller', () => {
  let req;
  let res;
  let next;

  beforeEach(() => {
    jest.clearAllMocks();

    req = {
      body: {},
      params: {},
      query: {},
      headers: {},
      user: { id: 1, role: 'user' },
      get: jest.fn(),
    };

    res = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn().mockReturnThis(),
    };

    next = jest.fn();
  });

  describe('createPaymentUrl', () => {
    it('should return validation error when orderId missing', async () => {
      await vnpayController.createPaymentUrl(req, res, next);
      await Promise.resolve();

      expect(next).toHaveBeenCalledWith(expect.any(ValidationError));
    });

    it('should return not found error when order missing', async () => {
      req.body = { orderId: 123 };
      orderRepository.findById.mockResolvedValue(null);

      await vnpayController.createPaymentUrl(req, res, next);
      await Promise.resolve();

      expect(next).toHaveBeenCalledWith(expect.any(NotFoundError));
    });

    it('should return validation error when user not owner', async () => {
      req.body = { orderId: 123 };
      orderRepository.findById.mockResolvedValue({ id: 123, user_id: 2, status: 'pending' });

      await vnpayController.createPaymentUrl(req, res, next);
      await Promise.resolve();

      expect(next).toHaveBeenCalledWith(expect.any(ValidationError));
    });

    it('should return validation error when order not pending', async () => {
      req.body = { orderId: 123 };
      orderRepository.findById.mockResolvedValue({ id: 123, user_id: 1, status: 'paid' });

      await vnpayController.createPaymentUrl(req, res, next);
      await Promise.resolve();

      expect(next).toHaveBeenCalledWith(expect.any(ValidationError));
    });

    it('should create payment url successfully', async () => {
      req.body = { orderId: 123, bankCode: 'NCB' };
      req.get.mockReturnValue('http://localhost:5173/');

      orderRepository.findById.mockResolvedValue({
        id: 123,
        user_id: 1,
        status: 'pending',
        total: 100000,
      });
      vnpayService.createPaymentUrl.mockReturnValue('https://pay.test');

      await vnpayController.createPaymentUrl(req, res, next);

      expect(vnpayService.createPaymentUrl).toHaveBeenCalledWith(
        expect.objectContaining({
          orderId: 123,
          amount: 100000,
          bankCode: 'NCB',
          returnUrl: 'http://localhost:5173/payment/vnpay-return',
        })
      );
      expect(response.success).toHaveBeenCalledWith(res, {
        data: { paymentUrl: 'https://pay.test' },
        message: 'Tạo URL thanh toán thành công',
      });
    });
  });

  describe('vnpayReturn', () => {
    it('should update order when payment success', async () => {
      const result = {
        isValid: true,
        isSuccess: true,
        orderId: '123',
        amount: 100000,
        message: 'ok',
        transactionNo: '999',
        bankCode: 'NCB',
      };
      vnpayService.verifyReturnUrl.mockReturnValue(result);

      await vnpayController.vnpayReturn(req, res, next);

      expect(vnpayService.updateOrderPaymentStatus).toHaveBeenCalledWith('123', result);
      expect(response.success).toHaveBeenCalledWith(res, {
        data: expect.objectContaining({
          orderId: '123',
          isSuccess: true,
        }),
        message: 'Thanh toán thành công',
      });
    });

    it('should not update order when payment invalid', async () => {
      const result = {
        isValid: false,
        isSuccess: false,
        orderId: '123',
        amount: 100000,
        message: 'invalid',
      };
      vnpayService.verifyReturnUrl.mockReturnValue(result);

      await vnpayController.vnpayReturn(req, res, next);

      expect(vnpayService.updateOrderPaymentStatus).not.toHaveBeenCalled();
      expect(response.success).toHaveBeenCalledWith(res, {
        data: expect.objectContaining({
          orderId: '123',
          isSuccess: false,
        }),
        message: 'Thanh toán thất bại',
      });
    });
  });

  describe('vnpayIpn', () => {
    it('should return ipn response', async () => {
      const ipnResult = { RspCode: '00', Message: 'Confirm Success' };
      vnpayService.handleIpn.mockResolvedValue(ipnResult);

      await vnpayController.vnpayIpn(req, res, next);

      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith(ipnResult);
    });
  });

  describe('getPaymentStatus', () => {
    it('should return not found error when order missing', async () => {
      req.params = { orderId: '123' };
      orderRepository.findById.mockResolvedValue(null);

      await vnpayController.getPaymentStatus(req, res, next);
      await Promise.resolve();

      expect(next).toHaveBeenCalledWith(expect.any(NotFoundError));
    });

    it('should return validation error when user not owner', async () => {
      req.params = { orderId: '123' };
      orderRepository.findById.mockResolvedValue({ id: 123, user_id: 2, status: 'pending' });

      await vnpayController.getPaymentStatus(req, res, next);
      await Promise.resolve();

      expect(next).toHaveBeenCalledWith(expect.any(ValidationError));
    });

    it('should return status successfully', async () => {
      req.params = { orderId: '123' };
      orderRepository.findById.mockResolvedValue({
        id: 123,
        user_id: 1,
        status: 'paid',
        payment_method: 'vnpay',
      });

      await vnpayController.getPaymentStatus(req, res, next);

      expect(response.success).toHaveBeenCalledWith(res, {
        data: {
          orderId: 123,
          status: 'paid',
          paymentMethod: 'vnpay',
          isPaid: true,
        },
        message: 'Lấy trạng thái thanh toán thành công',
      });
    });
  });
});
