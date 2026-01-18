/**
 * Alert Component
 * Notification/Alert messages
 * Pattern: Presentational Component
 */
import React from 'react';

const variants = {
  success: 'alert-success',
  error: 'alert-error',
  warning: 'alert-warning',
  info: 'alert-info',
};

export function Alert({
  children,
  variant = 'info',
  dismissible = false,
  onDismiss,
  className = '',
}) {
  return (
    <div className={`alert ${variants[variant]} ${className}`}>
      <span className="alert-content">{children}</span>
      {dismissible && onDismiss && (
        <button
          type="button"
          className="alert-dismiss"
          onClick={onDismiss}
          aria-label="Close"
        >
          ×
        </button>
      )}
    </div>
  );
}

export function ErrorAlert({ message, onDismiss }) {
  if (!message) return null;
  return (
    <Alert variant="error" dismissible onDismiss={onDismiss}>
      {message}
    </Alert>
  );
}

export function SuccessAlert({ message, onDismiss }) {
  if (!message) return null;
  return (
    <Alert variant="success" dismissible onDismiss={onDismiss}>
      {message}
    </Alert>
  );
}

export default Alert;
