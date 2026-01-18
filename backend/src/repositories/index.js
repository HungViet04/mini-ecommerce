/**
 * Repositories Index
 * Export all repository modules
 */
const BaseRepository = require('./base.repository');
const userRepository = require('./user.repository');
const productRepository = require('./product.repository');
const orderRepository = require('./order.repository');
const categoryRepository = require('./category.repository');

module.exports = {
  BaseRepository,
  userRepository,
  productRepository,
  orderRepository,
  categoryRepository,
};
