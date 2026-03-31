import React, { useEffect } from 'react';

export function Toast({ message, type = 'info', duration = 4000, onClose }) {
  useEffect(() => {
    if (!message) return;
    const timer = setTimeout(() => {
      onClose?.();
    }, duration);
    return () => clearTimeout(timer);
  }, [message, duration, onClose]);

  if (!message) return null;

  return <div className={`toast toast-${type}`}>{message}</div>;
}

export default Toast;
