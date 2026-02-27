import React from 'react';
import { useCart } from '../../contexts/CartContext';
import { CartSummary } from './CartSummary';

export default function FloatingCart({ onCheckout, activeFloating, onFloatingChange }) {
  const { itemCount } = useCart();
  const open = activeFloating === 'cart';

  const handleCheckout = () => {
    onFloatingChange?.(null);
    onCheckout?.();
  };

  const handleOpenCart = () => {
    onFloatingChange?.('cart');
  };

  const handleCloseCart = () => {
    onFloatingChange?.(null);
  };

  return (
    <>
      {/* Ẩn nút giỏ hàng khi popup đang mở */}
      {!open && (
        <button className="floating-cart-btn" onClick={handleOpenCart} aria-label="Giỏ hàng">
          <span className="cart-icon">🛒</span>
          {itemCount > 0 && <span className="cart-badge">{itemCount}</span>}
        </button>
      )}
      {open && (
        <div className="cart-popup-overlay" onClick={handleCloseCart}>
          <div className="cart-popup" onClick={(e) => e.stopPropagation()}>
            <button className="cart-popup-close" onClick={handleCloseCart}>
              &times;
            </button>
            <CartSummary onCheckout={handleCheckout} />
          </div>
        </div>
      )}
    </>
  );
}
