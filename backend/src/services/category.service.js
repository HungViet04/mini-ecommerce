/**
 * Category Service
 * Handles category business logic
 * Based on database schema: categories(id, name) - only id and name columns
 */
const { categoryRepository } = require('../repositories');
const { ConflictError, ValidationError } = require('../errors');
const { sanitizeString, hasMaxLength } = require('../validators/common.validator');

class CategoryService {
  /**
   * Create a new category
   * @param {Object} data - Category data
   * @returns {Promise<Object>} Created category
   */
  async create(data) {
    const name = sanitizeString(data.name);

    if (!name) {
      throw new ValidationError('Vui lòng nhập tên danh mục');
    }

    // Validate name length (varchar 100)
    if (!hasMaxLength(name, 100)) {
      throw new ValidationError('Tên danh mục không được quá 100 ký tự');
    }

    // Check if name already exists
    const existing = await categoryRepository.findByName(name);
    if (existing) {
      throw new ConflictError('Tên danh mục này đã tồn tại');
    }

    return categoryRepository.create({ name });
  }

  /**
   * Get all categories
   * @returns {Promise<Array>} Categories
   */
  async findAll() {
    return categoryRepository.findAll();
  }

  /**
   * Get categories with pagination
   * @param {Object} options
   * @param {number} options.page
   * @param {number} options.limit
   * @param {string} options.orderBy
   * @param {string} options.order
   * @returns {Promise<Object>} { items, total }
   */
  async findAllPaginated({ page = 1, limit = 10, orderBy = 'name', order = 'ASC' } = {}) {
    const offset = (page - 1) * limit;
    return categoryRepository.findWithPagination({ limit, offset, orderBy, order });
  }

  /**
   * Get all categories with product count
   * @returns {Promise<Array>} Categories with product count
   */
  async findWithProductCount() {
    return categoryRepository.findWithProductCount();
  }

  /**
   * Get categories with product count and pagination
   * @param {Object} options
   * @param {number} options.page
   * @param {number} options.limit
   * @returns {Promise<Object>} { items, total }
   */
  async findWithProductCountPaginated({ page = 1, limit = 10 } = {}) {
    const offset = (page - 1) * limit;
    return categoryRepository.findWithProductCountPaginated({ limit, offset });
  }

  /**
   * Get category by ID
   * @param {number} id - Category ID
   * @returns {Promise<Object>} Category
   */
  async findById(id) {
    const category = await categoryRepository.findByIdOrFail(id, 'Category');
    return category;
  }

  /**
   * Update a category
   * @param {number} id - Category ID
   * @param {Object} data - Update data (only name can be updated)
   * @returns {Promise<Object>} Updated category
   */
  async update(id, data) {
    await categoryRepository.findByIdOrFail(id, 'Category');

    const updates = {};
    if (data.name !== undefined) {
      const name = sanitizeString(data.name);
      if (!name) {
        throw new ValidationError('Tên danh mục không được để trống');
      }
      if (!hasMaxLength(name, 100)) {
        throw new ValidationError('Tên danh mục không được quá 100 ký tự');
      }
      updates.name = name;
    }

    if (Object.keys(updates).length === 0) {
      throw new ValidationError('Không có trường nào hợp lệ để cập nhật');
    }

    return categoryRepository.update(id, updates);
  }

  /**
   * Delete a category
   * @param {number} id - Category ID
   * @returns {Promise<boolean>}
   */
  async delete(id) {
    await categoryRepository.findByIdOrFail(id, 'Category');
    return categoryRepository.delete(id);
  }
}

// Export singleton instance
module.exports = new CategoryService();
