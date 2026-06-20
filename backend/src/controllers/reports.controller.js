/**
 * Reports Controller
 * Admin reporting endpoints
 */
const { reportsService } = require('../services');
const { asyncHandler } = require('../helpers/async.helper');
const { response } = require('../helpers');

/**
 * GET /api/v1/reports/top-products
 * Query:
 * - from (YYYY-MM-DD)
 * - to (YYYY-MM-DD)
 * - categoryId (number)
 * - productIds (comma-separated)
 *
 * Returns list of products ranked by quantity desc.
 */
const getTopProductsReport = asyncHandler(async (req, res) => {
  const { from, to, categoryId, productIds } = req.query;

  const categoryIdNum = categoryId ? Number(categoryId) : null;

  const ids = productIds
    ? productIds
        .split(',')
        .map((x) => Number(x))
        .filter((n) => !Number.isNaN(n))
    : null;

  const data = await reportsService.getTopProductsReport({
    from,
    to,
    categoryId: categoryIdNum,
    productIds: ids,
  });

  return response.success(res, { data, message: 'Lấy báo cáo thành công' });
});

/**
 * GET /api/v1/reports/top-products/export
 * Streams CSV download.
 * Same query params as getTopProductsReport.
 */
const exportTopProductsCsv = asyncHandler(async (req, res) => {
  const { from, to, categoryId, productIds } = req.query;

  const categoryIdNum = categoryId ? Number(categoryId) : null;

  const ids = productIds
    ? productIds
        .split(',')
        .map((x) => Number(x))
        .filter((n) => !Number.isNaN(n))
    : null;

  const filenameBase = `top_products_${new Date().toISOString().split('T')[0]}`;

  res.setHeader('Cache-Control', 'no-store');
  await reportsService.exportTopProductsCsv({
    from,
    to,
    categoryId: categoryIdNum,
    productIds: ids,
    res,
    filenameBase,
  });
});

/**
 * GET /api/v1/reports/products
 * Lists products to fill the product selector on the frontend.
 */
const listProductsForReport = asyncHandler(async (req, res) => {
  const { limit = 200 } = req.query;
  const products = await reportsService.listProductsForReport({ limit: Number(limit) });
  return response.success(res, { data: products, message: 'Lấy danh sách sản phẩm thành công' });
});

module.exports = {
  getTopProductsReport,
  exportTopProductsCsv,
  listProductsForReport,
};
