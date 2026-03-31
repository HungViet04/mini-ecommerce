/**
 * CartSummary Component
 * Cart summary and checkout
 * Pattern: Container Component
 */
import React from 'react';
import { useAuth, useCart, useNotification } from '../../contexts';
import { Card, Button } from '../ui';
import { CartItem } from './CartItem';
import { formatPrice } from '../../utils';

export function CartSummary({ onCheckout }) {
  const { items, total, itemCount, updateQuantity, removeItem, clearCart } = useCart();
  const { isAuthenticated } = useAuth();
  const { notifyToast } = useNotification();

  const handleCheckout = () => {
    if (!isAuthenticated) {
      notifyToast('Vui lòng đăng nhập để đặt hàng. Đang chuyển sang trang đăng nhập...', {
        type: 'info',
        duration: 1400,
      });
      setTimeout(() => onCheckout?.(), 900);
      return;
    }

    onCheckout?.();
  };

  if (items.length === 0) {
    return (
      <Card className="cart-empty">
        <span className="empty-icon">🛒</span>
        <p>Giỏ hàng của bạn đang trống</p>
        <p className="muted">Thêm sản phẩm để bắt đầu mua sắm</p>
      </Card>
    );
  }

  return (
    <Card className="cart-summary">
      <h3 className="cart-title">Giỏ Hàng ({itemCount} sản phẩm)</h3>

      <div className="cart-items">
        {items.map((item, index) => (
          <CartItem
            key={`${item.productId}-${index}`}
            item={item}
            index={index}
            onUpdateQuantity={updateQuantity}
            onRemove={removeItem}
          />
        ))}
      </div>

      <div className="cart-footer">
        <div className="cart-total">
          <span>Tạm tính:</span>
          <span className="total-amount">{formatPrice(total)}</span>
        </div>

        <div className="cart-actions">
          <Button variant="secondary" onClick={clearCart}>
            Xóa Giỏ Hàng
          </Button>
          <Button className="btn-checkout" variant="primary" onClick={handleCheckout}>
            Thanh Toán
          </Button>
        </div>
      </div>
    </Card>
  );
}

export default CartSummary;
