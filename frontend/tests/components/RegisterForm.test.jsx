/**
 * RegisterForm Component Tests
 * Comprehensive tests for registration form
 */
import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { RegisterForm } from '../../src/components/auth/RegisterForm';

// Mock UI components
vi.mock('../../src/components/ui', () => ({
  Button: ({ children, loading, disabled, type, onClick, className }) => (
    <button
      type={type}
      disabled={disabled || loading}
      onClick={onClick}
      className={className}
      data-loading={loading}
    >
      {loading ? 'Loading...' : children}
    </button>
  ),
  Input: ({
    label,
    name,
    type,
    value,
    error,
    touched,
    placeholder,
    onChange,
    onBlur,
    required,
  }) => (
    <div data-testid={`input-${name}`}>
      {label && (
        <label htmlFor={name}>
          {label}
          {required && '*'}
        </label>
      )}
      <input
        id={name}
        name={name}
        type={type}
        value={value}
        placeholder={placeholder}
        onChange={onChange}
        onBlur={onBlur}
      />
      {touched && error && <span className="error">{error}</span>}
    </div>
  ),
  ErrorAlert: ({ message }) =>
    message ? (
      <div role="alert" className="error-alert">
        {message}
      </div>
    ) : null,
  SuccessAlert: ({ message }) =>
    message ? (
      <div role="status" className="success-alert">
        {message}
      </div>
    ) : null,
}));

