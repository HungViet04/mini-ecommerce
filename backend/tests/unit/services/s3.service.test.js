/**
 * S3 Service Unit Tests (utilities)
 */

const s3Service = require('../../../src/services/s3.service');

describe('S3 Service', () => {
  describe('generateS3Key', () => {
    it('should generate a deterministic key prefix', () => {
      const nowSpy = jest.spyOn(Date, 'now').mockReturnValue(1234567890);
      const randSpy = jest.spyOn(Math, 'random').mockReturnValue(0.123456789);

      const key = s3Service.generateS3Key('photo.jpg');

      expect(key).toContain('images/image-1234567890-');
      expect(key).toMatch(/\.jpg$/);

      nowSpy.mockRestore();
      randSpy.mockRestore();
    });
  });

  describe('getKeyFromUrl', () => {
    it('should extract key from url', () => {
      const url = 'https://bucket.s3.ap-southeast-1.amazonaws.com/images/photo.jpg';
      const key = s3Service.getKeyFromUrl(url);
      expect(key).toBe('images/photo.jpg');
    });

    it('should return null for empty url', () => {
      expect(s3Service.getKeyFromUrl('')).toBeNull();
      expect(s3Service.getKeyFromUrl(null)).toBeNull();
    });
  });
});
