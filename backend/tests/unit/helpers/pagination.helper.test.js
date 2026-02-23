/**
 * Pagination Helper Tests
 * Comprehensive tests for pagination utilities
 */

jest.mock('../../../src/config', () => ({
  pagination: {
    defaultPage: 1,
    defaultLimit: 20,
    maxLimit: 100,
  },
}));

const { parsePagination, buildPaginationMeta } = require('../../../src/helpers/pagination.helper');

describe('Pagination Helper', () => {
  describe('parsePagination', () => {
    it('should return default values when query is empty', () => {
      const result = parsePagination({});

      expect(result.page).toBe(1);
      expect(result.limit).toBe(20);
      expect(result.offset).toBe(0);
    });

    it('should parse valid page and limit', () => {
      const result = parsePagination({ page: '3', limit: '10' });

      expect(result.page).toBe(3);
      expect(result.limit).toBe(10);
      expect(result.offset).toBe(20);
    });

    it('should handle string numbers', () => {
      const result = parsePagination({ page: '5', limit: '25' });

      expect(result.page).toBe(5);
      expect(result.limit).toBe(25);
    });

    it('should enforce minimum page of 1', () => {
      const result = parsePagination({ page: '0' });
      expect(result.page).toBe(1);

      const result2 = parsePagination({ page: '-5' });
      expect(result2.page).toBe(1);
    });

    it('should enforce minimum limit of 1', () => {
      // When limit=0, parseInt returns 0 which is falsy, so defaultLimit (20) is used
      // Then Math.max(1, 20) = 20, and Math.min(20, 100) = 20
      const result = parsePagination({ limit: '0' });
      expect(result.limit).toBe(20); // Falls back to default because 0 is falsy

      // When limit=-10, parseInt returns -10 which is truthy
      // Then Math.max(1, -10) = 1
      const result2 = parsePagination({ limit: '-10' });
      expect(result2.limit).toBe(1);
    });

    it('should enforce maximum limit', () => {
      const result = parsePagination({ limit: '500' });
      expect(result.limit).toBe(100); // maxLimit
    });

    it('should calculate correct offset', () => {
      expect(parsePagination({ page: '1', limit: '10' }).offset).toBe(0);
      expect(parsePagination({ page: '2', limit: '10' }).offset).toBe(10);
      expect(parsePagination({ page: '3', limit: '10' }).offset).toBe(20);
      expect(parsePagination({ page: '5', limit: '20' }).offset).toBe(80);
    });

    it('should handle non-numeric values gracefully', () => {
      const result = parsePagination({ page: 'abc', limit: 'xyz' });

      expect(result.page).toBe(1);
      expect(result.limit).toBe(20);
    });

    it('should handle undefined query', () => {
      const result = parsePagination();

      expect(result.page).toBe(1);
      expect(result.limit).toBe(20);
      expect(result.offset).toBe(0);
    });

    it('should handle float values by parsing as integer', () => {
      const result = parsePagination({ page: '2.5', limit: '10.9' });

      expect(result.page).toBe(2);
      expect(result.limit).toBe(10);
    });

    it('should handle mixed valid/invalid values', () => {
      const result = parsePagination({ page: '3', limit: 'invalid' });

      expect(result.page).toBe(3);
      expect(result.limit).toBe(20); // default
    });
  });

  describe('buildPaginationMeta', () => {
    it('should build correct pagination metadata', () => {
      const result = buildPaginationMeta(100, 1, 10);

      expect(result).toEqual({
        page: 1,
        limit: 10,
        total: 100,
        totalPages: 10,
        hasNextPage: true,
        hasPrevPage: false,
      });
    });

    it('should calculate totalPages correctly', () => {
      expect(buildPaginationMeta(100, 1, 10).totalPages).toBe(10);
      expect(buildPaginationMeta(25, 1, 10).totalPages).toBe(3);
      expect(buildPaginationMeta(20, 1, 10).totalPages).toBe(2);
      expect(buildPaginationMeta(10, 1, 10).totalPages).toBe(1);
      expect(buildPaginationMeta(0, 1, 10).totalPages).toBe(0);
    });

    it('should set hasNextPage correctly', () => {
      expect(buildPaginationMeta(100, 1, 10).hasNextPage).toBe(true);
      expect(buildPaginationMeta(100, 5, 10).hasNextPage).toBe(true);
      expect(buildPaginationMeta(100, 10, 10).hasNextPage).toBe(false);
      expect(buildPaginationMeta(10, 1, 10).hasNextPage).toBe(false);
    });

    it('should set hasPrevPage correctly', () => {
      expect(buildPaginationMeta(100, 1, 10).hasPrevPage).toBe(false);
      expect(buildPaginationMeta(100, 2, 10).hasPrevPage).toBe(true);
      expect(buildPaginationMeta(100, 10, 10).hasPrevPage).toBe(true);
    });

    it('should handle edge case of 0 total', () => {
      const result = buildPaginationMeta(0, 1, 10);

      expect(result.total).toBe(0);
      expect(result.totalPages).toBe(0);
      expect(result.hasNextPage).toBe(false);
      expect(result.hasPrevPage).toBe(false);
    });

    it('should handle single page', () => {
      const result = buildPaginationMeta(5, 1, 10);

      expect(result.totalPages).toBe(1);
      expect(result.hasNextPage).toBe(false);
      expect(result.hasPrevPage).toBe(false);
    });

    it('should handle middle page', () => {
      const result = buildPaginationMeta(100, 5, 10);

      expect(result.hasNextPage).toBe(true);
      expect(result.hasPrevPage).toBe(true);
    });

    it('should handle last page', () => {
      const result = buildPaginationMeta(100, 10, 10);

      expect(result.hasNextPage).toBe(false);
      expect(result.hasPrevPage).toBe(true);
    });

    it('should handle exact page boundary', () => {
      const result = buildPaginationMeta(30, 3, 10);

      expect(result.totalPages).toBe(3);
      expect(result.hasNextPage).toBe(false);
    });

    it('should handle large datasets', () => {
      const result = buildPaginationMeta(1000000, 500, 100);

      expect(result.totalPages).toBe(10000);
      expect(result.hasNextPage).toBe(true);
      expect(result.hasPrevPage).toBe(true);
    });
  });
});

