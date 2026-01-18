/**
 * Order Controller
 * Handles order HTTP requests
 */
const { orderService } = require('../services');
const { orderRepository } = require('../repositories');
const { response } = require('../helpers');
const { asyncHandler } = require('../helpers/async.helper');
const { parsePagination } = require('../helpers/pagination.helper');

/**
 * Create a new order
 * POST /api/v1/orders
 */
const create = asyncHandler(async (req, res) => {
  const order = await orderService.create(req.body, req.user);
  return response.created(res, order, 'Tạo đơn hàng thành công');
});

/**
 * Get order by ID
 * GET /api/v1/orders/:id
 */
const findById = asyncHandler(async (req, res) => {
  const order = await orderService.findById(req.params.id, req.user);
  return response.success(res, { data: order });
});

/**
 * Get current user's orders
 * GET /api/v1/orders/my
 */
const getMyOrders = asyncHandler(async (req, res) => {
  const orders = await orderService.findByUser(req.user.id);
  return response.success(res, { data: orders });
});

/**
 * Get all orders (admin only)
 * GET /api/v1/orders
 */
const findAll = asyncHandler(async (req, res) => {
  res.set('Cache-Control', 'no-store');
  const { page, limit } = parsePagination(req.query);
  const { status, search } = req.query;

  const result = await orderService.findAll({ page, limit, status, search });

  return response.paginated(res, {
    data: result.items,
    page,
    limit,
    total: result.total,
  });
});

/**
 * Export orders to CSV (admin only)
 * GET /api/v1/orders/export
 */
