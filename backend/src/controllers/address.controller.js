/**
 * Address Controller
 * Handles user address HTTP requests
 */
const { addressService } = require('../services');
const { response } = require('../helpers');
const { asyncHandler } = require('../helpers/async.helper');

/**
 * Get current user's addresses
 * GET /api/v1/addresses
 */
const getMyAddresses = asyncHandler(async (req, res) => {
  const addresses = await addressService.findByUser(req.user.id);
  return response.success(res, { data: addresses });
});

/**
 * Create address
 * POST /api/v1/addresses
 */
const create = asyncHandler(async (req, res) => {
  const address = await addressService.create(req.user.id, req.body);
  return response.created(res, address, 'Thêm địa chỉ thành công');
});

/**
 * Update address
 * PATCH /api/v1/addresses/:id
 */
const update = asyncHandler(async (req, res) => {
  const address = await addressService.update(req.params.id, req.user.id, req.body);
  return response.success(res, { data: address, message: 'Cập nhật địa chỉ thành công' });
});

/**
 * Delete address
 * DELETE /api/v1/addresses/:id
 */
const remove = asyncHandler(async (req, res) => {
  const result = await addressService.delete(req.params.id, req.user.id);
  return response.success(res, { data: result });
});

/**
 * Set default address
 * POST /api/v1/addresses/:id/default
 */
const setDefault = asyncHandler(async (req, res) => {
  const address = await addressService.setDefault(req.params.id, req.user.id);
  return response.success(res, { data: address, message: 'Đặt địa chỉ mặc định thành công' });
});

module.exports = {
  getMyAddresses,
  create,
  update,
  remove,
  setDefault,
};
