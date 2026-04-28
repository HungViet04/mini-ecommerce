/**
 * VNPay Service Tests
 */
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { vnpayService } from '../../src/services/vnpay.service';
import httpClient from '../../src/services/http.client';

vi.mock('../../src/services/http.client', () => ({
  default: {
    post: vi.fn(),
    get: vi.fn(),
  },
}));

describe('VNPayService', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should create payment url', async () => {
    httpClient.post.mockResolvedValueOnce({ data: { paymentUrl: 'https://pay.test' } });

    const result = await vnpayService.createPaymentUrl(12, 'NCB');

    expect(httpClient.post).toHaveBeenCalledWith('/vnpay/create-payment-url', {
      orderId: 12,
      bankCode: 'NCB',
    });
    expect(result.paymentUrl).toBe('https://pay.test');
  });

  it('should verify return params', async () => {
    httpClient.get.mockResolvedValueOnce({ data: { isSuccess: true } });

    const result = await vnpayService.verifyReturn({ vnp_TxnRef: '1', vnp_ResponseCode: '00' });

    expect(httpClient.get).toHaveBeenCalledWith('/vnpay/return?vnp_TxnRef=1&vnp_ResponseCode=00');
    expect(result.isSuccess).toBe(true);
  });

  it('should get payment status', async () => {
    httpClient.get.mockResolvedValueOnce({ data: { status: 'paid' } });

    const result = await vnpayService.getPaymentStatus(99);

    expect(httpClient.get).toHaveBeenCalledWith('/vnpay/status/99');
    expect(result.status).toBe('paid');
  });
});
