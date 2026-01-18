/**
 * Category Controller
 * Handles category HTTP requests
 */
const { categoryService } = require('../services');
const { response } = require('../helpers');
const { asyncHandler } = require('../helpers/async.helper');

/**
 * Create a new category
 * POST /api/v1/categories
 */
const create = asyncHandler(async (req, res) => {
  const category = await categoryService.create(req.body);
  return response.created(res, category, 'Tạo danh mục thành công');
});

/**
 * Get all categories
 * GET /api/v1/categories
 */
const findAll = asyncHandler(async (req, res) => {
  const { withCount } = req.query;
  
  const categories = withCount === 'true'
    ? await categoryService.findWithProductCount()
    : await categoryService.findAll();
    
  return response.success(res, { data: categories });
});

/**
 * Get category by ID
 * GET /api/v1/categories/:id
 */
const findById = asyncHandler(async (req, res) => {
  const category = await categoryService.findById(Number(req.params.id));
  return response.success(res, { data: category });
});

/**
 * Update a category
 * PUT /api/v1/categories/:id
 */
const update = asyncHandler(async (req, res) => {
  const category = await categoryService.update(Number(req.params.id), req.body);
  return response.success(res, { data: category, message: 'Cập nhật danh mục thành công' });
});

/**
 * Delete a category
 * DELETE /api/v1/categories/:id
 */
const remove = asyncHandler(async (req, res) => {
  await categoryService.delete(Number(req.params.id));
  return response.success(res, { message: 'Xóa danh mục thành công' });
});

module.exports = {
  create,
  findAll,
  findById,
  update,
  remove,
};
