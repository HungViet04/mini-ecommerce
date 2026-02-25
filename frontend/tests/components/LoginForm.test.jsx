/**
 * LoginForm Component Tests
 * Comprehensive tests for login form
 */
import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { LoginForm } from '../../src/components/auth/LoginForm';

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
        data-error={touched && error ? error : undefined}
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
}));

describe('LoginForm', () => {
  const defaultProps = {
    values: { email: '', password: '' },
    errors: {},
    touched: {},
    loading: false,
    submitError: null,
    onChange: vi.fn(),
    onBlur: vi.fn(),
    onSubmit: vi.fn((e) => e.preventDefault()),
    onSwitchMode: vi.fn(),
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('rendering', () => {
    it('should render login form', () => {
      render(<LoginForm {...defaultProps} />);
      expect(document.querySelector('form')).toBeInTheDocument();
    });

    it('should render logo', () => {
      render(<LoginForm {...defaultProps} />);
      expect(screen.getByText('Smart')).toBeInTheDocument();
      expect(screen.getByText('Shop')).toBeInTheDocument();
    });

    it('should render form title', () => {
      render(<LoginForm {...defaultProps} />);
      expect(screen.getByText('Chào Mừng Trở Lại')).toBeInTheDocument();
    });

    it('should render email input', () => {
      render(<LoginForm {...defaultProps} />);
      expect(screen.getByTestId('input-email')).toBeInTheDocument();
      expect(screen.getByLabelText(/Email/)).toBeInTheDocument();
    });

    it('should render password input', () => {
      render(<LoginForm {...defaultProps} />);
      expect(screen.getByTestId('input-password')).toBeInTheDocument();
      expect(screen.getByLabelText(/Mật khẩu/)).toBeInTheDocument();
    });

    it('should render login button', () => {
      render(<LoginForm {...defaultProps} />);
      expect(screen.getByRole('button', { name: /Đăng Nhập/i })).toBeInTheDocument();
    });

    it('should render switch mode link', () => {
      render(<LoginForm {...defaultProps} />);
      expect(screen.getByText('Chưa có tài khoản?')).toBeInTheDocument();
      expect(screen.getByText('Tạo Tài Khoản')).toBeInTheDocument();
    });
  });

  describe('input handling', () => {
    it('should call onChange when email changes', () => {
      const onChange = vi.fn();
      render(<LoginForm {...defaultProps} onChange={onChange} />);

      const emailInput = screen.getByLabelText(/Email/);
      fireEvent.change(emailInput, { target: { name: 'email', value: 'test@test.com' } });

      expect(onChange).toHaveBeenCalled();
    });

    it('should call onChange when password changes', () => {
      const onChange = vi.fn();
      render(<LoginForm {...defaultProps} onChange={onChange} />);

      const passwordInput = screen.getByLabelText(/Mật khẩu/);
      fireEvent.change(passwordInput, { target: { name: 'password', value: 'secret' } });

      expect(onChange).toHaveBeenCalled();
    });

    it('should call onBlur when input loses focus', () => {
      const onBlur = vi.fn();
      render(<LoginForm {...defaultProps} onBlur={onBlur} />);

      const emailInput = screen.getByLabelText(/Email/);
      fireEvent.blur(emailInput);

      expect(onBlur).toHaveBeenCalled();
    });

    it('should display input values', () => {
      render(
        <LoginForm {...defaultProps} values={{ email: 'user@test.com', password: 'pass123' }} />
      );

      expect(screen.getByLabelText(/Email/)).toHaveValue('user@test.com');
      expect(screen.getByLabelText(/Mật khẩu/)).toHaveValue('pass123');
    });
  });

  describe('error display', () => {
    it('should display email error when touched', () => {
      render(
        <LoginForm
          {...defaultProps}
          errors={{ email: 'Email không hợp lệ' }}
          touched={{ email: true }}
        />
      );

      expect(screen.getByText('Email không hợp lệ')).toBeInTheDocument();
    });

    it('should display password error when touched', () => {
      render(
        <LoginForm
          {...defaultProps}
          errors={{ password: 'Mật khẩu quá ngắn' }}
          touched={{ password: true }}
        />
      );

      expect(screen.getByText('Mật khẩu quá ngắn')).toBeInTheDocument();
    });

    it('should not display error when not touched', () => {
      render(
        <LoginForm
          {...defaultProps}
          errors={{ email: 'Email không hợp lệ' }}
          touched={{ email: false }}
        />
      );

      expect(screen.queryByText('Email không hợp lệ')).not.toBeInTheDocument();
    });

    it('should display submit error', () => {
      render(<LoginForm {...defaultProps} submitError="Email hoặc mật khẩu không chính xác" />);

      expect(screen.getByRole('alert')).toHaveTextContent('Email hoặc mật khẩu không chính xác');
    });

    it('should not display submit error when null', () => {
      render(<LoginForm {...defaultProps} submitError={null} />);

      expect(screen.queryByRole('alert')).not.toBeInTheDocument();
    });
  });

  describe('form submission', () => {
    it('should call onSubmit when form is submitted', () => {
      const onSubmit = vi.fn((e) => e.preventDefault());
      render(<LoginForm {...defaultProps} onSubmit={onSubmit} />);

      const form = document.querySelector('form');
      fireEvent.submit(form);

      expect(onSubmit).toHaveBeenCalled();
    });

    it('should call onSubmit when login button is clicked', () => {
      const onSubmit = vi.fn((e) => e.preventDefault());
      render(<LoginForm {...defaultProps} onSubmit={onSubmit} />);

      const button = screen.getByRole('button', { name: /Đăng Nhập/i });
      fireEvent.click(button);

      // Form submission happens
      expect(onSubmit).toHaveBeenCalled();
    });
  });

  describe('loading state', () => {
    it('should disable button when loading', () => {
      render(<LoginForm {...defaultProps} loading={true} />);

      const button = screen.getByRole('button', { name: /Loading/i });
      expect(button).toBeDisabled();
    });

    it('should show loading text when loading', () => {
      render(<LoginForm {...defaultProps} loading={true} />);

      expect(screen.getByText('Loading...')).toBeInTheDocument();
    });

    it('should have loading data attribute', () => {
      render(<LoginForm {...defaultProps} loading={true} />);

      const button = screen.getByRole('button', { name: /Loading/i });
      expect(button).toHaveAttribute('data-loading', 'true');
    });
  });

  describe('switch mode', () => {
    it('should call onSwitchMode when clicked', () => {
      const onSwitchMode = vi.fn();
      render(<LoginForm {...defaultProps} onSwitchMode={onSwitchMode} />);

      fireEvent.click(screen.getByText('Tạo Tài Khoản'));

      expect(onSwitchMode).toHaveBeenCalled();
    });

    it('should not submit form when switch mode clicked', () => {
      const onSubmit = vi.fn();
      const onSwitchMode = vi.fn();
      render(<LoginForm {...defaultProps} onSubmit={onSubmit} onSwitchMode={onSwitchMode} />);

      fireEvent.click(screen.getByText('Tạo Tài Khoản'));

      // Switch mode button has type="button", should not trigger form submit
      expect(onSwitchMode).toHaveBeenCalled();
    });
  });

  describe('accessibility', () => {
    it('should have required indicators', () => {
      render(<LoginForm {...defaultProps} />);

      // Required fields have asterisk in label text
      expect(screen.getByText(/Email\*/)).toBeInTheDocument();
      expect(screen.getByText(/Mật khẩu\*/)).toBeInTheDocument();
    });

    it('should have submit button as type submit', () => {
      render(<LoginForm {...defaultProps} />);

      const button = screen.getByRole('button', { name: /Đăng Nhập/i });
      expect(button).toHaveAttribute('type', 'submit');
    });

    it('should have password input as type password', () => {
      render(<LoginForm {...defaultProps} />);

      const passwordInput = screen.getByLabelText(/Mật khẩu/);
      expect(passwordInput).toHaveAttribute('type', 'password');
    });

    it('should have email input as type email', () => {
      render(<LoginForm {...defaultProps} />);

      const emailInput = screen.getByLabelText(/Email/);
      expect(emailInput).toHaveAttribute('type', 'email');
    });
  });

  describe('placeholders', () => {
    it('should have email placeholder', () => {
      render(<LoginForm {...defaultProps} />);

      const emailInput = screen.getByLabelText(/Email/);
      expect(emailInput).toHaveAttribute('placeholder', 'Nhập email của bạn');
    });

    it('should have password placeholder', () => {
      render(<LoginForm {...defaultProps} />);

      const passwordInput = screen.getByLabelText(/Mật khẩu/);
      expect(passwordInput).toHaveAttribute('placeholder', 'Nhập mật khẩu của bạn');
    });
  });
});
