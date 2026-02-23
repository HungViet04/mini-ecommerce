/**
 * Repository Mocks
 * Mocks for all repository functions
 */

const userRepository = {
  findById: jest.fn(),
  findByIdOrFail: jest.fn(),
  findByEmail: jest.fn(),
  findByIdentifier: jest.fn(),
  createUser: jest.fn(),
  update: jest.fn(),
  delete: jest.fn(),
  findAll: jest.fn(),
};

const productRepository = {
  findById: jest.fn(),
  findByIdOrFail: jest.fn(),
  findAll: jest.fn(),
  findWithPagination: jest.fn(),
  findByCategory: jest.fn(),
  findInStock: jest.fn(),
  findByIdsForUpdate: jest.fn(),
  create: jest.fn(),
  update: jest.fn(),
  delete: jest.fn(),
  searchByName: jest.fn(),
  decrementStock: jest.fn(),
  incrementStock: jest.fn(),
};

const categoryRepository = {
  findById: jest.fn(),
  findByIdOrFail: jest.fn(),
  findAll: jest.fn(),
  findByName: jest.fn(),
  findWithProductCount: jest.fn(),
  create: jest.fn(),
  update: jest.fn(),
  delete: jest.fn(),
};

const orderRepository = {
  findById: jest.fn(),
  findByIdOrFail: jest.fn(),
  findAll: jest.fn(),
  findByUserId: jest.fn(),
  getOrderWithItems: jest.fn(),
  getOrdersWithItemsByUser: jest.fn(),
  createOrder: jest.fn(),
  createOrderItem: jest.fn(),
  updateStatus: jest.fn(),
  delete: jest.fn(),
};

const resetAllMocks = () => {
  Object.values(userRepository).forEach(mock => mock.mockReset());
  Object.values(productRepository).forEach(mock => mock.mockReset());
  Object.values(categoryRepository).forEach(mock => mock.mockReset());
  Object.values(orderRepository).forEach(mock => mock.mockReset());
};

module.exports = {
  userRepository,
  productRepository,
  categoryRepository,
  orderRepository,
  resetAllMocks,
};

