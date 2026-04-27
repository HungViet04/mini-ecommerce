/**
 * VNPay Service
 * Handles VNPay payment gateway integration
 * Documentation: https://sandbox.vnpayment.vn/apis/docs/huong-dan-tich-hop/
 */
const crypto = require('crypto');
const vnpayConfig = require('../config/vnpay');
const { orderRepository } = require('../repositories');
const { ORDER_STATUS } = require('../constants');

class VNPayService {
  /**
   * Create VNPay payment URL
   * @param {Object} params - Payment parameters
   * @param {number} params.orderId - Order ID
   * @param {number} params.amount - Amount in VND
   * @param {string} params.orderInfo - Order description
   * @param {string} params.ipAddr - Client IP address
   * @param {string} params.bankCode - Bank code (optional)
   * @param {string} params.returnUrl - Frontend return URL (optional)
   * @returns {string} VNPay payment URL
   */
  createPaymentUrl({ orderId, amount, orderInfo, ipAddr, bankCode, returnUrl }) {
    const date = new Date();
    const createDate = this.formatDate(date);
    const normalizedReturnUrl = this.normalizeReturnUrl(returnUrl) || vnpayConfig.vnp_ReturnUrl;

    // Clean IP address
    let cleanIpAddr = ipAddr || '127.0.0.1';
    if (cleanIpAddr === '::1' || cleanIpAddr.includes('::')) {
      cleanIpAddr = '127.0.0.1';
    }

    // Build params
    const vnp_Params = {
      vnp_Version: '2.1.0',
      vnp_Command: 'pay',
      vnp_TmnCode: vnpayConfig.vnp_TmnCode,
      vnp_Locale: 'vn',
      vnp_CurrCode: 'VND',
      vnp_TxnRef: String(orderId),
      vnp_OrderInfo: String(orderInfo || `Thanhtoandonhang${orderId}`),
      vnp_OrderType: 'other',
      vnp_Amount: Math.floor(Number(amount)) * 100,
      vnp_ReturnUrl: normalizedReturnUrl,
      vnp_IpAddr: cleanIpAddr,
      vnp_CreateDate: createDate,
    };

    if (bankCode) {
      vnp_Params.vnp_BankCode = bankCode;
    }

    // Sort params
    const sortedParams = this.sortObject(vnp_Params);

    // Build sign data string
    const signData = new URLSearchParams(sortedParams).toString();

    // Create signature
    const hmac = crypto.createHmac('sha512', vnpayConfig.vnp_HashSecret);
    const signed = hmac.update(Buffer.from(signData, 'utf-8')).digest('hex');

    // Add signature
    sortedParams.vnp_SecureHash = signed;

    // Build URL
    const paymentUrl = vnpayConfig.vnp_Url + '?' + new URLSearchParams(sortedParams).toString();

    return paymentUrl;
  }

  /**
   * Verify VNPay return URL parameters
   * @param {Object} vnp_Params - VNPay return parameters
   * @returns {Object} Verification result
   */
  verifyReturnUrl(vnp_Params) {
    const secureHash = vnp_Params.vnp_SecureHash;

    // Remove hash params for verification
    const params = { ...vnp_Params };
    delete params.vnp_SecureHash;
    delete params.vnp_SecureHashType;

    // Sort and create signature
    const sortedParams = this.sortObject(params);
    const signData = new URLSearchParams(sortedParams).toString();
    const hmac = crypto.createHmac('sha512', vnpayConfig.vnp_HashSecret);
    const signed = hmac.update(Buffer.from(signData, 'utf-8')).digest('hex');

    // Compare signatures
    const isValidSignature = secureHash === signed;

    return {
      isValid: isValidSignature,
      orderId: vnp_Params.vnp_TxnRef,
      amount: parseInt(vnp_Params.vnp_Amount) / 100,
      responseCode: vnp_Params.vnp_ResponseCode,
      transactionNo: vnp_Params.vnp_TransactionNo,
      bankCode: vnp_Params.vnp_BankCode,
      payDate: vnp_Params.vnp_PayDate,
      message: this.getResponseMessage(vnp_Params.vnp_ResponseCode),
      isSuccess: isValidSignature && vnp_Params.vnp_ResponseCode === '00',
    };
  }

