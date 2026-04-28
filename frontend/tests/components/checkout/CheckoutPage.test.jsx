/**
 * CheckoutPage Component Tests
 * Tests for checkout flow
 * Uses dynamic import to avoid ESM resolution issues with services barrel
 */
import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';

// Mock contexts
const mockCartContext = {
  items: [
    { productId: 1, name: 'Product 1', price: 100000, quantity: 2 },
    { productId: 2, name: 'Product 2', price: 200000, quantity: 1 },
  ],
  total: 400000,
  clearCart: vi.fn(),
};

const mockAuthContext = {
  user: { id: 1, name: 'Test User', email: 'test@test.com' },
};

const mockNotificationContext = {
  notifyToast: vi.fn(),
};

vi.mock('../../../src/contexts', () => ({
  useCart: () => mockCartContext,
  useAuth: () => mockAuthContext,
  useNotification: () => mockNotificationContext,
}));

vi.mock('../../../src/services/http.client', () => ({
  default: {
    get: vi.fn(),
    post: vi.fn(),
    put: vi.fn(),
    patch: vi.fn(),
    delete: vi.fn(),
    request: vi.fn(),
    addRequestInterceptor: vi.fn(),
    addResponseInterceptor: vi.fn(),
  },
  HttpError: class HttpError extends Error {
    constructor(status, data) {
      super(data?.message || 'Error');
      this.status = status;
      this.data = data;
    }
  },
}));

vi.mock('../../../src/utils/storage', () => ({
  tokenStorage: {
    get: vi.fn(),
    set: vi.fn(),
    remove: vi.fn(),
  },
}));

vi.mock('../../../src/services/auth.service', () => ({
  authService: {
    login: vi.fn(),
    register: vi.fn(),
    getProfile: vi.fn(),
    decodeToken: vi.fn(),
    isTokenExpired: vi.fn(() => true),
  },
  default: {
    login: vi.fn(),
    register: vi.fn(),
    getProfile: vi.fn(),
    decodeToken: vi.fn(),
    isTokenExpired: vi.fn(() => true),
  },
}));

vi.mock('../../../src/services', () => ({
  orderService: {
    create: vi.fn(),
  },
  productService: {
    getById: vi.fn(),
  },
  uploadService: {
    getImageUrl: vi.fn((url) => url || ''),
  },
}));

vi.mock('../../../src/components/ui', () => ({
  Card: ({ children, className }) => <div className={className}>{children}</div>,
  Button: ({ children, onClick, disabled, variant, type, loading }) => (
    <button onClick={onClick} disabled={disabled || loading} type={type} data-variant={variant}>
      {loading ? 'Đang xử lý...' : children}
    </button>
  ),
  Input: ({ label, name, value, onChange, error, required, ...props }) => (
    <div>
      <label htmlFor={name}>
        {label}
        {required && '*'}
      </label>
      <input id={name} name={name} value={value} onChange={onChange} {...props} />
      {error && <span className="error">{error}</span>}
    </div>
  ),
  ErrorAlert: ({ message }) => (message ? <div role="alert">{message}</div> : null),
}));

vi.mock('../../../src/utils', () => ({
  formatPrice: (price) => `${price.toLocaleString('vi-VN')}đ`,
}));

// Dynamic imports to avoid ESM resolution issues
let CheckoutPage;
let orderService;
let productService;

beforeAll(async () => {
  const mod = await import('../../../src/components/checkout/CheckoutPage');
  CheckoutPage = mod.CheckoutPage;
  const services = await import('../../../src/services');
  orderService = services.orderService;
  productService = services.productService;
});

