/**
 * Services Index
 * Export all service modules
 */
const authService = require('./auth.service');
const productService = require('./product.service');
const orderService = require('./order.service');
const categoryService = require('./category.service');
const statsService = require('./stats.service');
const userService = require('./user.service');

module.exports = {
  authService,
  productService,
  orderService,
  categoryService,
  statsService,
  userService,
};
