/**
 * useCategories Hook
 * Custom hook for category management
 * Pattern: Custom Hooks
 */
import { useState, useEffect, useCallback } from 'react';
import { categoryService } from '../services';

/**
 * Hook for fetching all categories
 * @param {Object} options - { autoFetch }
 * @returns {Object}
 */
export function useCategories(options = {}) {
  const { autoFetch = true } = options;

  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const fetchCategories = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const result = await categoryService.getAll();
      setCategories(Array.isArray(result) ? result : result.items || []);
    } catch (err) {
      setError(err.message || 'Không thể tải danh sách danh mục');
      setCategories([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (autoFetch) {
      fetchCategories();
    }
  }, [autoFetch, fetchCategories]);

  return {
    categories,
    loading,
    error,
    fetchCategories,
    refetch: fetchCategories,
  };
}

/**
 * Hook for admin category management (CRUD)
 * @param {Object} options - { autoFetch }
 * @returns {Object}
 */
export function useAdminCategories(options = {}) {
  const { autoFetch = true, page = 1, limit = 10 } = options;

  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [saving, setSaving] = useState(false);
  const [currentPage, setCurrentPage] = useState(page);
  const [pageSize] = useState(limit);
  const [total, setTotal] = useState(0);

  const fetchCategories = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const result = await categoryService.getAll({ page: currentPage, limit: pageSize });
      if (result && result.meta && result.meta.pagination) {
        setCategories(result.data || []);
        setTotal(result.meta.pagination.total || 0);
      } else {
        const items = Array.isArray(result) ? result : result.items || result.data || [];
        setCategories(items);
        setTotal(items.length);
      }
    } catch (err) {
      setError(err.message || 'Không thể tải danh sách danh mục');
      setCategories([]);
      setTotal(0);
    } finally {
      setLoading(false);
    }
  }, [currentPage, pageSize]);

  const createCategory = useCallback(async (data) => {
    setSaving(true);
    setError(null);

    try {
      const newCategory = await categoryService.create(data);
      await fetchCategories();
      return newCategory;
    } catch (err) {
      setError(err.message || 'Không thể tạo danh mục');
      return null;
    } finally {
      setSaving(false);
    }
  }, [fetchCategories]);

  const updateCategory = useCallback(async (id, data) => {
    setSaving(true);
    setError(null);

    try {
      const updatedCategory = await categoryService.update(id, data);
      await fetchCategories();
      return updatedCategory;
    } catch (err) {
      setError(err.message || 'Không thể cập nhật danh mục');
      return null;
    } finally {
      setSaving(false);
    }
  }, [fetchCategories]);

  const deleteCategory = useCallback(async (id) => {
    setSaving(true);
    setError(null);

    try {
      await categoryService.delete(id);
      await fetchCategories();
      return true;
    } catch (err) {
      setError(err.message || 'Không thể xóa danh mục');
      return false;
    } finally {
      setSaving(false);
    }
  }, [fetchCategories]);

  const clearError = useCallback(() => {
    setError(null);
  }, []);

  useEffect(() => {
    if (autoFetch) {
      fetchCategories();
    }
  }, [autoFetch, fetchCategories]);

  return {
    categories,
    loading,
    error,
    saving,
    page: currentPage,
    limit: pageSize,
    total,
    totalPages: Math.max(1, Math.ceil(total / pageSize)),
    setPage: setCurrentPage,
    fetchCategories,
    createCategory,
    updateCategory,
    deleteCategory,
    clearError,
    refetch: fetchCategories,
  };
}

export default useCategories;
