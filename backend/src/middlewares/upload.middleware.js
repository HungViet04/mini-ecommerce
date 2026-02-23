/**
 * Upload Middleware
 * Handles file uploads using multer with memory storage for S3
 */
const multer = require('multer');

// Use memory storage (buffer) for S3 upload
const storage = multer.memoryStorage();

// Filter chỉ cho phép upload ảnh
const fileFilter = (req, file, cb) => {
  const allowedMimes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp'];

  if (allowedMimes.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new Error('Chỉ cho phép upload file ảnh (jpeg, jpg, png, gif, webp)'), false);
  }
};

// Khởi tạo multer với cấu hình memory storage
const upload = multer({
  storage,
  fileFilter,
  limits: {
    fileSize: 5 * 1024 * 1024, // 5MB max
  },
});

// Middleware upload single image
const uploadProductImage = upload.single('image');

// Wrapper để xử lý lỗi multer
const handleUpload = (req, res, next) => {
  uploadProductImage(req, res, (err) => {
    if (err instanceof multer.MulterError) {
      if (err.code === 'LIMIT_FILE_SIZE') {
        return res.status(400).json({
          success: false,
          error: { message: 'Kích thước file không được vượt quá 5MB' },
        });
      }
      return res.status(400).json({
        success: false,
        error: { message: err.message },
      });
    } else if (err) {
      return res.status(400).json({
        success: false,
        error: { message: err.message },
      });
    }
    next();
  });
};

module.exports = {
  upload,
  uploadProductImage,
  handleUpload,
};
