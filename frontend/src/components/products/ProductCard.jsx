/**
 * ProductCard Component
 * Single product display card
 * Pattern: Presentational Component
 */
import React from 'react';
import { Card, Button } from '../ui';
import { formatPrice } from '../../utils';
import { useAuth } from '../../contexts';
import { uploadService } from '../../services';

export function ProductCard({ product, onAddToCart, onViewDetail, showActions = true }) {
  const { isAdmin } = useAuth();
  const { id, name, description, image_url, price, stock, category_name } = product;
  const inStock = stock > 0;

  // Lấy URL hình ảnh đầy đủ
  const imageFullUrl = uploadService.getImageUrl(image_url);

  const handleCardClick = () => {
    onViewDetail?.(product);
  };

  return (
    <Card className="product-card" onClick={handleCardClick}>
      <div className="product-image">
        {image_url ? (
          <img src={imageFullUrl} alt={name} className="product-img" />
        ) : (
          <span className="product-emoji">📦</span>
        )}
      </div>

      <div className="product-info">
        <h3 className="product-name">{name}</h3>
        {category_name && <span className="product-category">{category_name}</span>}
        <div className="product-info-row">
          <div className="product-price">{formatPrice(price)}</div>
          <div className={`product-stock ${inStock ? 'in-stock' : 'out-of-stock'}`}>
            {inStock ? `Còn ${stock} sản phẩm` : 'Hết hàng'}
          </div>
        </div>
      </div>

      {/* Đã bỏ nút thêm vào giỏ ở đây, chỉ cho thêm khi xem chi tiết */}
    </Card>
  );
}

export default ProductCard;
