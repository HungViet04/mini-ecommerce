/**
 * Upload Controller Unit Tests
 */

jest.mock('../../../src/services/s3.service', () => ({
  uploadFile: jest.fn(),
  deleteFile: jest.fn(),
  fileExists: jest.fn(),
}));

jest.mock('../../../src/helpers', () => ({
  response: {
    success: jest.fn((res, payload) => res.status(200).json({ success: true, ...payload })),
  },
}));

const s3Service = require('../../../src/services/s3.service');
const { response } = require('../../../src/helpers');
const uploadController = require('../../../src/controllers/upload.controller');

describe('Upload Controller', () => {
  let req;
  let res;
  let next;

  beforeEach(() => {
    jest.clearAllMocks();

    req = {
      file: null,
      params: {},
      query: {},
    };

    res = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn().mockReturnThis(),
    };

    next = jest.fn();
  });

  describe('uploadImage', () => {
    it('should return 400 when no file provided', async () => {
      await uploadController.uploadImage(req, res, next);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          success: false,
          error: expect.any(Object),
        })
      );
    });

    it('should upload file and return success payload', async () => {
      const uploadResult = {
        filename: 'image-1.jpg',
        url: 'https://bucket.s3.amazonaws.com/images/image-1.jpg',
        key: 'images/image-1.jpg',
        originalName: 'image-1.jpg',
        size: 1234,
        mimetype: 'image/jpeg',
      };

      req.file = {
        originalname: 'image-1.jpg',
        mimetype: 'image/jpeg',
        size: 1234,
        buffer: Buffer.from('test'),
      };

      s3Service.uploadFile.mockResolvedValue(uploadResult);

      await uploadController.uploadImage(req, res, next);

      expect(s3Service.uploadFile).toHaveBeenCalledWith(req.file);
      expect(response.success).toHaveBeenCalledWith(res, {
        data: uploadResult,
        message: 'Upload ảnh thành công',
      });
    });
  });

  describe('deleteImage', () => {
    it('should return 400 when key is missing', async () => {
      await uploadController.deleteImage(req, res, next);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          success: false,
          error: expect.any(Object),
        })
      );
    });

    it('should return 404 when file does not exist', async () => {
      req.params = { key: 'image-1.jpg' };
      s3Service.fileExists.mockResolvedValue(false);

      await uploadController.deleteImage(req, res, next);

      expect(s3Service.fileExists).toHaveBeenCalledWith('images/image-1.jpg');
      expect(res.status).toHaveBeenCalledWith(404);
    });

    it('should delete file and return success', async () => {
      req.params = { key: 'image-1.jpg' };
      s3Service.fileExists.mockResolvedValue(true);
      s3Service.deleteFile.mockResolvedValue(true);

      await uploadController.deleteImage(req, res, next);
      await Promise.resolve();

      expect(s3Service.fileExists).toHaveBeenCalledWith('images/image-1.jpg');
      expect(s3Service.deleteFile).toHaveBeenCalledWith('images/image-1.jpg');
      expect(response.success).toHaveBeenCalledWith(res, {
        message: 'Xóa ảnh thành công',
      });
    });

    it('should accept query key with path', async () => {
      req.query = { key: 'images/image-2.jpg' };
      s3Service.fileExists.mockResolvedValue(true);
      s3Service.deleteFile.mockResolvedValue(true);

      await uploadController.deleteImage(req, res, next);

      expect(s3Service.fileExists).toHaveBeenCalledWith('images/image-2.jpg');
      expect(s3Service.deleteFile).toHaveBeenCalledWith('images/image-2.jpg');
    });
  });
});
