/**
 * Order Validators
 * Validation functions for order-related operations
 * Vietnamese error messages
 */
const { ValidationError } = require('../errors');
const { ORDER_STATUS } = require('../constants');
const { isPositiveInteger } = require('./common.validator');
const PAYMENT_METHODS = ['cod', 'vnpay'];
const SHIPPING_FEE = 30000;

/**
 * Validate order item
 * @param {Object} item - Order item
 * @param {number} index - Item index
 * @returns {Object} Validated item
 */
const validateOrderItem = (item, index) => {
  const errors = [];

  const productId = item.productId || item.product_id;
  const quantity = item.quantity;

  if (!isPositiveInteger(productId)) {
    errors.push({
      field: `items[${index}].productId`,
      message: 'ID sản phẩm phải là số nguyên dương',
    });
  }
  if (!isPositiveInteger(quantity)) {
    errors.push({ field: `items[${index}].quantity`, message: 'Số lượng phải là số nguyên dương' });
  }

  return {
    productId: Number(productId),
    quantity: Number(quantity),
    errors,
  };
};

/**
 * Validate shipping info
 * @param {Object} shippingInfo - Shipping information
 * @returns {Object} Validation result
 */
const validateShippingInfo = (shippingInfo) => {
  const errors = [];
  if (!shippingInfo) {
    return { shippingInfo: null, errors: [] };
  }
  const { fullName, phone, province, district, ward, address, note } = shippingInfo;
  if (!fullName || !fullName.trim()) {
    errors.push({ field: 'shippingInfo.fullName', message: 'Vui lòng nhập họ tên người nhận' });
  }
  if (!phone || !phone.trim()) {
    errors.push({ field: 'shippingInfo.phone', message: 'Vui lòng nhập số điện thoại' });
  } else if (!/^(0[3|5|7|8|9])+([0-9]{8})$/.test(phone)) {
    errors.push({ field: 'shippingInfo.phone', message: 'Số điện thoại không hợp lệ' });
  }
  if (!province || !province.trim()) {
    errors.push({ field: 'shippingInfo.province', message: 'Vui lòng nhập Tỉnh/Thành phố' });
  }
  if (!district || !district.trim()) {
    errors.push({ field: 'shippingInfo.district', message: 'Vui lòng nhập Quận/Huyện' });
  }
  if (!ward || !ward.trim()) {
    errors.push({ field: 'shippingInfo.ward', message: 'Vui lòng nhập Phường/Xã' });
  }
  if (!address || !address.trim()) {
    errors.push({ field: 'shippingInfo.address', message: 'Vui lòng nhập địa chỉ cụ thể' });
  }
  // Build address parts
  const fullAddress = [address, ward, district].filter(Boolean).join(', ');
  const city = province?.trim() || '';
  return {
    shippingInfo: {
      name: fullName?.trim() || '',
      phone: phone?.trim() || '',
      address: fullAddress,
      city: city,
      notes: note?.trim() || '',
    },
    errors,
  };
};

/**
 * Validate create order data
 * @param {Object} data - Order data
 * @returns {Object} Validated data
 * @throws {ValidationError}
 */
const validateCreateOrder = (data) => {
  const errors = [];

  const { items, userId, shippingInfo, paymentMethod } = data;

  // Validate items array
  if (!items || !Array.isArray(items) || items.length === 0) {
    throw new ValidationError('Đơn hàng phải có ít nhất một sản phẩm', [
      { field: 'items', message: 'Vui lòng thêm sản phẩm vào giỏ hàng' },
    ]);
  }

  // Validate each item and aggregate quantities
  const aggregatedItems = new Map();
  for (let i = 0; i < items.length; i++) {
    const validated = validateOrderItem(items[i], i);
    errors.push(...validated.errors);

    if (validated.errors.length === 0) {
      const currentQty = aggregatedItems.get(validated.productId) || 0;
      aggregatedItems.set(validated.productId, currentQty + validated.quantity);
    }
  }

  // Validate userId if provided
  if (userId !== undefined && userId !== null && !isPositiveInteger(userId)) {
    errors.push({ field: 'userId', message: 'ID người dùng phải là số nguyên dương' });
  }
  // Validate shipping info
  const shippingValidation = validateShippingInfo(shippingInfo);
  errors.push(...shippingValidation.errors);

  // Validate payment method
  const validPaymentMethod =
    paymentMethod && PAYMENT_METHODS.includes(paymentMethod) ? paymentMethod : 'cod';

  if (errors.length > 0) {
    throw new ValidationError('Dữ liệu không hợp lệ', errors);
  }

  // Convert Map to array of items
  const validatedItems = Array.from(aggregatedItems.entries()).map(([productId, quantity]) => ({
    productId,
    quantity,
  }));
  return {
    items: validatedItems,
    userId: userId ? Number(userId) : null,
    shippingInfo: shippingValidation.shippingInfo,
    paymentMethod: validPaymentMethod,
    shippingFee: SHIPPING_FEE,
  };
};

/**
 * Validate order status update
 * @param {Object} data - Status update data
 * @returns {Object} Validated data
 * @throws {ValidationError}
 */
const validateStatusUpdate = (data) => {
  const { status } = data;
  const validStatuses = Object.values(ORDER_STATUS);
  const statusLabels = {
    pending: 'Chờ xử lý',
    paid: 'Đã thanh toán',
    shipped: 'Đang giao hàng',
    delivered: 'Đã nhận hàng',
  };

  if (!status || !validStatuses.includes(status.toLowerCase())) {
    throw new ValidationError('Trạng thái đơn hàng không hợp lệ', [
      {
        field: 'status',
        message: `Trạng thái phải là một trong: ${validStatuses.map((s) => statusLabels[s] || s).join(', ')}`,
      },
    ]);
  }

  return { status: status.toLowerCase() };
};

/**
 * Validate order ID parameter
 * @param {any} id - Order ID
 * @returns {number} Validated ID
 * @throws {ValidationError}
 */
const validateOrderId = (id) => {
  if (!isPositiveInteger(id)) {
    throw new ValidationError('ID đơn hàng không hợp lệ');
  }
  return Number(id);
};

module.exports = {
  validateCreateOrder,
  validateStatusUpdate,
  validateOrderId,
  validateOrderItem,
};
