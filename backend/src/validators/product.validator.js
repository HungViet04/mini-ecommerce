/**
 * Product Validators
 * Validation functions for product-related operations
 * Vietnamese error messages
 */
const { ValidationError } = require('../errors');
const {
  sanitizeString,
  isNonNegativeNumber,
  isNonNegativeInteger,
  isPositiveInteger,
  hasMaxLength,
} = require('./common.validator');

/**
 * Validate product creation data
 * @param {Object} data - Product data
 * @returns {Object} Validated data
 * @throws {ValidationError}
 */
const validateCreateProduct = (data) => {
  const errors = [];

  const name = sanitizeString(data.name);
  const description = sanitizeString(data.description || '');
  const imageUrl = sanitizeString(data.image_url || data.imageUrl || '');
  const price = data.price;
  const stock = data.stock ?? 0;
  const categoryId = data.category_id || data.categoryId;

  // Validate name (varchar 255)
  if (!name) {
    errors.push({ field: 'name', message: 'Vui lòng nhập tên sản phẩm' });
  } else if (!hasMaxLength(name, 255)) {
    errors.push({ field: 'name', message: 'Tên sản phẩm không được vượt quá 255 ký tự' });
  }

  // Validate description (text - optional)
  // No max length validation for TEXT type

  // Validate image_url (varchar 1024 - optional)
  if (imageUrl && !hasMaxLength(imageUrl, 1024)) {
    errors.push({ field: 'image_url', message: 'URL hình ảnh không được vượt quá 1024 ký tự' });
  }

  // Validate price (decimal 10,2)
  if (price === undefined || price === null) {
    errors.push({ field: 'price', message: 'Vui lòng nhập giá sản phẩm' });
  } else if (!isNonNegativeNumber(price)) {
    errors.push({ field: 'price', message: 'Giá sản phẩm phải là số không âm' });
  }

  // Validate stock (int)
  if (!isNonNegativeInteger(stock)) {
    errors.push({ field: 'stock', message: 'Số lượng tồn kho phải là số nguyên không âm' });
  }

  // Validate category_id (foreign key to categories)
  if (categoryId !== undefined && categoryId !== null && !isPositiveInteger(categoryId)) {
    errors.push({ field: 'category_id', message: 'ID danh mục phải là số nguyên dương' });
  }

  if (errors.length > 0) {
    throw new ValidationError('Dữ liệu không hợp lệ', errors);
  }

  return {
    name,
    description: description || null,
    image_url: imageUrl || null,
    price: Number(price),
    stock: Number(stock),
    category_id: categoryId ? Number(categoryId) : null,
  };
};

/**
 * Validate product update data
 * @param {Object} data - Product update data
 * @returns {Object} Validated data
 * @throws {ValidationError}
 */
const validateUpdateProduct = (data) => {
  const errors = [];
  const updates = {};

  // Validate name if provided (varchar 255)
  if (data.name !== undefined) {
    const name = sanitizeString(data.name);
    if (!name) {
      errors.push({ field: 'name', message: 'Tên sản phẩm không được để trống' });
    } else if (!hasMaxLength(name, 255)) {
      errors.push({ field: 'name', message: 'Tên sản phẩm không được vượt quá 255 ký tự' });
    } else {
      updates.name = name;
    }
  }

  // Validate price if provided (decimal 10,2)
  if (data.price !== undefined) {
    if (!isNonNegativeNumber(data.price)) {
      errors.push({ field: 'price', message: 'Giá sản phẩm phải là số không âm' });
    } else {
      updates.price = Number(data.price);
    }
  }

  // Validate stock if provided (int)
  if (data.stock !== undefined) {
    if (!isNonNegativeInteger(data.stock)) {
      errors.push({ field: 'stock', message: 'Số lượng tồn kho phải là số nguyên không âm' });
    } else {
      updates.stock = Number(data.stock);
    }
  }

  // Validate description if provided (text)
  if (data.description !== undefined) {
    updates.description = sanitizeString(data.description || '') || null;
  }

  // Validate image_url if provided (varchar 1024)
  const imageUrl = data.image_url || data.imageUrl;
  if (imageUrl !== undefined) {
    const sanitizedUrl = sanitizeString(imageUrl || '');
    if (sanitizedUrl && !hasMaxLength(sanitizedUrl, 1024)) {
      errors.push({ field: 'image_url', message: 'URL hình ảnh không được vượt quá 1024 ký tự' });
    } else {
      updates.image_url = sanitizedUrl || null;
    }
  }

  // Validate category_id if provided (foreign key)
  const categoryId = data.category_id || data.categoryId;
  if (categoryId !== undefined) {
    if (categoryId === null) {
      updates.category_id = null;
    } else if (!isPositiveInteger(categoryId)) {
      errors.push({ field: 'category_id', message: 'ID danh mục phải là số nguyên dương' });
    } else {
      updates.category_id = Number(categoryId);
    }
  }

  if (errors.length > 0) {
    throw new ValidationError('Dữ liệu không hợp lệ', errors);
  }

  if (Object.keys(updates).length === 0) {
    throw new ValidationError('Không có dữ liệu hợp lệ để cập nhật');
  }

  return updates;
};

/**
 * Validate product ID parameter
 * @param {any} id - Product ID
 * @returns {number} Validated ID
 * @throws {ValidationError}
 */
const validateProductId = (id) => {
  if (!isPositiveInteger(id)) {
    throw new ValidationError('ID sản phẩm không hợp lệ');
  }
  return Number(id);
};

/**
 * Validate search query
 * @param {string} query - Search query
 * @returns {string} Validated query
 */
const validateSearchQuery = (query) => {
  return sanitizeString(query || '');
};

module.exports = {
  validateCreateProduct,
  validateUpdateProduct,
  validateProductId,
  validateSearchQuery,
};
