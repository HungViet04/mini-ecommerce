/**
 * Card Component
 * Reusable card container
 * Pattern: Presentational Component
 */
import React from 'react';

export function Card({ children, className = '', onClick, ...props }) {
  return (
    <div
      className={`card ${onClick ? 'card-clickable' : ''} ${className}`}
      onClick={onClick}
      {...props}
    >
      {children}
    </div>
  );
}

export function CardHeader({ children, className = '' }) {
  return <div className={`card-header ${className}`}>{children}</div>;
}

export function CardBody({ children, className = '' }) {
  return <div className={`card-body ${className}`}>{children}</div>;
}

export function CardFooter({ children, className = '' }) {
  return <div className={`card-footer ${className}`}>{children}</div>;
}

export default Card;
