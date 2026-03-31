/**
 * useAdminOrders Hook
 * Custom hook for admin order management
 * Pattern: Custom Hooks
 */
import { useState, useEffect, useCallback } from 'react';
import { orderService } from '../services';

/**
 * Hook for admin to fetch and manage all orders
 * @param {Object} options - { autoFetch, status, page, limit }
 * @returns {Object}
 */
export function useAdminOrders(options = {}) {
  const { autoFetch = true, status = undefined, page = 1, limit = 10 } = options;

  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [updating, setUpdating] = useState(false);
  const [search, setSearch] = useState('');
  const [currentPage, setCurrentPage] = useState(page);
  const [pageSize] = useState(limit);
  const [total, setTotal] = useState(0);

  const fetchOrders = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const params = {};
      params.page = currentPage;
      params.limit = pageSize;
      if (status) params.status = status;
      if (search) params.search = search;
      const result = await orderService.getAll(params);
      let items = [];
      if (result.meta && result.meta.pagination) {
        items = result.data || [];
        setTotal(result.meta.pagination.total || 0);
      } else {
        items = Array.isArray(result) ? result : result.items || result.data || [];
        setTotal(items.length);
      }
      setOrders(items);
    } catch (err) {
      setError(err.message || 'Không thể tải danh sách đơn hàng');
      setOrders([]);
      setTotal(0);
    } finally {
      setLoading(false);
    }
  }, [status, search, currentPage, pageSize]);

  const updateOrderStatus = useCallback(async (orderId, newStatus) => {
    setUpdating(true);
    setError(null);

    try {
      await orderService.updateStatus(orderId, newStatus);
      // Update local state
      setOrders((prev) =>
        prev.map((order) => (order.id === orderId ? { ...order, status: newStatus } : order))
      );
      return true;
    } catch (err) {
      setError(err.message || 'Không thể cập nhật trạng thái đơn hàng');
      return false;
    } finally {
      setUpdating(false);
    }
  }, []);

  // No pagination, nothing to reset

  useEffect(() => {
    if (autoFetch) {
      fetchOrders();
    }
  }, [autoFetch, fetchOrders]);

  return {
    orders,
    loading,
    error,
    updating,
    search,
    setSearch,
    page: currentPage,
    limit: pageSize,
    total,
    totalPages: Math.max(1, Math.ceil(total / pageSize)),
    setPage: setCurrentPage,
    fetchOrders,
    updateOrderStatus,
    refetch: fetchOrders,
  };
}

export default useAdminOrders;
