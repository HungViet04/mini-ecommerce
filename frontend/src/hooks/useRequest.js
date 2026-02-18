/**
 * useRequest Hook
 * Generic hook for async data fetching with loading/error states
 * Pattern: Custom Hooks - DRY principle
 */
import { useState, useCallback, useEffect } from 'react';

/**
 * Hook for handling async requests with loading/error/data states
 * @param {Function} requestFn - Async function to execute
 * @param {Object} options - {autoFetch, onSuccess, onError, initialData}
 * @returns {Object} {data, loading, error, execute, refetch, reset}
 */
export function useRequest(requestFn, options = {}) {
  const { autoFetch = false, onSuccess, onError, initialData = null } = options;

  const [data, setData] = useState(initialData);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  /**
   * Execute the request
   * @param {...any} args - Arguments to pass to requestFn
   */
  const execute = useCallback(
    async (...args) => {
      setLoading(true);
      setError(null);

      try {
        const result = await requestFn(...args);
        setData(result);
        onSuccess?.(result);
        return result;
      } catch (err) {
        const errorMessage = err.message || 'Đã xảy ra lỗi';
        setError(errorMessage);
        onError?.(err);
        throw err;
      } finally {
        setLoading(false);
      }
    },
    [requestFn, onSuccess, onError]
  );

  /**
   * Refetch with the same arguments as last call
   */
  const refetch = useCallback(() => {
    return execute();
  }, [execute]);

  /**
   * Reset state to initial
   */
  const reset = useCallback(() => {
    setData(initialData);
    setError(null);
    setLoading(false);
  }, [initialData]);

  // Auto-fetch on mount if enabled
  useEffect(() => {
    if (autoFetch) {
      execute();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [autoFetch]); // Intentionally only run on mount with autoFetch flag

  return {
    data,
    loading,
    error,
    execute,
    refetch,
    reset,
  };
}

export default useRequest;
