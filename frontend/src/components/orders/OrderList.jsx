/**
 * OrderList Component
 * User's order history
 * Pattern: Container Component
 */
import React, { useState } from 'react';
import { useOrders } from '../../hooks';
import { useAuth } from '../../contexts';
import { Loading, ErrorAlert } from '../ui';
import { OrderCard } from './OrderCard';
import { OrderDetail } from './OrderDetail';

export function OrderList() {
  const { isAuthenticated } = useAuth();
  const { orders, loading, error, cancelOrder, confirmDelivery } = useOrders({
    autoFetch: isAuthenticated,
  });
  const [selectedOrder, setSelectedOrder] = useState(null);

  if (!isAuthenticated) {
    return (
      <div className="orders-container">
        <div className="empty-container">
          <span className="empty-icon">🔒</span>
          <p>Vui lòng đăng nhập để xem đơn hàng của bạn</p>
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="orders-container">
        <Loading text="Đang tải đơn hàng..." variant="skeleton" />
      </div>
    );
  }

  const handleViewDetail = (order) => {
    setSelectedOrder(order);
  };

  const handleCloseDetail = () => {
    setSelectedOrder(null);
  };

  return (
    <section className="orders-section">
      <div className="section-header">
        <h1 className="section-title">Đơn Hàng Của Tôi</h1>
        <p className="section-subtitle">Xem và quản lý đơn hàng của bạn</p>
      </div>

      <ErrorAlert message={error} />

      {orders.length === 0 ? (
        <div className="empty-container">
          <span className="empty-icon">📋</span>
          <p>Chưa có đơn hàng nào</p>
          <p className="muted">Bắt đầu mua sắm để xem đơn hàng tại đây</p>
        </div>
      ) : (
        <div className="orders-list">
          {orders.map((order) => (
            <OrderCard
              key={order.id}
              order={order}
              onCancel={cancelOrder}
              onConfirmDelivery={confirmDelivery}
              onViewDetail={handleViewDetail}
            />
          ))}
        </div>
      )}

      {/* Order Detail Modal */}
      {selectedOrder && (
        <OrderDetail
          order={selectedOrder}
          onClose={handleCloseDetail}
          onCancel={cancelOrder}
          onConfirmDelivery={confirmDelivery}
        />
      )}
    </section>
  );
}

export default OrderList;
