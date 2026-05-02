/**
 * CartItem Component
 * Single cart item display
 * Pattern: Presentational Component
 */
import React, { useState, useEffect } from 'react';
import { Button } from '../ui';
import { formatPrice } from '../../utils';

export function CartItem({ item, index, onUpdateQuantity, onRemove }) {

  const { productId, productName, price, quantity } = item;
  const subtotal = price * quantity;
  const [error, setError] = useState('');
  const [stock, setStock] = useState(Number.isFinite(Number(item.stock)) ? Number(item.stock) : null);
  const [loadingStock, setLoadingStock] = useState(stock === null);

  useEffect(() => {
    let mounted = true;
    if (stock === null && productId) {
      setLoadingStock(true);
      import('../../services').then(({ productService }) => {
        productService.getById(productId).then((res) => {
          if (mounted && res && typeof res.stock !== 'undefined') {
            setStock(Number(res.stock));
          }
        }).finally(() => {
          if (mounted) setLoadingStock(false);
        });
      });
    } else {
      setLoadingStock(false);
    }
    return () => {
      mounted = false;
    };
  }, [productId]);



  const handleIncrease = () => {
    if (loadingStock) return;
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
        <button className="qty-btn" onClick={handleDecrease} disabled={quantity <= 1 || loadingStock}>
          -
        </button>
        <span className="qty-value">{quantity}</span>
        <button
          className="qty-btn"
          onClick={handleIncrease}
          disabled={loadingStock || (stock !== null && quantity >= stock)}
        >
          {loadingStock ? <span style={{fontSize:10}}>...</span> : '+'}
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
