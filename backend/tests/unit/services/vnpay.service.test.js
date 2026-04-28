/**
 * VNPay Service Unit Tests
 */

const crypto = require('crypto');

jest.mock('../../../src/config/vnpay', () => ({
  vnp_TmnCode: 'TESTCODE',
  vnp_HashSecret: 'TESTSECRET',
  vnp_Url: 'https://pay.test',
  vnp_ReturnUrl: 'https://return.test/payment/vnpay-return',
  vnp_Version: '2.1.0',
  vnp_Command: 'pay',
  vnp_CurrCode: 'VND',
  vnp_Locale: 'vn',
}));

jest.mock('../../../src/repositories', () => ({
  orderRepository: {
    findById: jest.fn(),
    updateStatus: jest.fn(),
    updatePaymentInfo: jest.fn(),
  },
}));

const vnpayService = require('../../../src/services/vnpay.service');
const { orderRepository } = require('../../../src/repositories');
const { ORDER_STATUS } = require('../../../src/constants');

const buildSignedParams = (params, secret) => {
  const keys = Object.keys(params).sort();
  const sorted = {};
  for (const key of keys) {
    const value = params[key];
    if (value !== '' && value !== undefined && value !== null) {
      sorted[key] = value;
    }
  }
  const signData = new URLSearchParams(sorted).toString();
  const signed = crypto
    .createHmac('sha512', secret)
    .update(Buffer.from(signData, 'utf-8'))
    .digest('hex');
  return { ...sorted, vnp_SecureHash: signed };
};

describe('VNPay Service', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('createPaymentUrl', () => {
    it('should build a payment url with signed params', () => {
      const url = vnpayService.createPaymentUrl({
        orderId: 123,
        amount: 100000,
        orderInfo: 'Order 123',
        ipAddr: '::1',
        bankCode: 'NCB',
        returnUrl: 'https://frontend.test/payment/vnpay-return',
      });

      const parsed = new URL(url);
      const params = parsed.searchParams;

      expect(parsed.origin + parsed.pathname).toBe('https://pay.test/');
      expect(params.get('vnp_TmnCode')).toBe('TESTCODE');
      expect(params.get('vnp_TxnRef')).toBe('123');
      expect(params.get('vnp_Amount')).toBe('10000000');
      expect(params.get('vnp_IpAddr')).toBe('127.0.0.1');
      expect(params.get('vnp_ReturnUrl')).toBe('https://frontend.test/payment/vnpay-return');
      expect(params.get('vnp_SecureHash')).toBeTruthy();
    });
  });

  describe('verifyReturnUrl', () => {
    it('should validate a correct signature', () => {
      const baseParams = {
        vnp_TxnRef: '123',
        vnp_Amount: '10000',
        vnp_ResponseCode: '00',
        vnp_TransactionNo: '999',
        vnp_BankCode: 'NCB',
        vnp_PayDate: '20240101101010',
      };

      const signedParams = buildSignedParams(baseParams, 'TESTSECRET');
      const result = vnpayService.verifyReturnUrl(signedParams);

      expect(result.isValid).toBe(true);
      expect(result.isSuccess).toBe(true);
      expect(result.orderId).toBe('123');
      expect(result.amount).toBe(100);
    });

    it('should mark invalid signature', () => {
      const result = vnpayService.verifyReturnUrl({
        vnp_TxnRef: '1',
        vnp_Amount: '10000',
        vnp_ResponseCode: '00',
        vnp_SecureHash: 'bad',
      });

      expect(result.isValid).toBe(false);
    });
  });

  describe('handleIpn', () => {
    it('should return invalid signature response', async () => {
      const result = await vnpayService.handleIpn({
        vnp_TxnRef: '1',
        vnp_Amount: '10000',
        vnp_ResponseCode: '00',
        vnp_SecureHash: 'bad',
      });

      expect(result).toEqual({ RspCode: '97', Message: 'Invalid signature' });
    });

    it('should update order status when payment success', async () => {
      const baseParams = {
        vnp_TxnRef: '123',
        vnp_Amount: '10000',
        vnp_ResponseCode: '00',
        vnp_TransactionNo: '999',
        vnp_BankCode: 'NCB',
        vnp_PayDate: '20240101101010',
      };
      const signedParams = buildSignedParams(baseParams, 'TESTSECRET');

      orderRepository.findById.mockResolvedValue({
        id: 123,
        total: 100,
        status: ORDER_STATUS.PENDING,
      });

      const result = await vnpayService.handleIpn(signedParams);

      expect(orderRepository.updateStatus).toHaveBeenCalledWith('123', ORDER_STATUS.PAID);
      expect(orderRepository.updatePaymentInfo).toHaveBeenCalledWith('123', {
        vnp_TransactionNo: '999',
        vnp_BankCode: 'NCB',
        vnp_PayDate: '20240101101010',
      });
      expect(result).toEqual({ RspCode: '00', Message: 'Confirm Success' });
    });
  });

  describe('normalizeReturnUrl', () => {
    it('should return empty string for invalid url', () => {
      expect(vnpayService.normalizeReturnUrl('ftp://invalid')).toBe('');
      expect(vnpayService.normalizeReturnUrl('not-a-url')).toBe('');
      expect(vnpayService.normalizeReturnUrl(null)).toBe('');
    });

    it('should normalize valid url', () => {
      expect(vnpayService.normalizeReturnUrl('https://example.com/')).toBe('https://example.com/');
    });
  });
});
