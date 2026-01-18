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
  const { autoFetch = true } = options;

  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [saving, setSaving] = useState(false);

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

  const createCategory = useCallback(async (data) => {
    setSaving(true);
    setError(null);

    try {
      const newCategory = await categoryService.create(data);
      setCategories((prev) => [...prev, newCategory]);
      return newCategory;
    } catch (err) {
      setError(err.message || 'Không thể tạo danh mục');
      return null;
    } finally {
      setSaving(false);
    }
  }, []);

  const updateCategory = useCallback(async (id, data) => {
    setSaving(true);
    setError(null);

    try {
      const updatedCategory = await categoryService.update(id, data);
      setCategories((prev) =>
        prev.map((cat) => (cat.id === id ? updatedCategory : cat))
      );
      return updatedCategory;
    } catch (err) {
      setError(err.message || 'Không thể cập nhật danh mục');
      return null;
    } finally {
      setSaving(false);
    }
  }, []);

  const deleteCategory = useCallback(async (id) => {
    setSaving(true);
    setError(null);

    try {
      await categoryService.delete(id);
      setCategories((prev) => prev.filter((cat) => cat.id !== id));
      return true;
    } catch (err) {
      setError(err.message || 'Không thể xóa danh mục');
      return false;
    } finally {
      setSaving(false);
    }
  }, []);

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
    fetchCategories,
    createCategory,
    updateCategory,
    deleteCategory,
    clearError,
    refetch: fetchCategories,
  };
}

export default useCategories;
