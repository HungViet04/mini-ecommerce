/**
 * S3 Service
 * Handles file upload/delete operations with AWS S3
 */
const {
  S3Client,
  PutObjectCommand,
  DeleteObjectCommand,
  HeadObjectCommand,
} = require('@aws-sdk/client-s3');
const config = require('../config');
const logger = require('../utils/logger');

// S3 config with defaults
const s3Config = config.s3 || {
  region: 'ap-southeast-1',
  accessKeyId: '',
  secretAccessKey: '',
  bucket: '',
};

// Initialize S3 Client (only if credentials are provided)
let s3Client = null;
if (s3Config.accessKeyId && s3Config.secretAccessKey) {
  s3Client = new S3Client({
    region: s3Config.region,
    credentials: {
      accessKeyId: s3Config.accessKeyId,
      secretAccessKey: s3Config.secretAccessKey,
    },
  });
}

/**
 * Generate unique filename for S3
 * @param {string} originalName - Original filename
 * @returns {string} - Unique filename
 */
const generateS3Key = (originalName) => {
  const timestamp = Date.now();
  const random = Math.round(Math.random() * 1e9);
  const ext = originalName.split('.').pop();
  return `images/image-${timestamp}-${random}.${ext}`;
};

/**
 * Upload file to S3
 * @param {Object} file - Multer file object (buffer, mimetype, originalname)
 * @returns {Promise<Object>} - Upload result with url and key
 */
const uploadFile = async (file) => {
  if (!s3Client) {
    throw new Error('S3 chưa được cấu hình');
  }

  const key = generateS3Key(file.originalname);

  const command = new PutObjectCommand({
    Bucket: s3Config.bucket,
    Key: key,
    Body: file.buffer,
    ContentType: file.mimetype,
    // ACL: 'public-read', // Uncomment if bucket allows public ACL
  });

  try {
    await s3Client.send(command);

    // Build URL
    const url = `https://${s3Config.bucket}.s3.${s3Config.region}.amazonaws.com/${key}`;

    logger.info(`File uploaded to S3: ${key}`);

    return {
      key,
      url,
      filename: key.split('/').pop(),
      originalName: file.originalname,
      size: file.size,
      mimetype: file.mimetype,
    };
  } catch (error) {
    logger.error('S3 upload error:', error);
    throw new Error('Không thể upload file lên S3');
  }
};

/**
 * Delete file from S3
 * @param {string} key - S3 object key (e.g., products/product-xxx.jpg)
 * @returns {Promise<boolean>}
 */
const deleteFile = async (key) => {
  if (!s3Client) {
    throw new Error('S3 chưa được cấu hình');
  }

  const command = new DeleteObjectCommand({
    Bucket: s3Config.bucket,
    Key: key,
  });

  try {
    await s3Client.send(command);
    logger.info(`File deleted from S3: ${key}`);
    return true;
  } catch (error) {
    logger.error('S3 delete error:', error);
    throw new Error('Không thể xóa file trên S3');
  }
};

/**
 * Check if file exists in S3
 * @param {string} key - S3 object key
 * @returns {Promise<boolean>}
 */
const fileExists = async (key) => {
  if (!s3Client) {
    throw new Error('S3 chưa được cấu hình');
  }

  const command = new HeadObjectCommand({
    Bucket: s3Config.bucket,
    Key: key,
  });

  try {
    await s3Client.send(command);
    return true;
  } catch (error) {
    if (error.name === 'NotFound' || error.$metadata?.httpStatusCode === 404) {
      return false;
    }
    throw error;
  }
};

/**
 * Extract S3 key from URL
 * @param {string} url - Full S3 URL
 * @returns {string|null} - S3 key or null
 */
const getKeyFromUrl = (url) => {
  if (!url) return null;

  // Handle standard S3 URL format
  const s3Regex = /https?:\/\/[^/]+\/(.+)/;
  const match = url.match(s3Regex);
  return match ? match[1] : null;
};

module.exports = {
  s3Client,
  uploadFile,
  deleteFile,
  fileExists,
  getKeyFromUrl,
  generateS3Key,
};
