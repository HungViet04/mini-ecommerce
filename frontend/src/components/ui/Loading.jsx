/**
 * Loading Component
 * Loading spinner and skeleton
 * Pattern: Presentational Component
 */
import React from 'react';

export function Spinner({ size = 'lg', className = '' }) {
  return (
    <div className={`spinner spinner-${size} ${className}`}>
      <div className="spinner-circle" />
    </div>
  );
}

export function Loading({ text = 'Đang tải...', className = '', variant = 'mixed', size = 'lg' }) {
  const showSpinner = variant === 'spinner' || variant === 'mixed';
  const showSkeleton = variant === 'skeleton' || variant === 'mixed';

  return (
    <div className={`loading-container ${className}`}>
      {showSpinner && <Spinner size={size} />}
      {text ? <span className="loading-text">{text}</span> : null}
      {showSkeleton && (
        <div className="loading-skeleton-stack">
          <Skeleton height="12px" width="180px" />
          <Skeleton height="12px" width="140px" />
          <Skeleton height="12px" width="200px" />
        </div>
      )}
    </div>
  );
}

export function Skeleton({ width, height, className = '' }) {
  return <div className={`skeleton ${className}`} style={{ width, height }} />;
}

export function CardSkeleton() {
  return (
    <div className="card skeleton-card">
      <Skeleton height="20px" width="60%" />
      <Skeleton height="14px" width="40%" />
      <Skeleton height="14px" width="80%" />
    </div>
  );
}

export function LoadingOverlay({
  open = false,
  text = 'Đang tải...',
  variant = 'mixed',
  size = 'lg',
  className = '',
}) {
  if (!open) return null;

  return (
    <div className={`loading-overlay ${className}`} role="status" aria-live="polite">
      <div className="loading-overlay-card">
        <Loading text={text} variant={variant} size={size} className="loading-overlay-content" />
      </div>
    </div>
  );
}

export default Loading;
