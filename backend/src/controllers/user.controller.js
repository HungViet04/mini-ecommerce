/**
 * User Controller
 * User management endpoints (admin)
 */
const userService = require('../services/user.service');
const { asyncHandler, response } = require('../helpers');
const { parsePagination } = require('../helpers/pagination.helper');

/**
 * Get all users
 * GET /api/v1/users
 */
const getAll = asyncHandler(async (req, res) => {
  const { role, search } = req.query;
  const { page, limit } = parsePagination(req.query);

  const result = await userService.findAll({
    page,
    limit,
    role,
    search,
  });

  response.paginated(res, {
    data: result.items,
    page,
    limit,
    total: result.total,
  });
});

/**
 * Get user by ID
 * GET /api/v1/users/:id
 */
const getById = asyncHandler(async (req, res) => {
  const user = await userService.findById(parseInt(req.params.id, 10));
  response.success(res, { data: user });
});

/**
 * Update user role
 * PATCH /api/v1/users/:id/role
 */
const updateRole = asyncHandler(async (req, res) => {
  const { role } = req.body;
  const user = await userService.updateRole(parseInt(req.params.id, 10), role, req.user);
  response.success(res, { data: user, message: 'Cập nhật role thành công' });
});

/**
 * Delete user
 * DELETE /api/v1/users/:id
 */
const deleteUser = asyncHandler(async (req, res) => {
  const result = await userService.delete(parseInt(req.params.id, 10), req.user);
  response.success(res, { data: result });
});

/**
 * Get user's orders
 * GET /api/v1/users/:id/orders
 */
const getUserOrders = asyncHandler(async (req, res) => {
  const orders = await userService.getUserOrders(parseInt(req.params.id, 10));
  response.success(res, { data: orders });
});

module.exports = {
  getAll,
  getById,
  updateRole,
  deleteUser,
  getUserOrders,
};