const exportOrders = asyncHandler(async (req, res) => {
  const { status, startDate, endDate, week, format } = req.query;

  // If `week` param provided (any date within week), compute week start/end (Mon-Sun)
  let sDate = startDate || null;
  let eDate = endDate || null;
  const formatDateSQL = (d) => {
    const pad = (n) => (n < 10 ? '0' + n : n);
    return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())} ${pad(d.getHours())}:${pad(d.getMinutes())}:${pad(d.getSeconds())}`;
  };

  if (week) {
    const wk = new Date(week);
    if (!Number.isNaN(wk.getTime())) {
      const day = wk.getDay();
      const diffToMonday = day === 0 ? -6 : 1 - day;
      const monday = new Date(wk);
      monday.setDate(wk.getDate() + diffToMonday);
      monday.setHours(0, 0, 0, 0);
      const sunday = new Date(monday);
      sunday.setDate(monday.getDate() + 6);
      sunday.setHours(23, 59, 59, 999);
      sDate = formatDateSQL(monday);
      eDate = formatDateSQL(sunday);
    }
  }

  const orders = await orderRepository.getOrdersForExport({ status, startDate: sDate, endDate: eDate });

  // Default to CSV, support XLSX
  const outFormat = (format || 'csv').toLowerCase();

  const statusLabels = { pending: 'Chờ xử lý', paid: 'Đã thanh toán', shipped: 'Đang giao', delivered: 'Đã nhận' };
  const paymentLabels = { cod: 'COD', bank_transfer: 'Chuyển khoản' };

  if (outFormat === 'xlsx') {
    const ExcelJS = require('exceljs');
    const workbook = new ExcelJS.Workbook();
    const sheet = workbook.addWorksheet('Orders');

    sheet.columns = [
      { header: 'Mã ĐH', key: 'id', width: 10 },
      { header: 'Khách hàng', key: 'userName', width: 30 },
      { header: 'Email', key: 'userEmail', width: 30 },
      { header: 'Tổng tiền', key: 'total', width: 15 },
      { header: 'Phí ship', key: 'shippingFee', width: 12 },
      { header: 'Trạng thái', key: 'status', width: 15 },
      { header: 'Thanh toán', key: 'paymentMethod', width: 15 },
      { header: 'Người nhận', key: 'shippingName', width: 25 },
      { header: 'SĐT', key: 'shippingPhone', width: 15 },
      { header: 'Địa chỉ', key: 'shippingAddress', width: 40 },
      { header: 'Thành phố', key: 'shippingCity', width: 20 },
      { header: 'Ghi chú', key: 'shippingNotes', width: 30 },
      { header: 'Sản phẩm', key: 'itemsSummary', width: 50 },
      { header: 'Ngày tạo', key: 'createdAt', width: 20 },
    ];

    for (const order of orders) {
      sheet.addRow({
        id: order.id,
        userName: order.userName || '',
        userEmail: order.userEmail || '',
        total: order.total,
        shippingFee: order.shippingFee || 30000,
        status: statusLabels[order.status] || order.status,
        paymentMethod: paymentLabels[order.paymentMethod] || order.paymentMethod,
        shippingName: order.shippingName || '',
        shippingPhone: order.shippingPhone || '',
        shippingAddress: order.shippingAddress || '',
        shippingCity: order.shippingCity || '',
        shippingNotes: order.shippingNotes || '',
        itemsSummary: order.itemsSummary || '',
        createdAt: order.createdAt ? new Date(order.createdAt).toLocaleString('vi-VN') : '',
      });
    }

    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    res.setHeader('Content-Disposition', `attachment; filename="orders_${new Date().toISOString().split('T')[0]}.xlsx"`);

    await workbook.xlsx.write(res);
    res.end();
    return;
  }

  // CSV fallback
  const headers = ['Mã ĐH', 'Khách hàng', 'Email', 'Tổng tiền', 'Phí ship', 'Trạng thái', 'Thanh toán', 'Người nhận', 'SĐT', 'Địa chỉ', 'Thành phố', 'Ghi chú', 'Sản phẩm', 'Ngày tạo'];
  const csvRows = [headers.join(',')];

  for (const order of orders) {
    const row = [
      order.id,
      `"${order.userName || ''}"`,
      order.userEmail || '',
      order.total,
      order.shippingFee || 30000,
      statusLabels[order.status] || order.status,
      paymentLabels[order.paymentMethod] || order.paymentMethod,
      `"${order.shippingName || ''}"`,
      order.shippingPhone || '',
      `"${order.shippingAddress || ''}"`,
      `"${order.shippingCity || ''}"`,
      `"${order.shippingNotes || ''}"`,
      `"${order.itemsSummary || ''}"`,
      order.createdAt ? new Date(order.createdAt).toLocaleString('vi-VN') : '',
    ];
    csvRows.push(row.join(','));
  }

  const csv = '\uFEFF' + csvRows.join('\n'); // BOM for UTF-8

  res.setHeader('Content-Type', 'text/csv; charset=utf-8');
  res.setHeader('Content-Disposition', `attachment; filename="orders_${new Date().toISOString().split('T')[0]}.csv"`);
  res.send(csv);
});

/**
 * Update order status (admin only)
 * PATCH /api/v1/orders/:id/status
 */
const updateStatus = asyncHandler(async (req, res) => {
  const order = await orderService.updateStatus(req.params.id, req.body, req.user);
  return response.success(res, { data: order, message: 'Cập nhật trạng thái đơn hàng thành công' });
});

/**
 * Cancel an order
 * POST /api/v1/orders/:id/cancel
 */
const cancel = asyncHandler(async (req, res) => {
  const order = await orderService.cancel(req.params.id, req.user);
  return response.success(res, { data: order, message: 'Hủy đơn hàng thành công' });
});

/**
 * Confirm delivery - user confirms they received the order
 * POST /api/v1/orders/:id/confirm-delivery
 */
const confirmDelivery = asyncHandler(async (req, res) => {
  const order = await orderService.confirmDelivery(req.params.id, req.user);
  return response.success(res, { data: order, message: 'Xác nhận nhận hàng thành công' });
});

module.exports = {
  create,
  findById,
  getMyOrders,
  findAll,
  updateStatus,
  cancel,
  confirmDelivery,
  exportOrders,
};
