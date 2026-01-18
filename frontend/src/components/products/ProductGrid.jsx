/**
 * ProductGrid Component
 * Grid layout for products
 * Pattern: Presentational Component
 */
import React from 'react';
import { ProductCard } from './ProductCard';
import { Loading, CardSkeleton } from '../ui';

export function ProductGrid({ products, loading, error, onAddToCart, onViewDetail }) {
  if (loading) {
    return (
      <div className="product-grid">
        {[...Array(6)].map((_, i) => (
          <CardSkeleton key={i} />
        ))}
      </div>
    );
  }

  if (error) {
    return (
      <div className="error-container">
        <p className="error-text">{error}</p>
      </div>
    );
  }

  if (products.length === 0) {
    return (
      <div className="empty-container">
        <span className="empty-icon">📭</span>
        <p className="empty-text">Không tìm thấy sản phẩm nào</p>
      </div>
    );
  }

  return (
    <div className="product-grid">
      {products.map((product) => (
        <ProductCard
          key={product.id}
          product={product}
          onAddToCart={onAddToCart}
          onViewDetail={onViewDetail}
        />
      ))}
    </div>
  );
}

export default ProductGrid;
