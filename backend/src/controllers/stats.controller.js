/**
 * Stats Controller
 * Dashboard statistics endpoints
 */
const statsService = require('../services/stats.service');
const { asyncHandler } = require('../helpers');

/**
 * Get dashboard statistics
 * GET /api/v1/stats/dashboard
 */
const getDashboardStats = asyncHandler(async (req, res) => {
  const stats = await statsService.getDashboardStats();

  res.json({
    success: true,
    data: stats,
  });
});

module.exports = {
  getDashboardStats,
};
