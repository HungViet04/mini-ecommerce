/**
 * Repositories Index
 * Export all repository modules
 */
const BaseRepository = require('./base.repository');
const userRepository = require('./user.repository');
const productRepository = require('./product.repository');
const orderRepository = require('./order.repository');
const categoryRepository = require('./category.repository');
const addressRepository = require('./address.repository');

module.exports = {
  BaseRepository,
  userRepository,
  productRepository,
  orderRepository,
  categoryRepository,
  addressRepository,
};
