/**
 * OrderSuccess Component
 * Order confirmation page after successful checkout
 * Pattern: Presentational Component
 */
import React from 'react';
import { Card, Button } from '../ui';
import { formatPrice } from '../../utils';

const BANK_INFO = {
  bankName: 'MoMo',
  accountNumber: '*******470',
  accountName: 'NGUYỄN VĂN HÙNG',
  qrImage: '/images/image.png',
};

export function OrderSuccess({
  order,
  paymentMethod,
  shippingInfo,
  onContinueShopping,
  onViewOrders,
}) {
  const isBankTransfer = paymentMethod === 'bank_transfer';

  return (
    <div className="order-success-page">
      <Card className="success-card">
        {/* Success Header */}
        <div className="success-header">
          <div className="success-icon">{isBankTransfer ? '🏦' : '✅'}</div>
          <h1 className="success-title">
            {isBankTransfer ? 'Đơn Hàng Đã Được Tạo!' : 'Đặt Hàng Thành Công!'}
          </h1>
          <p className="success-subtitle">
            {isBankTransfer
              ? 'Vui lòng chuyển khoản để hoàn tất đơn hàng'
              : 'Cảm ơn bạn đã mua hàng tại SmartShop'}
          </p>
        </div>

        {/* Order Info */}
        <div className="order-info-section">
          <div className="info-row highlight">
            <span className="info-label">Mã đơn hàng:</span>
            <span className="info-value order-id">#{order?.id || '---'}</span>
          </div>
          <div className="info-row">
            <span className="info-label">Trạng thái:</span>
            <span className="info-value status-badge pending">
              {isBankTransfer ? 'Chờ thanh toán' : 'Chờ xác nhận'}
            </span>
          </div>
          <div className="info-row">
            <span className="info-label">Tổng tiền:</span>
            <span className="info-value total-amount">{formatPrice(order?.total || 0)}</span>
          </div>
        </div>

        {/* Bank Transfer Info - QR Code */}
        {isBankTransfer && (
          <div className="bank-transfer-section">
            <h3 className="section-title">💳 Quét Mã QR Để Thanh Toán</h3>

            {/* QR Code Only */}
            <div className="qr-code-container">
              <img src={BANK_INFO.qrImage} alt="QR Code thanh toán" className="qr-code-image" />
            </div>

            {/* Payment Amount */}
            <div className="payment-amount-box">
              <span className="amount-label">Số tiền cần chuyển:</span>
              <span className="amount-value">{formatPrice(order?.total || 0)}</span>
            </div>

            {/* Transfer Info Note */}
            <div className="transfer-info-note">
              <p className="note-item">
                <span className="note-label">Chủ tài khoản:</span>
                <span className="note-value">{BANK_INFO.accountName}</span>
              </p>
              <p className="note-item">
                <span className="note-label">Nội dung CK:</span>
                <span className="note-value highlight">
                  DH{order?.id} {shippingInfo?.phone}
                </span>
                <button
                  className="copy-btn-small"
                  onClick={() => {
                    navigator.clipboard.writeText(`DH${order?.id} ${shippingInfo?.phone}`);
                    alert('Đã sao chép nội dung chuyển khoản!');
                  }}
                  title="Sao chép"
                >
                  📋
                </button>
              </p>
            </div>

            <p className="bank-warning">
              ⚠️ Vui lòng chuyển khoản đúng số tiền và nội dung. Đơn hàng sẽ được xác nhận sau khi
              nhận được thanh toán (thường trong vòng 5-15 phút).
            </p>
          </div>
        )}

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
