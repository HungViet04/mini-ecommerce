/**
 * Input Component
 * Reusable form input with error handling
 * Pattern: Presentational Component
 */
import React from 'react';

export function Input({
  label,
  name,
  type = 'text',
  value,
  placeholder,
  error,
  touched,
  disabled = false,
  required = false,
  className = '',
  onChange,
  onBlur,
  ...props
}) {
  const hasError = touched && error;

  return (
    <div className={`form-group ${className}`}>
      {label && (
        <label htmlFor={name} className="form-label">
          {label}
          {required && <span className="required">*</span>}
        </label>
      )}
      <input
        id={name}
        name={name}
        type={type}
        value={value}
        placeholder={placeholder}
        disabled={disabled}
        className={`form-input ${hasError ? 'input-error' : ''}`}
        onChange={onChange}
        onBlur={onBlur}
        {...props}
      />
      {hasError && <span className="error-text">{error}</span>}
    </div>
  );
}

export default Input;
