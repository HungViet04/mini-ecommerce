/**
 * useOrders Hook
 * Custom hook for order data fetching
 * Pattern: Custom Hooks
 */
import { useState, useEffect, useCallback } from 'react';
import { orderService } from '../services';

/**
 * Hook for fetching user orders
 * @param {Object} options - { autoFetch }
 * @returns {Object}
 */
export function useOrders(options = {}) {
  const { autoFetch = true } = options;

  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const fetchOrders = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const result = await orderService.getMyOrders();
      setOrders(Array.isArray(result) ? result : result.items || []);
    } catch (err) {
      setError(err.message || 'Không thể tải danh sách đơn hàng');
      setOrders([]);
    } finally {
      setLoading(false);
    }
  }, []);

  const cancelOrder = useCallback(async (orderId) => {
    try {
      await orderService.cancel(orderId);
      await fetchOrders(); // Refetch after cancel
      return true;
    } catch (err) {
      setError(err.message || 'Không thể hủy đơn hàng');
      return false;
    }
  }, [fetchOrders]);

  const confirmDelivery = useCallback(async (orderId) => {
    try {
      await orderService.confirmDelivery(orderId);
      await fetchOrders(); // Refetch after confirm
      return true;
    } catch (err) {
      setError(err.message || 'Không thể xác nhận nhận hàng');
      return false;
    }
  }, [fetchOrders]);

  useEffect(() => {
    if (autoFetch) {
      fetchOrders();
    }
  }, [autoFetch, fetchOrders]);

  return {
    orders,
    loading,
    error,
    fetchOrders,
    cancelOrder,
    confirmDelivery,
    refetch: fetchOrders,
  };
}

/**
 * Hook for creating orders
 * @returns {Object}
 */
export function useCreateOrder() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(false);

  const createOrder = useCallback(async (items) => {
    setLoading(true);
    setError(null);
    setSuccess(false);

    try {
      const result = await orderService.create({ items });
      setSuccess(true);
      return result;
    } catch (err) {
      setError(err.message || 'Không thể tạo đơn hàng');
      return null;
    } finally {
      setLoading(false);
    }
  }, []);

  const reset = useCallback(() => {
    setError(null);
    setSuccess(false);
  }, []);

  return {
    createOrder,
    loading,
    error,
    success,
    reset,
  };
}

export default useOrders;
