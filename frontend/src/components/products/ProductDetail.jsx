/**
 * ProductDetail Component
 * Product detail view with image and full information
 * Pattern: Presentational Component
 */
import React from 'react';
import { Card, Button } from '../ui';
import { formatPrice } from '../../utils';
import { useAuth } from '../../contexts';
import { uploadService } from '../../services';

export function ProductDetail({ product, onAddToCart, onBack }) {
  const { isAdmin } = useAuth();
  const { name, description, image_url, price, stock, category_name } = product;

  const inStock = stock > 0;

  // Lấy URL hình ảnh đầy đủ
  const imageFullUrl = uploadService.getImageUrl(image_url);

  return (
    <div className="product-detail">
      <button className="back-button" onClick={onBack}>
        ← Quay lại danh sách sản phẩm
      </button>

      <Card className="product-detail-card">
        <div className="product-detail-layout">
          {/* Left: Image */}
          <div className="product-detail-image">
            {image_url ? (
              <img src={imageFullUrl} alt={name} />
            ) : (
              <div className="product-image-placeholder">
                <span className="product-emoji">📦</span>
              </div>
            )}
          </div>

          {/* Right: Information */}
          <div className="product-detail-info">
            <h1 className="product-detail-name">{name}</h1>

            {category_name && <span className="product-detail-category">{category_name}</span>}

            <div className="product-detail-price">{formatPrice(price)}</div>

            <div className={`product-detail-stock ${inStock ? 'in-stock' : 'out-of-stock'}`}>
              {inStock ? `✅ Còn ${stock} sản phẩm` : '❌ Hết hàng'}
            </div>

            {description && (
              <div className="product-detail-description">
                <h3>Mô tả sản phẩm</h3>
                <p>{description}</p>
              </div>
            )}

            {/* Only show Add to Cart for non-admin users */}
            {!isAdmin && (
              <div className="product-detail-actions">
                <Button
                  variant="primary"
                  size="lg"
                  disabled={!inStock}
                  onClick={() => onAddToCart?.(product)}
                >
                  {inStock ? '🛒 Thêm vào giỏ hàng' : 'Hết hàng'}
                </Button>
              </div>
            )}

            {isAdmin && (
              <div className="admin-notice">
                <span>👤 Chế độ Quản trị - Giỏ hàng đã tắt</span>
              </div>
            )}
          </div>
        </div>
      </Card>
    </div>
  );
}

export default ProductDetail;
