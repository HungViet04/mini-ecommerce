/**
 * Order Service
 * Handles order business logic with transaction support
 * Vietnamese messages
 */
const database = require('../config/database');
const { productRepository, orderRepository } = require('../repositories');
const { NotFoundError, OutOfStockError, AuthorizationError, ValidationError } = require('../errors');
const { USER_ROLES, ORDER_STATUS } = require('../constants');
const { validateCreateOrder, validateStatusUpdate, validateOrderId } = require('../validators/order.validator');

class OrderService {
  /**
   * Create a new order with transaction
   * @param {Object} data - Order data
   * @param {Object} currentUser - Current authenticated user
   * @returns {Promise<Object>} Created order
   */
  async create(data, currentUser) {
    // Validate input
    const validatedData = validateCreateOrder(data);

    // Check authorization for creating orders for other users
    if (validatedData.userId && validatedData.userId !== currentUser.id) {
      if (currentUser.role !== USER_ROLES.ADMIN) {
  throw new AuthorizationError('Chỉ admin mới có thể tạo đơn hàng cho người khác');
      }
    }

    const userId = validatedData.userId || currentUser.id;
    const items = validatedData.items;
    const productIds = items.map((item) => item.productId);
    const { shippingInfo, paymentMethod, shippingFee } = validatedData;

    // Execute transaction
    const order = await database.transaction(async (connection) => {
      // Lock products for update
  const products = await productRepository.findByIdsForUpdate(connection, productIds);

      // Create product map for quick lookup
      const productMap = new Map(products.map((p) => [p.id, p]));

      // Validate stock and calculate total
      let subtotal = 0;
      const orderItems = [];

      for (const item of items) {
        const product = productMap.get(item.productId);

        if (!product) {
          throw new NotFoundError('Product', `Sản phẩm #${item.productId} không tồn tại`);
        }

        if (product.stock < item.quantity) {
          throw new OutOfStockError(item.productId, product.stock, item.quantity);
        }

        const itemTotal = Number(product.price) * item.quantity;
        subtotal += itemTotal;

        orderItems.push({
          productId: item.productId,
          quantity: item.quantity,
          price: product.price,
          productName: product.name,
        });
      }

      // Total includes shipping fee
      const total = subtotal + shippingFee;

      // Create order with shipping info
      const createdOrder = await orderRepository.createOrder(connection, {
        userId,
        total,
        status: ORDER_STATUS.PENDING,
        shippingName: shippingInfo?.name || null,
        shippingPhone: shippingInfo?.phone || null,
        shippingAddress: shippingInfo?.address || null,
        shippingCity: shippingInfo?.city || null,
        shippingNotes: shippingInfo?.notes || null,
        paymentMethod: paymentMethod || 'cod',
        shippingFee,
      });

      // Create order items and decrement stock
      for (const item of orderItems) {
        await orderRepository.createOrderItem(connection, {
          orderId: createdOrder.id,
          productId: item.productId,
          quantity: item.quantity,
          price: item.price,
        });

  await productRepository.decrementStock(connection, item.productId, item.quantity);
      }

      return {
        id: createdOrder.id,
        userId,
        subtotal,
        shippingFee,
        total,
        status: ORDER_STATUS.PENDING,
        paymentMethod,
        shippingInfo,
        items: orderItems,
      };
    });

    return order;
  }

  /**
   * Get order by ID
   * @param {number|string} id - Order ID
   * @param {Object} currentUser - Current user (for authorization)
   * @returns {Promise<Object>} Order
   */
  async findById(id, currentUser) {
    const validatedId = validateOrderId(id);
    const order = await orderRepository.getOrderWithItems(validatedId);

    if (!order) {
      throw new NotFoundError('Order');
    }

    // Check authorization
    if (currentUser.role !== USER_ROLES.ADMIN && order.userId !== currentUser.id) {
      throw new AuthorizationError('Bạn chỉ có thể xem đơn hàng của mình');
    }

    return order;
  }

  /**
   * Get orders for a user
   * @param {number} userId - User ID
   * @returns {Promise<Array>} Orders
   */
  async findByUser(userId) {
    if (!userId) {
      throw new ValidationError('Vui lòng cung cấp ID người dùng');
    }
    return orderRepository.getOrdersWithItemsByUser(userId);
  }

  /**
   * Get all orders (admin only)
   * @param {Object} options - Query options
   * @returns {Promise<Object>} { items, total }
   */
  async findAll(options = {}) {
    return orderRepository.findAllWithPagination(options);
  }

