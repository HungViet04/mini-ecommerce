/**
 * Async Helper Tests
 * Tests for async wrapper utilities
 */

const { asyncHandler } = require('../../../src/helpers/async.helper');

// Alias for backward compatibility in tests
const catchAsync = asyncHandler;

describe('Async Helper', () => {
  describe('catchAsync', () => {
    let mockReq, mockRes, mockNext;

    beforeEach(() => {
      mockReq = {};
      mockRes = {
        status: jest.fn().mockReturnThis(),
        json: jest.fn(),
      };
      mockNext = jest.fn();
    });

    it('should execute async function successfully', async () => {
      const asyncFn = jest.fn().mockResolvedValue('success');
      const wrapped = catchAsync(asyncFn);

      await wrapped(mockReq, mockRes, mockNext);

      expect(asyncFn).toHaveBeenCalledWith(mockReq, mockRes, mockNext);
      expect(mockNext).not.toHaveBeenCalledWith(expect.any(Error));
    });

    it('should catch and forward errors to next', async () => {
      const error = new Error('Async error');
      const asyncFn = jest.fn().mockRejectedValue(error);
      const wrapped = catchAsync(asyncFn);

      await wrapped(mockReq, mockRes, mockNext);

      expect(mockNext).toHaveBeenCalledWith(error);
    });

    it('should handle thrown errors', async () => {
      const asyncFn = jest.fn().mockImplementation(async () => {
        throw new Error('Thrown error');
      });
      const wrapped = catchAsync(asyncFn);

      await wrapped(mockReq, mockRes, mockNext);

      expect(mockNext).toHaveBeenCalledWith(expect.any(Error));
    });

    it('should preserve function execution', async () => {
      const service = { getData: jest.fn().mockResolvedValue([]) };
      const getData = catchAsync(async function (req, res) {
        const data = await service.getData();
        res.json(data);
      });

      await getData(mockReq, mockRes, mockNext);

      expect(service.getData).toHaveBeenCalled();
    });
  });
});
