/**
 * VNPay Controller
 * Handles VNPay payment HTTP requests
 */
const vnpayService = require('../services/vnpay.service');
const { orderRepository } = require('../repositories');
const { response } = require('../helpers');
const { asyncHandler } = require('../helpers/async.helper');
const { NotFoundError, ValidationError } = require('../errors');

/**
 * Create VNPay payment URL
 * POST /api/v1/vnpay/create-payment-url
 */
const createPaymentUrl = asyncHandler(async (req, res) => {
  const { orderId, bankCode } = req.body;

  if (!orderId) {
    throw new ValidationError('Vui lòng cung cấp mã đơn hàng');
  }

  // Get order details
  const order = await orderRepository.findById(orderId);

  if (!order) {
    throw new NotFoundError('Order', 'Đơn hàng không tồn tại');
  }

  // Check if order belongs to current user (unless admin)
  if (req.user.role !== 'admin' && order.user_id !== req.user.id) {
    throw new ValidationError('Bạn không có quyền thanh toán đơn hàng này');
  }

  // Check order status
  if (order.status !== 'pending') {
    throw new ValidationError('Đơn hàng đã được thanh toán hoặc không thể thanh toán');
  }

  // Get client IP
  const ipAddr =
    req.headers['x-forwarded-for']?.split(',')[0] ||
    req.connection?.remoteAddress ||
    req.socket?.remoteAddress ||
    '127.0.0.1';

  // Create payment URL
  const paymentUrl = vnpayService.createPaymentUrl({
    orderId: order.id,
    amount: Number(order.total),
    orderInfo: `Don hang ${order.id}`,
    ipAddr: ipAddr.replace('::ffff:', ''),
    bankCode,
  });

  return response.success(res, {
    data: { paymentUrl },
    message: 'Tạo URL thanh toán thành công',
  });
});

/**
 * Handle VNPay return URL
 * GET /api/v1/vnpay/return
 */
const vnpayReturn = asyncHandler(async (req, res) => {
  const vnp_Params = req.query;

  // Verify return URL
  const result = vnpayService.verifyReturnUrl(vnp_Params);

  // Update order status if payment successful
  if (result.isValid && result.isSuccess) {
    await vnpayService.updateOrderPaymentStatus(result.orderId, result);
  }

  return response.success(res, {
    data: {
      orderId: result.orderId,
      amount: result.amount,
      isSuccess: result.isSuccess,
      message: result.message,
      transactionNo: result.transactionNo,
      bankCode: result.bankCode,
    },
    message: result.isSuccess ? 'Thanh toán thành công' : 'Thanh toán thất bại',
  });
});

/**
 * Handle VNPay IPN (Instant Payment Notification)
 * POST /api/v1/vnpay/ipn
 * This endpoint is called by VNPay server to confirm payment
 */
const vnpayIpn = asyncHandler(async (req, res) => {
  const vnp_Params = req.query;

  const result = await vnpayService.handleIpn(vnp_Params);

  // VNPay expects specific response format
  return res.status(200).json(result);
});

/**
 * Get payment status for an order
 * GET /api/v1/vnpay/status/:orderId
 */
const getPaymentStatus = asyncHandler(async (req, res) => {
  const { orderId } = req.params;

  const order = await orderRepository.findById(orderId);

  if (!order) {
    throw new NotFoundError('Order', 'Đơn hàng không tồn tại');
  }

  // Check if order belongs to current user (unless admin)
  if (req.user.role !== 'admin' && order.user_id !== req.user.id) {
    throw new ValidationError('Bạn không có quyền xem đơn hàng này');
  }

  return response.success(res, {
    data: {
      orderId: order.id,
      status: order.status,
      paymentMethod: order.payment_method,
      isPaid: order.status !== 'pending',
    },
    message: 'Lấy trạng thái thanh toán thành công',
  });
});

module.exports = {
  createPaymentUrl,
  vnpayReturn,
  vnpayIpn,
  getPaymentStatus,
};
