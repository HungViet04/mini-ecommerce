/**
 * Controllers Index
 * Export all controller modules
 */
const authController = require('./auth.controller');
const productController = require('./product.controller');
const orderController = require('./order.controller');
const categoryController = require('./category.controller');
const healthController = require('./health.controller');
const statsController = require('./stats.controller');
const userController = require('./user.controller');
const uploadController = require('./upload.controller');
const chatbotController = require('./chatbot.controller');
const addressController = require('./address.controller');

module.exports = {
  authController,
  productController,
  orderController,
  categoryController,
  healthController,
  statsController,
  userController,
  uploadController,
  chatbotController,
  addressController,
};
