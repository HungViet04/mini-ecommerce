/**
 * Express Application Configuration
 * Sets up middleware, routes, and error handling
 */
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const path = require('path');
const config = require('./config');
const routes = require('./routes');
const { errorHandler, notFoundHandler, requestLogger, requestId } = require('./middlewares');

// Create Express app
const app = express();
const isProduction = config.env === 'production';

// Trust proxy for correct IP detection behind reverse proxy
app.set('trust proxy', 1);

// Remove X-Powered-By header
app.disable('x-powered-by');

// Security headers
app.use(
  helmet({
    contentSecurityPolicy: {
      useDefaults: false,
      directives: {
        'default-src': ["'none'"],
        'base-uri': ["'none'"],
        'frame-ancestors': ["'none'"],
        'form-action': ["'none'"],
      },
    },
    frameguard: { action: 'deny' },
    referrerPolicy: { policy: 'no-referrer' },
    hsts: isProduction
      ? {
          maxAge: 31536000,
          includeSubDomains: true,
          preload: true,
        }
      : false,
  })
);

// Best-effort removal of Server header
app.use((req, res, next) => {
  res.removeHeader('Server');
  res.setHeader('Server', '');
  next();
});

// Disable caching for API responses
app.use((req, res, next) => {
  if (req.path.startsWith('/api')) {
    res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate');
    res.setHeader('Pragma', 'no-cache');
    res.setHeader('Expires', '0');
  }
  next();
});

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
app.use(
  '/uploads',
  express.static(uploadPath, {
    setHeaders: (res) => {
      res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate');
      res.setHeader('Pragma', 'no-cache');
      res.setHeader('Expires', '0');
    },
  })
);

// API Routes with versioning
app.use('/api/v1', routes);

// Legacy routes (backwards compatibility)
app.use('/api', routes);

// 404 handler
app.use(notFoundHandler);

// Global error handler (must be last)
app.use(errorHandler);

module.exports = app;
