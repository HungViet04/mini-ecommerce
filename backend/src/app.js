/**
 * Express Application Configuration
 * Sets up middleware, routes, and error handling
 */
const express = require('express');
const cors = require('cors');
const path = require('path');
const config = require('./config');
const routes = require('./routes');
const { errorHandler, notFoundHandler, requestLogger, requestId } = require('./middlewares');

// Create Express app
const app = express();

// Trust proxy for correct IP detection behind reverse proxy
app.set('trust proxy', 1);

// Request ID middleware
app.use(requestId);

// Request logging (development)
if (config.env === 'development') {
  app.use(requestLogger);
}

// CORS configuration
app.use(
  cors({
    origin: config.cors.origin,
    credentials: config.cors.credentials,
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'X-Request-ID'],
  })
);

// Body parsing middleware
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Serve uploaded images as static files
const uploadPath = path.resolve(__dirname, '../../data/image');
app.use('/uploads', express.static(uploadPath));

// API Routes with versioning
app.use('/api/v1', routes);

// Legacy routes (backwards compatibility)
app.use('/api', routes);

// 404 handler
app.use(notFoundHandler);

// Global error handler (must be last)
app.use(errorHandler);

module.exports = app;
