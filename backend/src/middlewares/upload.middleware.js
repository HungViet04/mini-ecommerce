/**
 * Upload Middleware
 * Handles file uploads using multer
 */
const multer = require('multer');
const path = require('path');
const fs = require('fs');

// Đường dẫn lưu ảnh
const UPLOAD_DIR = path.resolve(__dirname, '../../../data/image');

// Đảm bảo thư mục tồn tại
if (!fs.existsSync(UPLOAD_DIR)) {
  fs.mkdirSync(UPLOAD_DIR, { recursive: true });
}

// Cấu hình storage cho multer
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, UPLOAD_DIR);
  },
  filename: (req, file, cb) => {
    // Tạo tên file unique: timestamp + random + extension
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
    const ext = path.extname(file.originalname);
    cb(null, `product-${uniqueSuffix}${ext}`);
  },
});

// Filter chỉ cho phép upload ảnh
const fileFilter = (req, file, cb) => {
  const allowedMimes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp'];

  if (allowedMimes.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new Error('Chỉ cho phép upload file ảnh (jpeg, jpg, png, gif, webp)'), false);
  }
};

// Khởi tạo multer với cấu hình
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
  uploadProductImage(req, res, err => {
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
  UPLOAD_DIR,
};
