/**
 * LoginForm Component
 * Login form presenter
 * Pattern: Presentational Component
 */
import React from 'react';
import { Button, Input, ErrorAlert } from '../ui';

export function LoginForm({
  values,
  errors,
  touched,
  loading,
  submitError,
  onChange,
  onBlur,
  onSubmit,
  onSwitchMode,
}) {
  return (
    <form className="auth-form" onSubmit={onSubmit}>
      <div className="auth-logo">
        <span className="logo-smart">Smart</span>
        <span className="logo-shop">Shop</span>
      </div>
      <h2 className="form-title">Chào Mừng Trở Lại</h2>

      <ErrorAlert message={submitError} />

      <Input
        label="Email"
        name="email"
        type="email"
        placeholder="Nhập email của bạn"
        value={values.email}
        error={errors.email}
        touched={touched.email}
        onChange={onChange}
        onBlur={onBlur}
        required
      />

      <Input
        label="Mật khẩu"
        name="password"
        type="password"
        placeholder="Nhập mật khẩu của bạn"
        value={values.password}
        error={errors.password}
        touched={touched.password}
        onChange={onChange}
        onBlur={onBlur}
        required
      />

      <Button
        type="submit"
        variant="primary"
        loading={loading}
        className="btn-login btn-full"
      >
        Đăng Nhập
      </Button>

      <div className="form-footer">
        <span>Chưa có tài khoản?</span>
        <button type="button" className="btn link-btn btn-primary" onClick={onSwitchMode}>
          Tạo Tài Khoản
        </button>
      </div>
    </form>
  );
}

export default LoginForm;
