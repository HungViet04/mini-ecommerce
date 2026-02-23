/**
 * CartSummary Component Tests
 * Tests for cart summary and checkout
 */
import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { CartSummary } from '../../../src/components/cart/CartSummary';

// Mock dependencies
const mockCartContext = {
  items: [],
  total: 0,
  itemCount: 0,
  updateQuantity: vi.fn(),
  removeItem: vi.fn(),
  clearCart: vi.fn(),
};

const mockAuthContext = {
  isAuthenticated: true,
};

vi.mock('../../../src/contexts', () => ({
  useCart: () => mockCartContext,
  useAuth: () => mockAuthContext,
}));

vi.mock('../../../src/components/ui', () => ({
  Card: ({ children, className }) => <div className={className}>{children}</div>,
  Button: ({ children, onClick, variant, className }) => (
    <button onClick={onClick} className={`${variant} ${className}`}>
      {children}
    </button>
  ),
}));

vi.mock('../../../src/utils', () => ({
  formatPrice: price => `${price.toLocaleString('vi-VN')}đ`,
}));

vi.mock('../../../src/components/cart/CartItem', () => ({
  CartItem: ({ item, index, onUpdateQuantity, onRemove }) => (
    <div data-testid={`cart-item-${index}`}>
      {item.productName} - {item.quantity}
    </div>
  ),
}));

