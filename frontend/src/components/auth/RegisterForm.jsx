/**
 * RegisterForm Component
 * Registration form presenter
 * Pattern: Presentational Component
 */
import React from 'react';
import { Button, Input, ErrorAlert, SuccessAlert } from '../ui';

export function RegisterForm({
  values,
  errors,
  touched,
  loading,
  submitError,
  success,
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
      <h2 className="form-title">Tạo Tài Khoản</h2>

      <ErrorAlert message={submitError} />
      {success && (
        <SuccessAlert message="Đăng ký thành công! Vui lòng đăng nhập." />
      )}

      <Input
        label="Họ và Tên"
        name="name"
        type="text"
        placeholder="Nhập họ và tên của bạn"
        value={values.name}
        error={errors.name}
        touched={touched.name}
        onChange={onChange}
        onBlur={onBlur}
        required
      />

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
        placeholder="Tạo mật khẩu (tối thiểu 6 ký tự)"
        value={values.password}
        error={errors.password}
        touched={touched.password}
        onChange={onChange}
        onBlur={onBlur}
        required
      />

      <Input
        label="Xác nhận mật khẩu"
        name="confirmPassword"
        type="password"
        placeholder="Nhập lại mật khẩu"
        value={values.confirmPassword}
        error={errors.confirmPassword}
        touched={touched.confirmPassword}
        onChange={onChange}
        onBlur={onBlur}
        required
      />

      <Button
        type="submit"
        variant="primary"
        loading={loading}
        className="btn-full"
      >
        Tạo Tài Khoản
      </Button>

      <div className="form-footer">
        <span>Đã có tài khoản?</span>
        <button type="button" className="link-btn" onClick={onSwitchMode}>
          Đăng Nhập
        </button>
      </div>
    </form>
  );
}

export default RegisterForm;
