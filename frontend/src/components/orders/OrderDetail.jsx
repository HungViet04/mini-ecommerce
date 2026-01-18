/**
 * OrderDetail Component
 * Modal to show order details with QR payment info
 * Pattern: Presentational Component
 */
import React, { useState } from "react";
import { Button } from "../ui";
import { formatPrice, formatDate } from "../../utils";

const BANK_INFO = {
  bankName: "MoMo",
  accountNumber: "*******470",
  accountName: "NGUYỄN VĂN HÙNG",
  qrImage: "/images/image.png",
};

const statusConfig = {
  pending: {
    label: "Chờ thanh toán",
    color: "#f59e0b",
    bg: "#fef3c7",
    icon: "⏳",
  },
  paid: { label: "Đã thanh toán", color: "#10b981", bg: "#d1fae5", icon: "✅" },
  shipped: {
    label: "Đang giao hàng",
    color: "#3b82f6",
    bg: "#dbeafe",
    icon: "🚚",
  },
  delivered: {
    label: "Đã nhận hàng",
    color: "#059669",
    bg: "#a7f3d0",
    icon: "📦",
  },
  cancelled: { label: "Đã hủy", color: "#ef4444", bg: "#fee2e2", icon: "❌" },
};

const paymentMethodLabels = {
  cod: "Thanh toán khi nhận hàng",
  bank_transfer: "Chuyển khoản MoMo",
};

