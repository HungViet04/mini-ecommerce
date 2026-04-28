/**
 * Validators Index
 * Export all validator modules
 */
const commonValidator = require('./common.validator');
const authValidator = require('./auth.validator');
const productValidator = require('./product.validator');
const orderValidator = require('./order.validator');
const addressValidator = require('./address.validator');

module.exports = {
  ...commonValidator,
  auth: authValidator,
  product: productValidator,
  order: orderValidator,
  address: addressValidator,
};
