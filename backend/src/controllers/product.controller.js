/**
 * Product Controller
 * Handles product HTTP requests
 */
const { productService } = require('../services');
const { response } = require('../helpers');
const { asyncHandler } = require('../helpers/async.helper');
const { parsePagination } = require('../helpers/pagination.helper');

/**
 * Create a new product
 * POST /api/v1/products
 */
const create = asyncHandler(async (req, res) => {
  const product = await productService.create(req.body);
  return response.created(res, product, 'Tạo sản phẩm thành công');
});

/**
 * Get all products with pagination
 * GET /api/v1/products
 */
const findAll = asyncHandler(async (req, res) => {
  const { page, limit } = parsePagination(req.query);
  const { orderBy = 'id', order = 'DESC' } = req.query;

  const result = await productService.findAll({ page, limit, orderBy, order });

  return response.paginated(res, {
    data: result.items,
    page,
    limit,
    total: result.total,
  });
});

/**
 * Get product by ID
 * GET /api/v1/products/:id
 */
const findById = asyncHandler(async (req, res) => {
  const product = await productService.findById(req.params.id);
  return response.success(res, { data: product });
});

/**
 * Search products
 * GET /api/v1/products/search
 */
const search = asyncHandler(async (req, res) => {
  const { q, limit = 50, offset = 0 } = req.query;
  const products = await productService.search(q, { limit: Number(limit), offset: Number(offset) });
  return response.success(res, { data: products });
});

/**
 * Update a product
 * PUT /api/v1/products/:id
 */
const update = asyncHandler(async (req, res) => {
  const product = await productService.update(req.params.id, req.body);
  return response.success(res, { data: product, message: 'Cập nhật sản phẩm thành công' });
});

/**
 * Delete a product
 * DELETE /api/v1/products/:id
 */
const remove = asyncHandler(async (req, res) => {
  await productService.delete(req.params.id);
  return response.success(res, { message: 'Xóa sản phẩm thành công' });
});

/**
 * Get products by category
 * GET /api/v1/products/category/:categoryId
 */
const findByCategory = asyncHandler(async (req, res) => {
  const products = await productService.findByCategory(Number(req.params.categoryId));
  return response.success(res, { data: products });
});

/**
 * Check product availability
 * GET /api/v1/products/:id/availability
 */
const checkAvailability = asyncHandler(async (req, res) => {
  const quantity = Number(req.query.quantity) || 1;
  const result = await productService.checkAvailability(req.params.id, quantity);
  return response.success(res, { data: result });
});

module.exports = {
  create,
  findAll,
  findById,
  search,
  update,
  remove,
  findByCategory,
  checkAvailability,
};
