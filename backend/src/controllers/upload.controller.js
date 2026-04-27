/**
 * Upload Controller
 * Handles image upload requests to S3
 */
const { asyncHandler } = require('../helpers/async.helper');
const { response } = require('../helpers');
const s3Service = require('../services/s3.service');

/**
 * Upload product image to S3
 * POST /api/v1/upload/image
 */
const uploadImage = asyncHandler(async (req, res) => {
  if (!req.file) {
    return res.status(400).json({
      success: false,
      error: { message: 'Vui lòng chọn file ảnh để upload' },
    });
  }

  // Upload to S3
  const result = await s3Service.uploadFile(req.file);

  return response.success(res, {
    data: {
      filename: result.filename,
      url: result.url,
      key: result.key,
      originalName: result.originalName,
      size: result.size,
      mimetype: result.mimetype,
    },
    message: 'Upload ảnh thành công',
  });
});

/**
 * Delete product image from S3
 * DELETE /api/v1/upload/image/:key
 * Note: key can be passed as query param if contains slashes
 */
const deleteImage = asyncHandler(async (req, res) => {
  // Support both URL param and query param for S3 key
  let key = req.params.key || req.params.filename || req.query.key;

  // If key from URL, it might be just filename - prepend folder
  if (key && !key.includes('/')) {
    key = `images/${key}`;
  }

  if (!key) {
    return res.status(400).json({
      success: false,
      error: { message: 'Vui lòng cung cấp key của file cần xóa' },
    });
  }

  // Check if file exists
  const exists = await s3Service.fileExists(key);
  if (!exists) {
    return res.status(404).json({
      success: false,
      error: { message: 'Không tìm thấy file' },
    });
  }

  // Delete from S3
  await s3Service.deleteFile(key);

  return response.success(res, {
    message: 'Xóa ảnh thành công',
  });
});

module.exports = {
  uploadImage,
  deleteImage,
};
