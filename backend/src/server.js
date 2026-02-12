/**
 * Server Entry Point
 * Initializes database and starts HTTP server
 */
require('dotenv').config();

const app = require('./app');
const config = require('./config');
const database = require('./config/database');
const logger = require('./utils/logger');

/**
 * Graceful shutdown handler
 * @param {string} signal - Signal received
 */
const gracefulShutdown = async (signal) => {
  logger.info(`${signal} received. Starting graceful shutdown...`);

  try {
    await database.close();
    logger.info('Database connections closed');
    process.exit(0);
  } catch (error) {
    logger.error('Error during shutdown', error);
    process.exit(1);
  }
};

/**
 * Start server
 */
const startServer = async () => {
  try {
    // Initialize database connection
    await database.initialize();

    // Start HTTP server
    const server = app.listen(config.port, () => {
      logger.info(`Server started`, {
        env: config.env,
        port: config.port,
        url: `http://localhost:${config.port}/api/v1`,
      });
    });

    // Handle server errors
    server.on('error', (error) => {
      if (error.code === 'EADDRINUSE') {
        logger.error(`Port ${config.port} is already in use`);
      } else {
        logger.error('Server error', error);
      }
      process.exit(1);
    });

    // Graceful shutdown handlers
    process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
    process.on('SIGINT', () => gracefulShutdown('SIGINT'));

    // Handle uncaught exceptions
    process.on('uncaughtException', (error) => {
      logger.error('Uncaught Exception', error);
      gracefulShutdown('uncaughtException');
    });

    // Handle unhandled promise rejections
    process.on('unhandledRejection', (reason) => {
      logger.error('Unhandled Rejection', { reason: String(reason) });
      gracefulShutdown('unhandledRejection');
    });
  } catch (error) {
    logger.error('Failed to start server', error);
    process.exit(1);
  }
};

// Start the server
startServer();
