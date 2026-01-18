/**
 * Health Controller
 * Handles health check endpoints
 */
const database = require('../config/database');
const { response } = require('../helpers');
const { asyncHandler } = require('../helpers/async.helper');

/**
 * Ping endpoint
 * GET /api/v1/health/ping
 */
const ping = (req, res) => {
  return response.success(res, {
    data: {
      uptime: process.uptime(),
      timestamp: new Date().toISOString(),
    },
    message: 'pong',
  });
};

/**
 * Database health check
 * GET /api/v1/health/db
 */
const db = asyncHandler(async (req, res) => {
  const [rows] = await database.query('SELECT 1 as ok');
  const isHealthy = rows && rows.length > 0;

  return response.success(res, {
    data: {
      database: isHealthy ? 'healthy' : 'unhealthy',
      timestamp: new Date().toISOString(),
    },
    message: isHealthy ? 'Database connection is healthy' : 'Database connection failed',
  });
});

/**
 * Full health check
 * GET /api/v1/health
 */
const check = asyncHandler(async (req, res) => {
  let dbStatus = 'healthy';
  
  try {
    await database.query('SELECT 1');
  } catch (error) {
    dbStatus = 'unhealthy';
  }

  const health = {
    status: dbStatus === 'healthy' ? 'healthy' : 'degraded',
    uptime: process.uptime(),
    timestamp: new Date().toISOString(),
    services: {
      database: dbStatus,
    },
    memory: {
      used: Math.round(process.memoryUsage().heapUsed / 1024 / 1024) + ' MB',
      total: Math.round(process.memoryUsage().heapTotal / 1024 / 1024) + ' MB',
    },
  };

  const statusCode = health.status === 'healthy' ? 200 : 503;
  return res.status(statusCode).json({ success: true, data: health });
});

module.exports = {
  ping,
  db,
  check,
};
