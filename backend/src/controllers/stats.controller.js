/** * Stats Controller * Dashboard statistics endpoints */
const statsService = require('../services/stats.service');
const { asyncHandler } = require('../helpers');
const { ValidationError } = require('../errors');

const parseDateStringUTC = (value) => {
  if (!value || typeof value !== 'string') return null;
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) return null;
  const [year, month, day] = value.split('-').map((part) => Number(part));
  if (!year || !month || !day) return null;
  const date = new Date(Date.UTC(year, month - 1, day));
  if (
    date.getUTCFullYear() !== year ||
    date.getUTCMonth() !== month - 1 ||
    date.getUTCDate() !== day
  ) {
    return null;
  }
  return date;
};

const addMonthsUTC = (date, months) => {
  const year = date.getUTCFullYear();
  const month = date.getUTCMonth();
  const day = date.getUTCDate();
  const base = new Date(Date.UTC(year, month + months, 1));
  const lastDay = new Date(Date.UTC(base.getUTCFullYear(), base.getUTCMonth() + 1, 0)).getUTCDate();
  base.setUTCDate(Math.min(day, lastDay));
  return base;
};

/** * Get dashboard statistics
 * GET /api/v1/stats/dashboard */
const getDashboardStats = asyncHandler(async (req, res) => {
  const { from, to } = req.query;
  let range = null;
  if (from || to) {
    if (!from || !to) {
      throw new ValidationError('Thiếu tham số from hoặc to');
    }
    const fromDate = parseDateStringUTC(from);
    const toDate = parseDateStringUTC(to);
    if (!fromDate || !toDate) {
      throw new ValidationError('Định dạng ngày không hợp lệ (YYYY-MM-DD)');
    }
    if (fromDate.getTime() > toDate.getTime()) {
      throw new ValidationError('Khoảng thời gian không hợp lệ');
    }
    const maxEnd = addMonthsUTC(fromDate, 2);
    if (toDate.getTime() > maxEnd.getTime()) {
      throw new ValidationError('Khoảng thời gian tối đa là 2 tháng');
    }
    range = { from, to };
  }
  const stats = await statsService.getDashboardStats(range);
  res.json({ success: true, data: stats });
});

module.exports = { getDashboardStats };
