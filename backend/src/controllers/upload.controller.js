/**
 * Upload Controller
 * Handles image upload requests
 */
const path = require('path');
const fs = require('fs');
const { asyncHandler } = require('../helpers/async.helper');
const { response } = require('../helpers');
const { UPLOAD_DIR } = require('../middlewares/upload.middleware');

/**
 * Upload product image
 * POST /api/v1/upload/image
 */
const uploadImage = asyncHandler(async (req, res) => {
  if (!req.file) {
    return res.status(400).json({
      success: false,
      error: { message: 'Vui lòng chọn file ảnh để upload' },
    });
  }

  // Trả về đường dẫn ảnh
  const imageUrl = `/uploads/${req.file.filename}`;

  return response.success(res, {
    data: {
      filename: req.file.filename,
      url: imageUrl,
      originalName: req.file.originalname,
      size: req.file.size,
      mimetype: req.file.mimetype,
    },
    message: 'Upload ảnh thành công',
  });
});

/**
 * Delete product image
 * DELETE /api/v1/upload/image/:filename
 */
const deleteImage = asyncHandler(async (req, res) => {
  const { filename } = req.params;

  // Kiểm tra filename hợp lệ (tránh path traversal)
  if (!filename || filename.includes('..') || filename.includes('/') || filename.includes('\\')) {
    return res.status(400).json({
      success: false,
      error: { message: 'Tên file không hợp lệ' },
    });
  }

  const filePath = path.join(UPLOAD_DIR, filename);

  // Kiểm tra file tồn tại
  if (!fs.existsSync(filePath)) {
    return res.status(404).json({
      success: false,
      error: { message: 'Không tìm thấy file' },
    });
  }

  // Xóa file
  fs.unlinkSync(filePath);

  return response.success(res, {
    message: 'Xóa ảnh thành công',
  });
});

module.exports = {
  uploadImage,
  deleteImage,
};
