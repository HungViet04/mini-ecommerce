import React, { useState } from 'react';
import { useCart } from '../../contexts/CartContext';
import { CartSummary } from './CartSummary';

export default function FloatingCart({ onCheckout }) {
  const { itemCount } = useCart();
  const [open, setOpen] = useState(false);

  const handleCheckout = () => {
    setOpen(false);
    onCheckout?.();
  };

  return (
    <>
      {/* Ẩn nút giỏ hàng khi popup đang mở */}
      {!open && (
        <button className="floating-cart-btn" onClick={() => setOpen(true)} aria-label="Giỏ hàng">
          <span className="cart-icon">🛒</span>
          {itemCount > 0 && <span className="cart-badge">{itemCount}</span>}
        </button>
      )}
      {open && (
        <div className="cart-popup-overlay" onClick={() => setOpen(false)}>
          <div className="cart-popup" onClick={(e) => e.stopPropagation()}>
            <button className="cart-popup-close" onClick={() => setOpen(false)}>
              &times;
            </button>
            <CartSummary onCheckout={handleCheckout} />
          </div>
        </div>
      )}
    </>
  );
}
