/**
 * OrderSuccess Component
 * Order confirmation page after successful checkout (COD only)
 * VNPay orders are handled by VNPayReturn component
 * Pattern: Presentational Component
 */
import React from 'react';
import { Card, Button } from '../ui';
import { formatPrice } from '../../utils';

export function OrderSuccess({
  order,
  paymentMethod,
  shippingInfo,
  onContinueShopping,
  onViewOrders,
}) {
  return (
    <div className="order-success-page">
      <Card className="success-card">
        {/* Success Header */}
        <div className="success-header">
          <div className="success-icon">✅</div>
          <h1 className="success-title">Đặt Hàng Thành Công!</h1>
          <p className="success-subtitle">Cảm ơn bạn đã mua hàng tại SmartShop</p>
        </div>

        {/* Order Info */}
        <div className="order-info-section">
          <div className="info-row highlight">
            <span className="info-label">Mã đơn hàng:</span>
            <span className="info-value order-id">#{order?.id || '---'}</span>
          </div>
          <div className="info-row">
            <span className="info-label">Trạng thái:</span>
            <span className="info-value status-badge pending">Chờ xác nhận</span>
          </div>
          <div className="info-row">
            <span className="info-label">Tổng tiền:</span>
            <span className="info-value total-amount">{formatPrice(order?.total || 0)}</span>
          </div>
          <div className="info-row">
            <span className="info-label">Thanh toán:</span>
            <span className="info-value">Thanh toán khi nhận hàng (COD)</span>
          </div>
        </div>

        {/* Shipping Info */}
        <div className="shipping-info-section">
          <h3 className="section-title">📦 Thông Tin Giao Hàng</h3>
          <div className="shipping-details">
            <p>
              <strong>{shippingInfo?.fullName}</strong>
            </p>
            <p>{shippingInfo?.phone}</p>
            <p>
              {shippingInfo?.address}, {shippingInfo?.ward}, {shippingInfo?.district},{' '}
              {shippingInfo?.province}
            </p>
            {shippingInfo?.note && <p className="shipping-note">Ghi chú: {shippingInfo.note}</p>}
          </div>
        </div>

        {/* Order Items */}
        {order?.items && order.items.length > 0 && (
          <div className="order-items-section">
            <h3 className="section-title">🛒 Sản Phẩm Đã Đặt</h3>
            <div className="items-list">
              {order.items.map((item, index) => (
                <div key={index} className="item-row">
                  <span className="item-name">{item.productName || item.name}</span>
                  <span className="item-qty">x{item.quantity}</span>
                  <span className="item-price">{formatPrice(item.price * item.quantity)}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Actions */}
        <div className="success-actions">
          <Button variant="primary" onClick={onViewOrders}>
            Xem Đơn Hàng
          </Button>
          <Button variant="primary" onClick={onContinueShopping}>
            Tiếp Tục Mua Sắm
          </Button>
        </div>

        {/* Contact */}
        <div className="contact-section">
          <p>
            Có thắc mắc? Liên hệ hotline: <strong>0325251470</strong>
          </p>
        </div>
      </Card>
    </div>
  );
}

export default OrderSuccess;
