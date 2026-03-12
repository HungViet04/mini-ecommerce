/**
 * Product Service
 * Handles product business logic
 * Based on database schema: products(id, name, price, stock, category_id, created_at)
 */
const { productRepository, categoryRepository } = require('../repositories');
const { NotFoundError } = require('../errors');
const {
  validateCreateProduct,
  validateUpdateProduct,
  validateProductId,
  validateSearchQuery,
} = require('../validators/product.validator');

class ProductService {
  /**
   * Create a new product
   * @param {Object} data - Product data
   * @returns {Promise<Object>} Created product
   */
  async create(data) {
    const validatedData = validateCreateProduct(data);

    // Verify category exists if provided
    if (validatedData.category_id) {
      const category = await categoryRepository.findById(validatedData.category_id);
      if (!category) {
        throw new NotFoundError('Category');
      }
    }

    const product = await productRepository.create({
      name: validatedData.name,
      description: validatedData.description,
      image_url: validatedData.image_url,
      price: validatedData.price,
      stock: validatedData.stock,
      category_id: validatedData.category_id,
    });

    return product;
  }

  /**
   * Get all products with pagination
   * @param {Object} options - Pagination options
   * @returns {Promise<Object>} { items, total, pagination }
   */
  async findAll(options = {}) {
    const { page = 1, limit = 20, orderBy = 'id', order = 'DESC' } = options;
    const result = await productRepository.findWithPagination({ page, limit, orderBy, order });
    return result;
  }

  /**
   * Get product by ID
   * @param {number|string} id - Product ID
   * @returns {Promise<Object>} Product
   */
  async findById(id) {
    const validatedId = validateProductId(id);
    const product = await productRepository.findByIdOrFail(validatedId, 'Product');
    return product;
  }

  /**
   * Search products by name
   * @param {string} query - Search query
   * @param {Object} options - Search options
   * @returns {Promise<Array>} Products
   */
  async search(query, options = {}) {
    const validatedQuery = validateSearchQuery(query);
    if (!validatedQuery) {
      return [];
    }
    return productRepository.searchByName(validatedQuery, options);
  }

  async searchAndFilter(filters = {}) {
    const { keyword, categoryId, minPrice, maxPrice, page = 1, limit = 20, orderBy = 'id', order = 'DESC' } = filters;

    if (categoryId) {
      const category = await categoryRepository.findById(categoryId);
      if (!category) {
        throw new NotFoundError('Category');
      }
    }

    const sanitizedKeyword = keyword ? validateSearchQuery(keyword) : undefined;

    return productRepository.searchAndFilter({
      keyword: sanitizedKeyword || undefined,
      categoryId: categoryId ? Number(categoryId) : undefined,
      minPrice: minPrice !== undefined && minPrice !== '' ? Number(minPrice) : undefined,
      maxPrice: maxPrice !== undefined && maxPrice !== '' ? Number(maxPrice) : undefined,
      page: Number(page),
      limit: Number(limit),
      orderBy,
      order,
    });
  }

  /**
   * Update a product
   * @param {number|string} id - Product ID
   * @param {Object} data - Update data
   * @returns {Promise<Object>} Updated product
   */
  async update(id, data) {
    const validatedId = validateProductId(id);
    const validatedData = validateUpdateProduct(data);

    // Verify product exists
    await productRepository.findByIdOrFail(validatedId, 'Product');

    // Verify category exists if provided
    if (validatedData.category_id) {
      const category = await categoryRepository.findById(validatedData.category_id);
      if (!category) {
        throw new NotFoundError('Category');
      }
    }

    return productRepository.update(validatedId, validatedData);
  }

  /**
   * Delete a product
   * @param {number|string} id - Product ID
   * @returns {Promise<boolean>}
   */
  async delete(id) {
    const validatedId = validateProductId(id);
    await productRepository.findByIdOrFail(validatedId, 'Product');
    return productRepository.delete(validatedId);
  }

  /**
   * Get products by category
   * @param {number} categoryId - Category ID
   * @param {Object} options - Query options
   * @returns {Promise<Array>} Products
   */
  async findByCategory(categoryId, options = {}) {
    const category = await categoryRepository.findById(categoryId);
    if (!category) {
      throw new NotFoundError('Category');
    }
    return productRepository.findByCategory(categoryId, options);
  }

  /**
   * Get products in stock
   * @param {Object} options - Query options
   * @returns {Promise<Array>} Products
   */
  async findInStock(options = {}) {
    return productRepository.findInStock(options);
  }

  /**
   * Check product availability
   * @param {number} productId - Product ID
   * @param {number} quantity - Required quantity
   * @returns {Promise<Object>} { available, stock }
   */
  async checkAvailability(productId, quantity) {
    const product = await productRepository.findByIdOrFail(productId, 'Product');
    return {
      available: product.stock >= quantity,
      stock: product.stock,
      product,
    };
  }
}

// Export singleton instance
module.exports = new ProductService();