describe('RegisterForm', () => {
  const defaultProps = {
    values: { name: '', email: '', password: '', confirmPassword: '' },
    errors: {},
    touched: {},
    loading: false,
    submitError: null,
    success: false,
    onChange: vi.fn(),
    onBlur: vi.fn(),
    onSubmit: vi.fn(e => e.preventDefault()),
    onSwitchMode: vi.fn(),
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('rendering', () => {
    it('should render register form', () => {
      render(<RegisterForm {...defaultProps} />);
      expect(document.querySelector('form')).toBeInTheDocument();
    });

    it('should render logo', () => {
      render(<RegisterForm {...defaultProps} />);
      expect(screen.getByText('Smart')).toBeInTheDocument();
      expect(screen.getByText('Shop')).toBeInTheDocument();
    });

    it('should render form title', () => {
      render(<RegisterForm {...defaultProps} />);
      expect(screen.getByRole('heading', { name: 'Tạo Tài Khoản' })).toBeInTheDocument();
    });

    it('should render name input', () => {
      render(<RegisterForm {...defaultProps} />);
      expect(screen.getByTestId('input-name')).toBeInTheDocument();
      expect(screen.getByLabelText(/Họ và Tên/)).toBeInTheDocument();
    });

    it('should render email input', () => {
      render(<RegisterForm {...defaultProps} />);
      expect(screen.getByTestId('input-email')).toBeInTheDocument();
    });

    it('should render password input', () => {
      render(<RegisterForm {...defaultProps} />);
      expect(screen.getByTestId('input-password')).toBeInTheDocument();
    });

    it('should render confirm password input', () => {
      render(<RegisterForm {...defaultProps} />);
      expect(screen.getByTestId('input-confirmPassword')).toBeInTheDocument();
    });

    it('should render submit button', () => {
      render(<RegisterForm {...defaultProps} />);
      expect(screen.getByRole('button', { name: /Tạo Tài Khoản/i })).toBeInTheDocument();
    });

    it('should render switch to login link', () => {
      render(<RegisterForm {...defaultProps} />);
      expect(screen.getByText('Đã có tài khoản?')).toBeInTheDocument();
      expect(screen.getByText('Đăng Nhập')).toBeInTheDocument();
    });
  });

  describe('input handling', () => {
    it('should call onChange for name input', () => {
      const onChange = vi.fn();
      render(<RegisterForm {...defaultProps} onChange={onChange} />);

      const nameInput = screen.getByLabelText(/Họ và Tên/);
      fireEvent.change(nameInput, { target: { name: 'name', value: 'John Doe' } });

      expect(onChange).toHaveBeenCalled();
    });

    it('should call onChange for email input', () => {
      const onChange = vi.fn();
      render(<RegisterForm {...defaultProps} onChange={onChange} />);

      const emailInput = screen.getByLabelText(/Email/);
      fireEvent.change(emailInput, { target: { name: 'email', value: 'test@test.com' } });

      expect(onChange).toHaveBeenCalled();
    });

    it('should call onChange for password input', () => {
      const onChange = vi.fn();
      render(<RegisterForm {...defaultProps} onChange={onChange} />);

      const passwordInput = screen.getByLabelText('Mật khẩu*');
      fireEvent.change(passwordInput, { target: { name: 'password', value: 'secret123' } });

      expect(onChange).toHaveBeenCalled();
    });

    it('should call onChange for confirm password input', () => {
      const onChange = vi.fn();
      render(<RegisterForm {...defaultProps} onChange={onChange} />);

      const confirmInput = screen.getByLabelText(/Xác nhận mật khẩu/);
      fireEvent.change(confirmInput, { target: { name: 'confirmPassword', value: 'secret123' } });

      expect(onChange).toHaveBeenCalled();
    });

    it('should display input values', () => {
      render(
        <RegisterForm
          {...defaultProps}
          values={{
            name: 'John Doe',
            email: 'john@test.com',
            password: 'pass123',
            confirmPassword: 'pass123',
          }}
        />
      );

      expect(screen.getByLabelText(/Họ và Tên/)).toHaveValue('John Doe');
      expect(screen.getByLabelText(/Email/)).toHaveValue('john@test.com');
    });
  });

  describe('error display', () => {
    it('should display name error', () => {
      render(
        <RegisterForm
          {...defaultProps}
          errors={{ name: 'Tên không hợp lệ' }}
          touched={{ name: true }}
        />
      );

      expect(screen.getByText('Tên không hợp lệ')).toBeInTheDocument();
    });

    it('should display email error', () => {
      render(
        <RegisterForm
          {...defaultProps}
          errors={{ email: 'Email không hợp lệ' }}
          touched={{ email: true }}
        />
      );

      expect(screen.getByText('Email không hợp lệ')).toBeInTheDocument();
    });

    it('should display password error', () => {
      render(
        <RegisterForm
          {...defaultProps}
          errors={{ password: 'Mật khẩu phải có ít nhất 6 ký tự' }}
          touched={{ password: true }}
        />
      );

      expect(screen.getByText('Mật khẩu phải có ít nhất 6 ký tự')).toBeInTheDocument();
    });

    it('should display confirm password error', () => {
      render(
        <RegisterForm
          {...defaultProps}
          errors={{ confirmPassword: 'Mật khẩu không khớp' }}
          touched={{ confirmPassword: true }}
        />
      );

      expect(screen.getByText('Mật khẩu không khớp')).toBeInTheDocument();
    });

    it('should display submit error', () => {
      render(<RegisterForm {...defaultProps} submitError="Email đã được sử dụng" />);

      expect(screen.getByRole('alert')).toHaveTextContent('Email đã được sử dụng');
    });

    it('should display multiple errors', () => {
      render(
        <RegisterForm
          {...defaultProps}
          errors={{
            name: 'Tên quá ngắn',
            email: 'Email không hợp lệ',
            password: 'Mật khẩu quá yếu',
          }}
          touched={{ name: true, email: true, password: true }}
        />
      );

      expect(screen.getByText('Tên quá ngắn')).toBeInTheDocument();
      expect(screen.getByText('Email không hợp lệ')).toBeInTheDocument();
      expect(screen.getByText('Mật khẩu quá yếu')).toBeInTheDocument();
    });
  });

  describe('success state', () => {
    it('should display success message', () => {
      render(<RegisterForm {...defaultProps} success={true} />);

      expect(screen.getByRole('status')).toHaveTextContent('Đăng ký thành công');
    });

    it('should not display success message when false', () => {
      render(<RegisterForm {...defaultProps} success={false} />);

      expect(screen.queryByRole('status')).not.toBeInTheDocument();
    });
  });

  describe('form submission', () => {
    it('should call onSubmit when form is submitted', () => {
      const onSubmit = vi.fn(e => e.preventDefault());
      render(<RegisterForm {...defaultProps} onSubmit={onSubmit} />);

      const form = document.querySelector('form');
      fireEvent.submit(form);

      expect(onSubmit).toHaveBeenCalled();
    });
  });

  describe('loading state', () => {
    it('should disable button when loading', () => {
      render(<RegisterForm {...defaultProps} loading={true} />);

      const button = screen.getByRole('button', { name: /Loading/i });
      expect(button).toBeDisabled();
    });

    it('should show loading text', () => {
      render(<RegisterForm {...defaultProps} loading={true} />);

      expect(screen.getByText('Loading...')).toBeInTheDocument();
    });
  });

  describe('switch mode', () => {
    it('should call onSwitchMode when login link clicked', () => {
      const onSwitchMode = vi.fn();
      render(<RegisterForm {...defaultProps} onSwitchMode={onSwitchMode} />);

      fireEvent.click(screen.getByText('Đăng Nhập'));

      expect(onSwitchMode).toHaveBeenCalled();
    });
  });

  describe('accessibility', () => {
    it('should have password inputs as type password', () => {
      render(<RegisterForm {...defaultProps} />);

      const passwordInput = screen.getByLabelText('Mật khẩu*');
      const confirmInput = screen.getByLabelText(/Xác nhận mật khẩu/);

      expect(passwordInput).toHaveAttribute('type', 'password');
      expect(confirmInput).toHaveAttribute('type', 'password');
    });

    it('should have all inputs marked as required', () => {
      render(<RegisterForm {...defaultProps} />);

      // Required fields have asterisk appended in label text
      expect(screen.getByText(/Họ và Tên\*/)).toBeInTheDocument();
      expect(screen.getByText(/Email\*/)).toBeInTheDocument();
      expect(screen.getByText(/Mật khẩu\*/)).toBeInTheDocument();
      expect(screen.getByText(/Xác nhận mật khẩu\*/)).toBeInTheDocument();
    });
  });

  describe('placeholders', () => {
    it('should have name placeholder', () => {
      render(<RegisterForm {...defaultProps} />);
      expect(screen.getByPlaceholderText('Nhập họ và tên của bạn')).toBeInTheDocument();
    });

    it('should have email placeholder', () => {
      render(<RegisterForm {...defaultProps} />);
      expect(screen.getByPlaceholderText('Nhập email của bạn')).toBeInTheDocument();
    });

    it('should have password placeholder with hint', () => {
      render(<RegisterForm {...defaultProps} />);
      expect(screen.getByPlaceholderText('Tạo mật khẩu (tối thiểu 6 ký tự)')).toBeInTheDocument();
    });

    it('should have confirm password placeholder', () => {
      render(<RegisterForm {...defaultProps} />);
      expect(screen.getByPlaceholderText('Nhập lại mật khẩu')).toBeInTheDocument();
    });
  });
});