describe('CartSummary Component', () => {
  const mockOnCheckout = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
    mockCartContext.items = [];
    mockCartContext.total = 0;
    mockCartContext.itemCount = 0;
    mockAuthContext.isAuthenticated = true;
  });

  describe('Empty Cart', () => {
    it('should show empty cart message', () => {
      render(<CartSummary onCheckout={mockOnCheckout} />);

      expect(screen.getByText('Giỏ hàng của bạn đang trống')).toBeInTheDocument();
    });

    it('should show shopping hint', () => {
      render(<CartSummary onCheckout={mockOnCheckout} />);

      expect(screen.getByText('Thêm sản phẩm để bắt đầu mua sắm')).toBeInTheDocument();
    });

    it('should show cart icon', () => {
      render(<CartSummary onCheckout={mockOnCheckout} />);

      expect(screen.getByText('🛒')).toBeInTheDocument();
    });

    it('should not show checkout button when empty', () => {
      render(<CartSummary onCheckout={mockOnCheckout} />);

      expect(screen.queryByText('Thanh Toán')).not.toBeInTheDocument();
    });
  });

  describe('Cart With Items', () => {
    beforeEach(() => {
      mockCartContext.items = [
        { productId: 1, productName: 'Product 1', price: 100000, quantity: 2 },
        { productId: 2, productName: 'Product 2', price: 200000, quantity: 1 },
      ];
      mockCartContext.total = 400000;
      mockCartContext.itemCount = 3;
    });

    it('should show cart title with item count', () => {
      render(<CartSummary onCheckout={mockOnCheckout} />);

      expect(screen.getByText('Giỏ Hàng (3 sản phẩm)')).toBeInTheDocument();
    });

    it('should show total amount', () => {
      render(<CartSummary onCheckout={mockOnCheckout} />);

      expect(screen.getByText('400.000đ')).toBeInTheDocument();
    });

    it('should show checkout button', () => {
      render(<CartSummary onCheckout={mockOnCheckout} />);

      expect(screen.getByText('Thanh Toán')).toBeInTheDocument();
    });

    it('should show clear cart button', () => {
      render(<CartSummary onCheckout={mockOnCheckout} />);

      expect(screen.getByText('Xóa Giỏ Hàng')).toBeInTheDocument();
    });

    it('should render cart items', () => {
      render(<CartSummary onCheckout={mockOnCheckout} />);

      expect(screen.getByTestId('cart-item-0')).toBeInTheDocument();
      expect(screen.getByTestId('cart-item-1')).toBeInTheDocument();
    });
  });

  describe('Checkout', () => {
    beforeEach(() => {
      mockCartContext.items = [
        { productId: 1, productName: 'Product 1', price: 100000, quantity: 1 },
      ];
      mockCartContext.total = 100000;
      mockCartContext.itemCount = 1;
    });

    it('should call onCheckout when authenticated', () => {
      mockAuthContext.isAuthenticated = true;

      render(<CartSummary onCheckout={mockOnCheckout} />);

      fireEvent.click(screen.getByText('Thanh Toán'));

      expect(mockOnCheckout).toHaveBeenCalled();
    });

    it('should show alert when not authenticated', () => {
      mockAuthContext.isAuthenticated = false;
      const alertMock = vi.spyOn(window, 'alert').mockImplementation(() => {});

      render(<CartSummary onCheckout={mockOnCheckout} />);

      fireEvent.click(screen.getByText('Thanh Toán'));

      expect(alertMock).toHaveBeenCalledWith('Vui lòng đăng nhập để đặt hàng');
      expect(mockOnCheckout).not.toHaveBeenCalled();

      alertMock.mockRestore();
    });

    it('should work without onCheckout prop', () => {
      mockAuthContext.isAuthenticated = true;

      render(<CartSummary />);

      // Should not throw error
      fireEvent.click(screen.getByText('Thanh Toán'));
    });
  });

  describe('Clear Cart', () => {
    beforeEach(() => {
      mockCartContext.items = [
        { productId: 1, productName: 'Product 1', price: 100000, quantity: 1 },
      ];
      mockCartContext.total = 100000;
      mockCartContext.itemCount = 1;
    });

    it('should call clearCart when clicking clear button', () => {
      render(<CartSummary onCheckout={mockOnCheckout} />);

      fireEvent.click(screen.getByText('Xóa Giỏ Hàng'));

      expect(mockCartContext.clearCart).toHaveBeenCalled();
    });
  });

  describe('Cart Item Interactions', () => {
    beforeEach(() => {
      mockCartContext.items = [
        { productId: 1, productName: 'Product 1', price: 100000, quantity: 2 },
      ];
      mockCartContext.total = 200000;
      mockCartContext.itemCount = 2;
    });

    it('should pass updateQuantity to CartItem', () => {
      render(<CartSummary onCheckout={mockOnCheckout} />);

      // CartItem is mocked, so we just check the component renders
      expect(screen.getByTestId('cart-item-0')).toBeInTheDocument();
    });

    it('should pass removeItem to CartItem', () => {
      render(<CartSummary onCheckout={mockOnCheckout} />);

      expect(screen.getByTestId('cart-item-0')).toBeInTheDocument();
    });
  });

  describe('Multiple Items', () => {
    it('should render all cart items', () => {
      mockCartContext.items = [
        { productId: 1, productName: 'Product 1', price: 100000, quantity: 1 },
        { productId: 2, productName: 'Product 2', price: 200000, quantity: 2 },
        { productId: 3, productName: 'Product 3', price: 300000, quantity: 3 },
      ];
      mockCartContext.total = 1400000;
      mockCartContext.itemCount = 6;

      render(<CartSummary onCheckout={mockOnCheckout} />);

      expect(screen.getByText('Giỏ Hàng (6 sản phẩm)')).toBeInTheDocument();
      expect(screen.getByTestId('cart-item-0')).toBeInTheDocument();
      expect(screen.getByTestId('cart-item-1')).toBeInTheDocument();
      expect(screen.getByTestId('cart-item-2')).toBeInTheDocument();
    });
  });

  describe('Price Formatting', () => {
    it('should format total correctly', () => {
      mockCartContext.items = [
        { productId: 1, productName: 'Product', price: 1000000, quantity: 5 },
      ];
      mockCartContext.total = 5000000;
      mockCartContext.itemCount = 5;

      render(<CartSummary onCheckout={mockOnCheckout} />);

      expect(screen.getByText('5.000.000đ')).toBeInTheDocument();
    });

    it('should handle zero total', () => {
      mockCartContext.items = [{ productId: 1, productName: 'Free Item', price: 0, quantity: 1 }];
      mockCartContext.total = 0;
      mockCartContext.itemCount = 1;

      render(<CartSummary onCheckout={mockOnCheckout} />);

      expect(screen.getByText('0đ')).toBeInTheDocument();
    });
  });
});

