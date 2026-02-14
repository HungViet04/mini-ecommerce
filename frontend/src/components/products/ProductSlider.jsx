/**
 * ProductSlider Component
 * Carousel/slider for featured products
 * Pattern: Presentational Component
 */
import React, { useState, useEffect, useCallback } from 'react';
import { Button } from '../ui';
import { formatPrice } from '../../utils';
import { useAuth } from '../../contexts';
import { uploadService } from '../../services';

export function ProductSlider({ products = [], onAddToCart, onViewDetail }) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isAutoPlaying, setIsAutoPlaying] = useState(true);
  const { isAdmin } = useAuth();

  // Auto-play slider
  useEffect(() => {
    if (!isAutoPlaying || products.length <= 1) return;

    const interval = setInterval(() => {
      setCurrentIndex((prev) => (prev + 1) % products.length);
    }, 4000);

    return () => clearInterval(interval);
  }, [isAutoPlaying, products.length]);

  const goToSlide = useCallback((index) => {
    setCurrentIndex(index);
    setIsAutoPlaying(false);
    // Resume auto-play after 10 seconds
    setTimeout(() => setIsAutoPlaying(true), 10000);
  }, []);

  const goToPrev = useCallback(() => {
    setCurrentIndex((prev) => (prev - 1 + products.length) % products.length);
    setIsAutoPlaying(false);
    setTimeout(() => setIsAutoPlaying(true), 10000);
  }, [products.length]);

  const goToNext = useCallback(() => {
    setCurrentIndex((prev) => (prev + 1) % products.length);
    setIsAutoPlaying(false);
    setTimeout(() => setIsAutoPlaying(true), 10000);
  }, [products.length]);

  if (products.length === 0) {
    return null;
  }

  const currentProduct = products[currentIndex];

  return (
    <div className="product-slider">
      <div className="slider-container">
        {/* Navigation Arrows */}
        {products.length > 1 && (
          <>
            <button className="slider-arrow slider-prev" onClick={goToPrev}>
              ‹
            </button>
            <button className="slider-arrow slider-next" onClick={goToNext}>
              ›
            </button>
          </>
        )}

        {/* Slide Content */}
        <div className="slider-content">
          <div className="slider-image-wrapper" onClick={() => onViewDetail?.(currentProduct)}>
            {currentProduct.image_url ? (
              <img
                src={uploadService.getImageUrl(currentProduct.image_url)}
                alt={currentProduct.name}
                className="slider-image"
              />
            ) : (
              <div className="slider-placeholder">
                <span className="slider-emoji">📦</span>
              </div>
            )}

            {/* Badge */}
            <div className="slider-badge">🔥 Nổi bật</div>
          </div>

          <div className="slider-info">
            <h2 className="slider-title">{currentProduct.name}</h2>

            <p className="slider-description">
              {currentProduct.description
                ? currentProduct.description.length > 150
                  ? currentProduct.description.substring(0, 150) + '...'
                  : currentProduct.description
                : '\u00A0'}
            </p>

            <div className="slider-price">{formatPrice(currentProduct.price)}</div>

            <div className="slider-stock">
              {currentProduct.stock > 0 ? `Còn ${currentProduct.stock} sản phẩm` : 'Hết hàng'}
            </div>

            <div className="slider-actions">
              {!isAdmin && (
                <Button
                  variant="primary"
                  size="lg"
                  disabled={currentProduct.stock <= 0}
                  onClick={() => onAddToCart?.(currentProduct)}
                >
                  {currentProduct.stock > 0 ? '🛒 Thêm vào giỏ' : 'Hết hàng'}
                </Button>
              )}
              <Button variant="secondary" size="lg" onClick={() => onViewDetail?.(currentProduct)}>
                Xem chi tiết
              </Button>
            </div>
          </div>
        </div>

        {/* Dots Navigation */}
        {products.length > 1 && (
          <div className="slider-dots">
            {products.map((_, index) => (
              <button
                key={index}
                className={`slider-dot ${index === currentIndex ? 'active' : ''}`}
                onClick={() => goToSlide(index)}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

export default ProductSlider;