  /**
   * Update order status
   * @param {number|string} id - Order ID
   * @param {Object} data - Status update data
   * @param {Object} currentUser - Current user
   * @returns {Promise<Object>} Updated order
   */
  async updateStatus(id, data, currentUser) {
    const validatedId = validateOrderId(id);
    const { status } = validateStatusUpdate(data);

    const order = await orderRepository.findById(validatedId);
    if (!order) {
      throw new NotFoundError('Order');
    }

    // Only admin can update status (except user confirming delivery)
    if (currentUser.role !== USER_ROLES.ADMIN) {
      throw new AuthorizationError('Chỉ admin mới có thể cập nhật trạng thái đơn hàng');
    }

    // Validate status transition
    this.validateStatusTransition(order.status, status);

    return orderRepository.updateStatus(validatedId, status);
  }

  /**
   * Confirm delivery - user confirms they received the order
   * @param {number|string} id - Order ID
   * @param {Object} currentUser - Current user
   * @returns {Promise<Object>} Updated order
   */
  async confirmDelivery(id, currentUser) {
    const validatedId = validateOrderId(id);
    const order = await orderRepository.findById(validatedId);

    if (!order) {
      throw new NotFoundError('Order');
    }

    // Check authorization - user can only confirm their own orders
    if (order.user_id !== currentUser.id) {
      throw new AuthorizationError('Bạn chỉ có thể xác nhận đơn hàng của mình');
    }

    // Only shipped orders can be confirmed as delivered
    if (order.status !== ORDER_STATUS.SHIPPED) {
      throw new ValidationError('Chỉ có thể xác nhận nhận hàng khi đơn hàng đã được giao');
    }

    return orderRepository.updateStatus(validatedId, ORDER_STATUS.DELIVERED);
  }

  /**
   * Cancel order - only pending orders can be cancelled
   * @param {number|string} id - Order ID
   * @param {Object} currentUser - Current user
   * @returns {Promise<Object>} Result
   */
  async cancel(id, currentUser) {
    const validatedId = validateOrderId(id);
    const order = await orderRepository.getOrderWithItems(validatedId);

    if (!order) {
      throw new NotFoundError('Order');
    }

    // Check authorization
    if (currentUser.role !== USER_ROLES.ADMIN && order.userId !== currentUser.id) {
      throw new AuthorizationError('Bạn chỉ có thể hủy đơn hàng của mình');
    }

    // Only pending orders can be cancelled
    if (order.status !== ORDER_STATUS.PENDING) {
      throw new ValidationError('Chỉ có thể hủy đơn hàng đang chờ xử lý');
    }

    // Execute transaction to restore stock and delete order
    await database.transaction(async (connection) => {
      // Restore stock for each item
      for (const item of order.items) {
        await productRepository.incrementStock(connection, item.productId, item.quantity);
      }

      // Delete order items first (foreign key constraint)
      await connection.execute('DELETE FROM order_items WHERE order_id = ?', [validatedId]);
      // Delete the order
      await connection.execute('DELETE FROM orders WHERE id = ?', [validatedId]);
    });

    return { message: 'Đơn hàng đã được hủy thành công', orderId: validatedId };
  }

  /**
   * Validate status transition based on database enum: pending -> paid -> shipped -> delivered
   * @param {string} currentStatus - Current status
   * @param {string} newStatus - New status
   */
  validateStatusTransition(currentStatus, newStatus) {
    const statusLabels = {
      'pending': 'Chờ xử lý',
      'paid': 'Đã thanh toán',
      'shipped': 'Đã giao hàng',
      'delivered': 'Đã nhận hàng'
    };

    const validTransitions = {
      [ORDER_STATUS.PENDING]: [ORDER_STATUS.PAID],
      [ORDER_STATUS.PAID]: [ORDER_STATUS.SHIPPED],
      [ORDER_STATUS.SHIPPED]: [ORDER_STATUS.DELIVERED],
      [ORDER_STATUS.DELIVERED]: [],
    };

    const allowed = validTransitions[currentStatus] || [];
    if (!allowed.includes(newStatus)) {
      const currentLabel = statusLabels[currentStatus] || currentStatus;
      const newLabel = statusLabels[newStatus] || newStatus;
      const allowedLabels = allowed.map(s => statusLabels[s] || s).join(', ') || 'không có';
      throw new ValidationError(
        `Không thể chuyển từ "${currentLabel}" sang "${newLabel}". Trạng thái hợp lệ: ${allowedLabels}`
      );
    }
  }
}

// Export singleton instance
module.exports = new OrderService();
