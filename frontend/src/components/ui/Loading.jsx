/**
 * Loading Component
 * Loading spinner and skeleton
 * Pattern: Presentational Component
 */
import React from 'react';

export function Spinner({ size = 'md', className = '' }) {
  return (
    <div className={`spinner spinner-${size} ${className}`}>
      <div className="spinner-circle" />
    </div>
  );
}

export function Loading({ text = 'Đang tải...', className = '' }) {
  return (
    <div className={`loading-container ${className}`}>
      <Spinner />
      <span className="loading-text">{text}</span>
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

export default Loading;
