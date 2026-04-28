/**
 * Response Helper Tests
 * Comprehensive tests for API response utilities
 */

const { HTTP_STATUS } = require('../../../src/constants');

// Create mock response object factory
const createMockResponse = () => {
  const res = {
    status: jest.fn().mockReturnThis(),
    json: jest.fn().mockReturnThis(),
    send: jest.fn().mockReturnThis(),
  };
  return res;
};

const {
  success,
  error,
  created,
  noContent,
  paginated,
} = require('../../../src/helpers/response.helper');

describe('Response Helper', () => {
  let mockRes;

  beforeEach(() => {
    mockRes = createMockResponse();
  });

  describe('success', () => {
    it('should send success response with default values', () => {
      success(mockRes, {});

      expect(mockRes.status).toHaveBeenCalledWith(HTTP_STATUS.OK);
      expect(mockRes.json).toHaveBeenCalledWith({
        success: true,
        message: 'Thành công',
        data: null,
      });
    });

    it('should send success response with data', () => {
      const data = { id: 1, name: 'Test' };
      success(mockRes, { data });

      expect(mockRes.json).toHaveBeenCalledWith({
        success: true,
        message: 'Thành công',
        data,
      });
    });

    it('should send success response with custom message', () => {
      success(mockRes, { message: 'Đăng nhập thành công' });

      expect(mockRes.json).toHaveBeenCalledWith({
        success: true,
        message: 'Đăng nhập thành công',
        data: null,
      });
    });

    it('should send success response with custom status code', () => {
      success(mockRes, { statusCode: HTTP_STATUS.CREATED });

      expect(mockRes.status).toHaveBeenCalledWith(HTTP_STATUS.CREATED);
    });

    it('should include meta when provided', () => {
      const meta = { page: 1, limit: 10, total: 100 };
      success(mockRes, { data: [], meta });

      expect(mockRes.json).toHaveBeenCalledWith({
        success: true,
        message: 'Thành công',
        data: [],
        meta,
      });
    });

    it('should not include meta when not provided', () => {
      success(mockRes, { data: [] });

      const response = mockRes.json.mock.calls[0][0];
      expect(response).not.toHaveProperty('meta');
    });

    it('should handle null data', () => {
      success(mockRes, { data: null });

      expect(mockRes.json).toHaveBeenCalledWith({
        success: true,
        message: 'Thành công',
        data: null,
      });
    });

    it('should handle array data', () => {
      const data = [{ id: 1 }, { id: 2 }];
      success(mockRes, { data });

      expect(mockRes.json).toHaveBeenCalledWith({
        success: true,
        message: 'Thành công',
        data,
      });
    });

    it('should handle empty options', () => {
      success(mockRes);

      expect(mockRes.status).toHaveBeenCalledWith(HTTP_STATUS.OK);
      expect(mockRes.json).toHaveBeenCalledWith({
        success: true,
        message: 'Thành công',
        data: null,
      });
    });
  });

  describe('error', () => {
    it('should send error response with default values', () => {
      error(mockRes, {});

      expect(mockRes.status).toHaveBeenCalledWith(HTTP_STATUS.INTERNAL_SERVER_ERROR);
      expect(mockRes.json).toHaveBeenCalledWith({
        success: false,
        error: {
          code: 'SERVER_ERROR',
          message: 'Đã xảy ra lỗi',
        },
      });
    });

    it('should send error response with custom code and message', () => {
      error(mockRes, {
        code: 'VALIDATION_ERROR',
        message: 'Dữ liệu không hợp lệ',
        statusCode: HTTP_STATUS.BAD_REQUEST,
      });

      expect(mockRes.status).toHaveBeenCalledWith(HTTP_STATUS.BAD_REQUEST);
      expect(mockRes.json).toHaveBeenCalledWith({
        success: false,
        error: {
          code: 'VALIDATION_ERROR',
          message: 'Dữ liệu không hợp lệ',
        },
      });
    });

    it('should include details when provided', () => {
      const details = { field: 'email', reason: 'invalid format' };
      error(mockRes, {
        code: 'VALIDATION_ERROR',
        message: 'Validation failed',
        details,
      });

      expect(mockRes.json).toHaveBeenCalledWith({
        success: false,
        error: {
          code: 'VALIDATION_ERROR',
          message: 'Validation failed',
          details,
        },
      });
    });

    it('should not include details when not provided', () => {
      error(mockRes, { code: 'NOT_FOUND' });

      const response = mockRes.json.mock.calls[0][0];
      expect(response.error).not.toHaveProperty('details');
    });

    it('should handle array details', () => {
      const details = [
        { field: 'email', error: 'required' },
        { field: 'password', error: 'too short' },
      ];
      error(mockRes, { details });

      expect(mockRes.json.mock.calls[0][0].error.details).toEqual(details);
    });
  });

  describe('created', () => {
    it('should send 201 response with data', () => {
      const data = { id: 1, name: 'New Item' };
      created(mockRes, data);

      expect(mockRes.status).toHaveBeenCalledWith(HTTP_STATUS.CREATED);
      expect(mockRes.json).toHaveBeenCalledWith({
        success: true,
        message: 'Tạo mới thành công',
        data,
      });
    });

    it('should send 201 response with custom message', () => {
      const data = { id: 1 };
      created(mockRes, data, 'Đăng ký thành công');

      expect(mockRes.json).toHaveBeenCalledWith({
        success: true,
        message: 'Đăng ký thành công',
        data,
      });
    });

    it('should handle null data', () => {
      created(mockRes, null);

      expect(mockRes.json).toHaveBeenCalledWith({
        success: true,
        message: 'Tạo mới thành công',
        data: null,
      });
    });
  });

  describe('noContent', () => {
    it('should send 204 response with no body', () => {
      noContent(mockRes);

      expect(mockRes.status).toHaveBeenCalledWith(HTTP_STATUS.NO_CONTENT);
      expect(mockRes.send).toHaveBeenCalled();
    });

    it('should not call json', () => {
      noContent(mockRes);

      expect(mockRes.json).not.toHaveBeenCalled();
    });
  });

  describe('paginated', () => {
    it('should send paginated response with metadata', () => {
      const options = {
        data: [{ id: 1 }, { id: 2 }],
        page: 1,
        limit: 10,
        total: 25,
      };
      paginated(mockRes, options);

      expect(mockRes.status).toHaveBeenCalledWith(HTTP_STATUS.OK);
      expect(mockRes.json).toHaveBeenCalledWith(
        expect.objectContaining({
          success: true,
          data: options.data,
          meta: {
            pagination: expect.objectContaining({
              page: 1,
              limit: 10,
              total: 25,
              totalPages: 3,
              hasNextPage: true,
              hasPrevPage: false,
            }),
          },
        })
      );
    });

    it('should calculate totalPages correctly', () => {
      paginated(mockRes, { data: [], page: 1, limit: 10, total: 25 });

      const response = mockRes.json.mock.calls[0][0];
      expect(response.meta.pagination.totalPages).toBe(3);
    });

    it('should set hasNextPage correctly', () => {
      paginated(mockRes, { data: [], page: 3, limit: 10, total: 25 });

      const response = mockRes.json.mock.calls[0][0];
      expect(response.meta.pagination.hasNextPage).toBe(false);
    });

    it('should set hasPrevPage correctly', () => {
      paginated(mockRes, { data: [], page: 2, limit: 10, total: 25 });

      const response = mockRes.json.mock.calls[0][0];
      expect(response.meta.pagination.hasPrevPage).toBe(true);
    });

    it('should handle empty data', () => {
      paginated(mockRes, { data: [], page: 1, limit: 10, total: 0 });

      const response = mockRes.json.mock.calls[0][0];
      expect(response.data).toEqual([]);
      expect(response.meta.pagination.total).toBe(0);
      expect(response.meta.pagination.totalPages).toBe(0);
    });

    it('should include custom message', () => {
      paginated(mockRes, {
        data: [],
        page: 1,
        limit: 10,
        total: 0,
        message: 'Danh sách sản phẩm',
      });

      const response = mockRes.json.mock.calls[0][0];
      expect(response.message).toBe('Danh sách sản phẩm');
    });
  });
});
