/**
 * OrderCard Component
 * Single order display
 * Pattern: Presentational Component
 */
import React from 'react';
import { Card, Button } from '../ui';
import { formatPrice, formatDate } from '../../utils';

const statusColors = {
  pending: 'status-pending',
  paid: 'status-paid',
  shipped: 'status-shipped',
  delivered: 'status-delivered',
  cancelled: 'status-cancelled',
};

const statusLabels = {
  pending: 'Chờ thanh toán',
  paid: 'Đã thanh toán',
  shipped: 'Đang giao hàng',
  delivered: 'Đã nhận hàng',
  cancelled: 'Đã hủy',
};

export function OrderCard({ order, onCancel, onConfirmDelivery, onViewDetail }) {
  const { id, status, total, createdAt, items = [] } = order;
  const canCancel = status === 'pending';
  const canConfirmDelivery = status === 'shipped';
  const isPending = status === 'pending';

  return (
    <Card className="order-card" onClick={() => onViewDetail?.(order)}>
      <div className="order-header">
        <div className="order-id">Đơn hàng #{id}</div>
        <span className={`order-status ${statusColors[status]}`}>
          {statusLabels[status] || status}
        </span>
      </div>

      <div className="order-meta">
        <span className="order-date">{formatDate(createdAt)}</span>
        <span className="order-total">{formatPrice(total)}</span>
      </div>

      {items.length > 0 && (
        <div className="order-items">
          <h4>Sản phẩm:</h4>
          <ul>
            {items.map((item, index) => (
              <li key={index}>
                {item.productName || `Sản phẩm #${item.productId}`}
                {' × '}
                {item.quantity}
                {' - '}
                {formatPrice(item.price * item.quantity)}
              </li>
            ))}
          </ul>
        </div>
      )}

      {isPending && (
        <div className="order-payment-hint">
          💡 Nhấn để xem mã QR thanh toán
        </div>
      )}

      <div className="order-actions" onClick={(e) => e.stopPropagation()}>
        {canCancel && onCancel && (
          <Button
            variant="danger"
            size="sm"
            onClick={() => onCancel(id)}
          >
            Hủy Đơn Hàng
          </Button>
        )}
        
        {canConfirmDelivery && onConfirmDelivery && (
          <Button
            variant="primary"
            size="sm"
            onClick={() => onConfirmDelivery(id)}
          >
            ✅ Đã Nhận Hàng
          </Button>
        )}
        
        <Button
          variant="secondary"
          size="sm"
          onClick={() => onViewDetail?.(order)}
        >
          Xem Chi Tiết
        </Button>
      </div>
    </Card>
  );
}

export default OrderCard;
