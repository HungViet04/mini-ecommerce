/**
 * VNPay Configuration
 * Payment gateway configuration for VNPay integration
 */
require('dotenv').config();

const vnpayConfig = {
  // VNPay Merchant Code
  vnp_TmnCode: process.env.VNP_TMN_CODE || 'IHTV079Z',

  // VNPay Secret Key for HMAC SHA512
  vnp_HashSecret: process.env.VNP_HASH_SECRET || 'SAX124FFT2YF0PASUK5FO6CWU9945LQX',

  // VNPay Payment URL (sandbox for development)
  vnp_Url:
    process.env.VNP_URL || 'https://sandbox.vnpayment.vn/paymentv2/vpcpay.html',

  // Frontend URL for return after payment
  vnp_ReturnUrl:
    process.env.VNP_RETURN_URL || 'http://localhost:5173/payment/vnpay-return',

  // API version
  vnp_Version: '2.1.0',

  // Command for payment
  vnp_Command: 'pay',

  // Currency code (VND)
  vnp_CurrCode: 'VND',

  // Locale
  vnp_Locale: 'vn',
};

// Freeze config to prevent accidental modifications
Object.freeze(vnpayConfig);

module.exports = vnpayConfig;