  /**
   * Handle VNPay IPN (Instant Payment Notification)
   * @param {Object} vnp_Params - VNPay IPN parameters
   * @returns {Object} IPN response
   */
  async handleIpn(vnp_Params) {
    const verifyResult = this.verifyReturnUrl(vnp_Params);

    if (!verifyResult.isValid) {
      return { RspCode: '97', Message: 'Invalid signature' };
    }

    const orderId = verifyResult.orderId;
    const amount = verifyResult.amount;

    try {
      // Get order from database
      const order = await orderRepository.findById(orderId);

      if (!order) {
        return { RspCode: '01', Message: 'Order not found' };
      }

      // Check amount
      if (order.total !== amount) {
        return { RspCode: '04', Message: 'Invalid amount' };
      }

      // Check if order already processed
      if (order.status !== ORDER_STATUS.PENDING) {
        return { RspCode: '02', Message: 'Order already confirmed' };
      }

      // Update order status if payment successful
      if (verifyResult.responseCode === '00') {
        await orderRepository.updateStatus(orderId, ORDER_STATUS.PAID);
        // Store transaction info
        await orderRepository.updatePaymentInfo(orderId, {
          vnp_TransactionNo: verifyResult.transactionNo,
          vnp_BankCode: verifyResult.bankCode,
          vnp_PayDate: verifyResult.payDate,
        });
      }

      return { RspCode: '00', Message: 'Confirm Success' };
    } catch (error) {
      console.error('VNPay IPN Error:', error);
      return { RspCode: '99', Message: 'Unknown error' };
    }
  }

  /**
   * Update order status after successful payment verification
   * @param {string} orderId - Order ID
   * @param {Object} paymentInfo - Payment information
   * @returns {Promise<Object>} Updated order
   */
  async updateOrderPaymentStatus(orderId, paymentInfo) {
    const order = await orderRepository.findById(orderId);

    if (!order) {
      throw new Error('Order not found');
    }

    if (order.status !== ORDER_STATUS.PENDING) {
      // Order already processed
      return order;
    }

    if (paymentInfo.isSuccess) {
      await orderRepository.updateStatus(orderId, ORDER_STATUS.PAID);
    }

    return await orderRepository.findById(orderId);
  }

  /**
   * Get response message from VNPay response code
   * @param {string} responseCode - VNPay response code
   * @returns {string} Human readable message
   */
  getResponseMessage(responseCode) {
    const messages = {
      '00': 'Giao dịch thành công',
      '07': 'Trừ tiền thành công. Giao dịch bị nghi ngờ (liên quan tới lừa đảo, giao dịch bất thường)',
      '09': 'Giao dịch không thành công do: Thẻ/Tài khoản chưa đăng ký dịch vụ InternetBanking',
      10: 'Giao dịch không thành công do: Khách hàng xác thực thông tin thẻ/tài khoản không đúng quá 3 lần',
      11: 'Giao dịch không thành công do: Đã hết hạn chờ thanh toán',
      12: 'Giao dịch không thành công do: Thẻ/Tài khoản bị khóa',
      13: 'Giao dịch không thành công do: Quý khách nhập sai mật khẩu xác thực giao dịch (OTP)',
      24: 'Giao dịch không thành công do: Khách hàng hủy giao dịch',
      51: 'Giao dịch không thành công do: Tài khoản không đủ số dư',
      65: 'Giao dịch không thành công do: Tài khoản đã vượt quá hạn mức giao dịch trong ngày',
      75: 'Ngân hàng thanh toán đang bảo trì',
      79: 'Giao dịch không thành công do: KH nhập sai mật khẩu thanh toán quá số lần quy định',
      99: 'Các lỗi khác',
    };

    return messages[responseCode] || 'Lỗi không xác định';
  }

  /**
   * Sort object keys alphabetically
   * @param {Object} obj - Object to sort
   * @returns {Object} Sorted object
   */
  sortObject(obj) {
    const sorted = {};
    const keys = Object.keys(obj).sort();

    for (const key of keys) {
      if (obj[key] !== '' && obj[key] !== undefined && obj[key] !== null) {
        sorted[key] = obj[key];
      }
    }

    return sorted;
  }

  /**
   * Format date for VNPay (yyyyMMddHHmmss)
   * @param {Date} date - Date to format
   * @returns {string} Formatted date string
   */
  formatDate(date) {
    const pad = (n) => (n < 10 ? '0' + n : n);

    return (
      date.getFullYear().toString() +
      pad(date.getMonth() + 1) +
      pad(date.getDate()) +
      pad(date.getHours()) +
      pad(date.getMinutes()) +
      pad(date.getSeconds())
    );
  }

  /**
   * Normalize and validate return URL
   * @param {string} url
   * @returns {string}
   */
  normalizeReturnUrl(url) {
    if (!url || typeof url !== 'string') {
      return '';
    }

    try {
      const parsed = new URL(url.trim());
      if (parsed.protocol !== 'http:' && parsed.protocol !== 'https:') {
        return '';
      }
      return parsed.toString();
    } catch (error) {
      return '';
    }
  }
}

module.exports = new VNPayService();
