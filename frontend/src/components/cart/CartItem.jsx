/**
 * CartItem Component
 * Single cart item display
 * Pattern: Presentational Component
 */
import React, { useEffect, useState } from 'react';
import { Button } from '../ui';
import { formatPrice } from '../../utils';
import { productService } from '../../services';

export function CartItem({ item, index, onUpdateQuantity, onRemove }) {
  const { productId, productName, price, quantity } = item;
  const subtotal = price * quantity;
  const [stock, setStock] = useState(null);
  const [error, setError] = useState('');

  useEffect(() => {
    let mounted = true;
    productService.getById(productId).then((product) => {
      if (mounted) setStock(product.stock);
    });
    return () => {
      mounted = false;
    };
  }, [productId]);

  const handleIncrease = () => {
    if (stock !== null && quantity >= stock) {
      setError(`Chỉ còn ${stock} sản phẩm trong kho.`);
      return;
    }
    setError('');
    onUpdateQuantity(index, quantity + 1);
  };

  const handleDecrease = () => {
    setError('');
    onUpdateQuantity(index, quantity - 1);
  };

  return (
    <div className="cart-item">
      <div className="cart-item-info">
        <span className="cart-item-name">{productName || `Sản phẩm #${productId}`}</span>
        <span className="cart-item-price">{formatPrice(price)} / cái</span>
      </div>

      <div className="cart-item-quantity">
        <button className="qty-btn" onClick={handleDecrease} disabled={quantity <= 1}>
          -
        </button>
        <span className="qty-value">{quantity}</span>
        <button
          className="qty-btn"
          onClick={handleIncrease}
          disabled={stock !== null && quantity >= stock}
        >
          +
        </button>
      </div>

      {error && (
        <div className="cart-item-error" style={{ color: 'red', fontSize: 12 }}>
          {error}
        </div>
      )}

      <div className="cart-item-subtotal">{formatPrice(subtotal)}</div>

      <Button variant="ghost" size="sm" onClick={() => onRemove(index)}>
        ✕
      </Button>
    </div>
  );
}

export default CartItem;
