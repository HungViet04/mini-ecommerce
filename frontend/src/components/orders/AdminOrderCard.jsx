/**
 * AdminOrderCard Component
 * Order card with status management for admin
 * Pattern: Presentational Component
 */
import React, { useState } from 'react';
import { Card, Button } from '../ui';
import { formatPrice, formatDate } from '../../utils';

const statusColors = {
  pending: 'status-pending',
  paid: 'status-paid',
  shipped: 'status-shipped',
  delivered: 'status-delivered',
};

const statusLabels = {
  pending: 'Chờ xử lý',
  paid: 'Đã thanh toán',
  shipped: 'Đang giao hàng',
  delivered: 'Đã nhận hàng',
};

// Valid status transitions (admin can update up to shipped, user confirms delivered)
const validTransitions = {
  pending: ['paid'],
  paid: ['shipped'],
  shipped: [], // User confirms delivery, not admin
  delivered: [],
};

// payment method labels removed (not used in this compact card)

export function AdminOrderCard({ order, onUpdateStatus, updating }) {
  const { id, status, total, createdAt, items = [], userName } = order;
  const [selectedStatus, setSelectedStatus] = useState(status);

  const allowedStatuses = validTransitions[status] || [];
  const canUpdate = allowedStatuses.length > 0 && selectedStatus !== status;

  const handleStatusChange = (e) => {
    setSelectedStatus(e.target.value);
  };

  const handleUpdate = () => {
    if (canUpdate && onUpdateStatus) {
      onUpdateStatus(id, selectedStatus);
    }
  };

  return (
    <Card className="order-card admin-order-card compact">
      <div className="order-header">
        <div className="order-id">#{id}</div>
        <span className={`order-status ${statusColors[status]}`}>
          {statusLabels[status] || status}
        </span>
      </div>
      <div className="order-meta">
        <span className="order-date">{formatDate(createdAt)}</span>
        <span className="order-total">{formatPrice(total)}</span>
      </div>
      <div className="order-customer">
        <span className="customer-name">👤 {userName || 'Ẩn'}</span>
      </div>
      {items.length > 0 && (
        <div className="order-items order-items-compact">
          <span className="item-list-label">SP:</span>
          <span className="item-list-summary">
            {items
              .map((item) => `${item.productName || 'SP#' + item.productId} x${item.quantity}`)
              .join(', ')}
          </span>
        </div>
      )}

      {allowedStatuses.length > 0 && (
        <div className="order-status-update">
          <label htmlFor={`status-${id}`}>Trạng thái:</label>
          <div className="status-controls">
            <select
              id={`status-${id}`}
              value={selectedStatus}
              onChange={handleStatusChange}
              disabled={updating}
            >
              <option value={status}>{statusLabels[status] || status} (Hiện tại)</option>
              {allowedStatuses.map((s) => (
                <option key={s} value={s}>
                  {statusLabels[s] || s}
                </option>
              ))}
            </select>
            <Button
              variant="primary"
              size="sm"
              onClick={handleUpdate}
              disabled={!canUpdate || updating}
            >
              {updating ? 'Đang cập nhật...' : 'Cập nhật'}
            </Button>
          </div>
        </div>
      )}

      {allowedStatuses.length === 0 && status === 'shipped' && (
        <div className="order-status-waiting">⏳ Đang chờ khách hàng xác nhận</div>
      )}
      {allowedStatuses.length === 0 && status === 'delivered' && (
        <div className="order-status-final">✅ Đã hoàn tất</div>
      )}
    </Card>
  );
}

export default AdminOrderCard;