describe('CheckoutPage Component', () => {
  const mockOnBack = vi.fn();
  const mockOnSuccess = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
    productService.getById.mockResolvedValue({ stock: 100 });
  });

  describe('Rendering', () => {
    it('should render checkout form', () => {
      render(<CheckoutPage onBack={mockOnBack} onSuccess={mockOnSuccess} />);

      expect(screen.getByLabelText(/họ và tên/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/số điện thoại/i)).toBeInTheDocument();
    });

    it('should show cart items', () => {
      render(<CheckoutPage onBack={mockOnBack} onSuccess={mockOnSuccess} />);

      expect(screen.getByText(/Product 1/)).toBeInTheDocument();
      expect(screen.getByText(/Product 2/)).toBeInTheDocument();
    });

    it('should show total amount', () => {
      render(<CheckoutPage onBack={mockOnBack} onSuccess={mockOnSuccess} />);

      expect(screen.getByText(/400\.000đ/)).toBeInTheDocument();
    });

    it('should pre-fill name from user context', () => {
      render(<CheckoutPage onBack={mockOnBack} onSuccess={mockOnSuccess} />);

      const nameInput = screen.getByDisplayValue('Test User');
      expect(nameInput).toBeInTheDocument();
    });

    it('should show payment method options', () => {
      render(<CheckoutPage onBack={mockOnBack} onSuccess={mockOnSuccess} />);

      // COD and Bank transfer options should be present
      expect(screen.getByText(/thanh toán khi nhận hàng/i)).toBeInTheDocument();
    });
  });

  describe('Form Validation', () => {
    it('should show error for empty required fields', async () => {
      render(<CheckoutPage onBack={mockOnBack} onSuccess={mockOnSuccess} />);

      // Clear the pre-filled name
      const nameInput = screen.getByDisplayValue('Test User');
      fireEvent.change(nameInput, { target: { value: '', name: 'fullName' } });

      // Submit form
      const submitButton = screen.getByRole('button', { name: /đặt hàng/i });
      fireEvent.click(submitButton);

      await waitFor(() => {
        expect(screen.getByText(/Vui lòng nhập họ tên/)).toBeInTheDocument();
      });
    });

    it('should validate phone number format', async () => {
      render(<CheckoutPage onBack={mockOnBack} onSuccess={mockOnSuccess} />);

      const phoneInput = screen.getByLabelText(/số điện thoại/i);
      fireEvent.change(phoneInput, { target: { value: '123', name: 'phone' } });

      const submitButton = screen.getByRole('button', { name: /đặt hàng/i });
      fireEvent.click(submitButton);

      await waitFor(() => {
        expect(screen.getByText(/số điện thoại không hợp lệ/i)).toBeInTheDocument();
      });
    });

    it('should accept valid phone number', async () => {
      render(<CheckoutPage onBack={mockOnBack} onSuccess={mockOnSuccess} />);

      const phoneInput = screen.getByLabelText(/số điện thoại/i);
      fireEvent.change(phoneInput, { target: { value: '0901234567', name: 'phone' } });

      expect(phoneInput.value).toBe('0901234567');
    });

    it('should require province', async () => {
      render(<CheckoutPage onBack={mockOnBack} onSuccess={mockOnSuccess} />);

      const submitButton = screen.getByRole('button', { name: /đặt hàng/i });
      fireEvent.click(submitButton);

      await waitFor(() => {
        expect(screen.getByText(/Vui lòng nhập Tỉnh\/Thành phố/)).toBeInTheDocument();
      });
    });

    it('should require district', async () => {
      render(<CheckoutPage onBack={mockOnBack} onSuccess={mockOnSuccess} />);

      const submitButton = screen.getByRole('button', { name: /đặt hàng/i });
      fireEvent.click(submitButton);

      await waitFor(() => {
        expect(screen.getByText(/Vui lòng nhập Quận\/Huyện/)).toBeInTheDocument();
      });
    });

    it('should require ward', async () => {
      render(<CheckoutPage onBack={mockOnBack} onSuccess={mockOnSuccess} />);

      const submitButton = screen.getByRole('button', { name: /đặt hàng/i });
      fireEvent.click(submitButton);

      await waitFor(() => {
        expect(screen.getByText(/Vui lòng nhập Phường\/Xã/)).toBeInTheDocument();
      });
    });

    it('should require address', async () => {
      render(<CheckoutPage onBack={mockOnBack} onSuccess={mockOnSuccess} />);

      const submitButton = screen.getByRole('button', { name: /đặt hàng/i });
      fireEvent.click(submitButton);

      await waitFor(() => {
        expect(screen.getByText(/Vui lòng nhập địa chỉ cụ thể/)).toBeInTheDocument();
      });
    });
  });

  describe('Form Submission', () => {
    const fillForm = () => {
      fireEvent.change(screen.getByLabelText(/số điện thoại/i), {
        target: { value: '0901234567', name: 'phone' },
      });
      fireEvent.change(screen.getByLabelText(/tỉnh/i), {
        target: { value: 'Hà Nội', name: 'province' },
      });
      fireEvent.change(screen.getByLabelText(/quận/i), {
        target: { value: 'Cầu Giấy', name: 'district' },
      });
      fireEvent.change(screen.getByLabelText(/phường/i), {
        target: { value: 'Dịch Vọng', name: 'ward' },
      });
      fireEvent.change(screen.getByLabelText(/địa chỉ/i), {
        target: { value: '123 Đường ABC', name: 'address' },
      });
    };

    it('should submit order successfully', async () => {
      orderService.create.mockResolvedValueOnce({ id: 1, status: 'pending' });

      render(<CheckoutPage onBack={mockOnBack} onSuccess={mockOnSuccess} />);
      fillForm();

      const submitButton = screen.getByRole('button', { name: /đặt hàng/i });
      fireEvent.click(submitButton);

      await waitFor(() => {
        expect(orderService.create).toHaveBeenCalled();
      });
    });

    it('should clear cart on success', async () => {
      orderService.create.mockResolvedValueOnce({ id: 1 });

      render(<CheckoutPage onBack={mockOnBack} onSuccess={mockOnSuccess} />);
      fillForm();

      const submitButton = screen.getByRole('button', { name: /đặt hàng/i });
      fireEvent.click(submitButton);

      await waitFor(() => {
        expect(mockCartContext.clearCart).toHaveBeenCalled();
      });
    });

    it('should call onSuccess callback', async () => {
      const createdOrder = { id: 1, status: 'pending' };
      orderService.create.mockResolvedValueOnce(createdOrder);

      render(<CheckoutPage onBack={mockOnBack} onSuccess={mockOnSuccess} />);
      fillForm();

      const submitButton = screen.getByRole('button', { name: /đặt hàng/i });
      fireEvent.click(submitButton);

      await waitFor(() => {
        expect(mockOnSuccess).toHaveBeenCalledWith(
          createdOrder,
          expect.any(String),
          expect.any(Object)
        );
      });
    });

    it('should show error on submission failure', async () => {
      orderService.create.mockRejectedValueOnce(new Error('Insufficient stock'));

      render(<CheckoutPage onBack={mockOnBack} onSuccess={mockOnSuccess} />);
      fillForm();

      const submitButton = screen.getByRole('button', { name: /đặt hàng/i });
      fireEvent.click(submitButton);

      await waitFor(() => {
        expect(screen.getByRole('alert')).toBeInTheDocument();
      });
    });

    it('should disable submit button during loading', async () => {
      orderService.create.mockImplementation(
        () => new Promise((resolve) => setTimeout(() => resolve({ id: 1 }), 1000))
      );

      render(<CheckoutPage onBack={mockOnBack} onSuccess={mockOnSuccess} />);
      fillForm();

      const submitButton = screen.getByRole('button', { name: /đặt hàng/i });
      fireEvent.click(submitButton);

      await waitFor(() => {
        expect(screen.getByRole('button', { name: /xử lý/i })).toBeDisabled();
      });
    });
  });

  describe('Payment Methods', () => {
    it('should select COD by default', () => {
      render(<CheckoutPage onBack={mockOnBack} onSuccess={mockOnSuccess} />);

      const codRadio = screen.getByLabelText(/thanh toán khi nhận hàng/i);
      expect(codRadio).toBeChecked();
    });

    it('should allow selecting VNPay', () => {
      render(<CheckoutPage onBack={mockOnBack} onSuccess={mockOnSuccess} />);

      const vnpayRadio = screen.getByLabelText(/thanh toán vnpay/i);
      fireEvent.click(vnpayRadio);

      expect(vnpayRadio).toBeChecked();
    });

    it('should show VNPay info when selected', () => {
      render(<CheckoutPage onBack={mockOnBack} onSuccess={mockOnSuccess} />);

      const vnpayRadio = screen.getByLabelText(/thanh toán vnpay/i);
      fireEvent.click(vnpayRadio);

      expect(screen.getByText(/cổng thanh toán vnpay/i)).toBeInTheDocument();
    });
  });

  describe('Navigation', () => {
    it('should call onBack when clicking back button', () => {
      render(<CheckoutPage onBack={mockOnBack} onSuccess={mockOnSuccess} />);

      const backButton = screen.getByText(/quay lại/i);
      fireEvent.click(backButton);

      expect(mockOnBack).toHaveBeenCalled();
    });
  });
});