export function OrderDetail({ order, onClose, onCancel, onConfirmDelivery }) {
  const [copied, setCopied] = useState(false);

  if (!order) return null;

  const {
    id,
    status,
    total,
    createdAt,
    items = [],
    shippingName,
    shippingPhone,
    shippingAddress,
    shippingNotes,
    paymentMethod,
    shippingFee = 30000,
  } = order;

  const isPending = status === "pending";
  const isBankTransfer = paymentMethod === "bank_transfer";
  const canCancel = status === "pending";
  const canConfirmDelivery = status === "shipped";

  // Calculate subtotal from items (total from DB already includes shipping)
  const subtotal = items.reduce(
    (sum, item) => sum + item.price * item.quantity,
    0
  );
  const grandTotal = total || subtotal + shippingFee;

  const statusInfo = statusConfig[status] || statusConfig.pending;

  const handleCopyContent = () => {
    navigator.clipboard.writeText(`DH${id}`);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleCopyAmount = () => {
    navigator.clipboard.writeText(grandTotal.toString());
    alert("Đã sao chép số tiền!");
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div
        className="order-detail-modal-new"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="odm-header">
          <div className="odm-header-left">
            <span className="odm-order-icon">🧾</span>
            <div>
              <h2 className="odm-title">Đơn hàng #{id}</h2>
              <span className="odm-date">{formatDate(createdAt)}</span>
            </div>
          </div>
          <button className="odm-close" onClick={onClose}>
            ✕
          </button>
        </div>

        {/* Status Badge */}
        <div
          className="odm-status-banner"
          style={{ background: statusInfo.bg, color: statusInfo.color }}
        >
          <span className="odm-status-icon">{statusInfo.icon}</span>
          <span className="odm-status-text">{statusInfo.label}</span>
        </div>

        <div className="odm-body">
          {/* Shipping Info - if available */}
          {shippingName && (
            <div className="odm-section">
              <div className="odm-section-header">
                <span className="odm-section-icon">📍</span>
                <span>Thông tin giao hàng</span>
              </div>
              <div className="odm-shipping-info">
                <p className="odm-shipping-name">{shippingName}</p>
                <p className="odm-shipping-phone">{shippingPhone}</p>
                <p className="odm-shipping-address">{shippingAddress}</p>
                {shippingNotes && (
                  <p className="odm-shipping-note">📝 {shippingNotes}</p>
                )}
                <p className="odm-payment-method">
                  💳{" "}
                  {paymentMethodLabels[paymentMethod] ||
                    "Thanh toán khi nhận hàng"}
                </p>
              </div>
            </div>
          )}

          {/* Products */}
          <div className="odm-section">
            <div className="odm-section-header">
              <span className="odm-section-icon">🛍️</span>
              <span>Sản phẩm ({items.length})</span>
            </div>
            <div className="odm-products">
              <table className="odm-products-table">
                <thead>
                  <tr>
                    <th style={{ textAlign: "left" }}>Tên sản phẩm</th>
                    <th>Đơn giá</th>
                    <th>Số lượng</th>
                    <th>Thành tiền</th>
                  </tr>
                </thead>
                <tbody>
                  {items.map((item, index) => (
                    <tr key={index}>
                      <td>
                        {item.productName || `Sản phẩm #${item.productId}`}
                      </td>
                      <td>{formatPrice(item.price)}</td>
                      <td style={{ textAlign: "center" }}>{item.quantity}</td>
                      <td style={{ fontWeight: 600 }}>
                        {formatPrice(item.price * item.quantity)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Price Summary */}
          <div className="odm-summary">
            <div className="odm-summary-row">
              <span>Tạm tính</span>
              <span>{formatPrice(subtotal)}</span>
            </div>
            <div className="odm-summary-row">
              <span>Phí vận chuyển</span>
              <span>{formatPrice(shippingFee)}</span>
            </div>
            <div className="odm-summary-row odm-total">
              <span>Tổng cộng</span>
              <span>{formatPrice(grandTotal)}</span>
            </div>
          </div>

          {/* QR Payment - Only for pending orders with bank_transfer */}
          {isPending && isBankTransfer && (
            <div className="odm-qr-section">
              <div className="odm-qr-header">
                <span className="odm-qr-title">💳 Thanh toán MoMo</span>
                <span className="odm-qr-subtitle">Quét mã để thanh toán</span>
              </div>

              <div className="odm-qr-content">
                <div className="odm-qr-image-box">
                  <img
                    src={BANK_INFO.qrImage}
                    alt="QR Code MoMo"
                    className="odm-qr-image"
                  />
                </div>

                <div className="odm-qr-info">
                  <div className="odm-qr-amount" onClick={handleCopyAmount}>
                    <span className="odm-amount-label">Số tiền</span>
                    <span className="odm-amount-value">
                      {formatPrice(grandTotal)}
                    </span>
                  </div>

                  <div className="odm-qr-detail">
                    <span className="odm-detail-label">Chủ TK</span>
                    <span className="odm-detail-value">
                      {BANK_INFO.accountName}
                    </span>
                  </div>

                  <div className="odm-qr-detail odm-qr-content-ck">
                    <span className="odm-detail-label">Nội dung CK</span>
                    <div className="odm-copy-box">
                      <code className="odm-copy-code">
                        DH{id} {shippingPhone}
                      </code>
                      <button
                        className={`odm-copy-btn ${copied ? "copied" : ""}`}
                        onClick={handleCopyContent}
                      >
                        {copied ? "✓ Đã chép" : "📋 Copy"}
                      </button>
                    </div>
                  </div>
                </div>
              </div>

              <div className="odm-qr-note">
                <span className="odm-note-icon">💡</span>
                <span>
                  Nhập đúng nội dung chuyển khoản để đơn được xác nhận tự động
                </span>
              </div>
            </div>
          )}

          {/* COD notice for pending COD orders */}
          {isPending && !isBankTransfer && (
            <div className="odm-cod-notice">
              <span className="odm-cod-icon">💵</span>
              <span>Thanh toán {formatPrice(grandTotal)} khi nhận hàng</span>
            </div>
          )}
        </div>

        {/* Footer Actions */}
        <div className="odm-footer">
          {canCancel && onCancel && (
            <Button
              variant="danger"
              onClick={() => {
                onCancel(id);
                onClose();
              }}
            >
              ❌ Hủy đơn
            </Button>
          )}

          {canConfirmDelivery && onConfirmDelivery && (
            <Button
              variant="primary"
              onClick={() => {
                onConfirmDelivery(id);
                onClose();
              }}
            >
              ✅ Đã nhận hàng
            </Button>
          )}

          <Button variant="secondary" onClick={onClose}>
            Đóng
          </Button>
        </div>
      </div>
    </div>
  );
}

export default OrderDetail;
