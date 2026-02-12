/**
 * useProducts Hook
 * Custom hook for product data fetching
 * Pattern: Custom Hooks
 */
import { useState, useEffect, useCallback } from 'react';
import { productService } from '../services';

/**
 * Hook for fetching products list
 * @param {Object} options - { autoFetch, page, limit }
 * @returns {Object}
 */
export function useProducts(options = {}) {
  const { autoFetch = true, page = 1, limit = 20 } = options;

  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [pagination, setPagination] = useState({ page, limit, total: 0 });

  const fetchProducts = useCallback(
    async (params = {}) => {
      setLoading(true);
      setError(null);

      try {
        const result = await productService.getAll({
          page: params.page || pagination.page,
          limit: params.limit || pagination.limit,
        });

        // Handle different response formats
        if (Array.isArray(result)) {
          setProducts(result);
          setPagination((prev) => ({ ...prev, total: result.length }));
        } else {
          setProducts(result.items || result.data || []);
          setPagination({
            page: result.page || pagination.page,
            limit: result.limit || pagination.limit,
            total: result.total || 0,
          });
        }
      } catch (err) {
        setError(err.message || 'Không thể tải danh sách sản phẩm');
        setProducts([]);
      } finally {
        setLoading(false);
      }
    },
    [pagination.page, pagination.limit]
  );

  const refetch = useCallback(() => {
    fetchProducts();
  }, [fetchProducts]);

  useEffect(() => {
    if (autoFetch) {
      fetchProducts();
    }
  }, [autoFetch]); // eslint-disable-line react-hooks/exhaustive-deps

  return {
    products,
    loading,
    error,
    pagination,
    fetchProducts,
    refetch,
  };
}

/**
 * Hook for fetching single product
 * @param {number} productId
 * @returns {Object}
 */
export function useProduct(productId) {
  const [product, setProduct] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const fetchProduct = useCallback(async () => {
    if (!productId) return;

    setLoading(true);
    setError(null);

    try {
      const result = await productService.getById(productId);
      setProduct(result);
    } catch (err) {
      setError(err.message || 'Không thể tải thông tin sản phẩm');
      setProduct(null);
    } finally {
      setLoading(false);
    }
  }, [productId]);

  useEffect(() => {
    fetchProduct();
  }, [fetchProduct]);

  return {
    product,
    loading,
    error,
    refetch: fetchProduct,
  };
}

export default useProducts;
