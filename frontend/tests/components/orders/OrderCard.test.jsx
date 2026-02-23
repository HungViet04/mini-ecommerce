/**
 * OrderCard Component Tests
 * Tests for order display
 */
import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { OrderCard } from '../../../src/components/orders/OrderCard';

// Mock dependencies
vi.mock('../../../src/components/ui', () => ({
  Card: ({ children, className, onClick }) => (
    <div className={className} onClick={onClick} data-testid="order-card">
      {children}
    </div>
  ),
  Button: ({ children, onClick, variant, size }) => (
    <button onClick={onClick} data-variant={variant} data-size={size}>
      {children}
    </button>
  ),
}));

vi.mock('../../../src/utils', () => ({
  formatPrice: price => `${price?.toLocaleString('vi-VN')}đ`,
  formatDate: date => new Date(date).toLocaleDateString('vi-VN'),
}));

describe('OrderCard Component', () => {
  const mockOrder = {
    id: 1,
    status: 'pending',
    total: 500000,
    createdAt: '2024-01-15T10:30:00Z',
    items: [
      { productId: 1, productName: 'Product 1', price: 100000, quantity: 2 },
      { productId: 2, productName: 'Product 2', price: 300000, quantity: 1 },
    ],
  };

  const mockOnCancel = vi.fn();
  const mockOnConfirmDelivery = vi.fn();
  const mockOnViewDetail = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('Rendering', () => {
    it('should render order ID', () => {
      render(<OrderCard order={mockOrder} />);

      expect(screen.getByText(/Đơn hàng #1/)).toBeInTheDocument();
    });

    it('should render order status', () => {
      render(<OrderCard order={mockOrder} />);

      expect(screen.getByText('Chờ thanh toán')).toBeInTheDocument();
    });

    it('should render order total', () => {
      render(<OrderCard order={mockOrder} />);

      expect(screen.getByText('500.000đ')).toBeInTheDocument();
    });

    it('should render order date', () => {
      render(<OrderCard order={mockOrder} />);

      expect(screen.getByText(/15\/1\/2024/)).toBeInTheDocument();
    });

    it('should render order items', () => {
      render(<OrderCard order={mockOrder} />);

      expect(screen.getByText(/Product 1/)).toBeInTheDocument();
      expect(screen.getByText(/Product 2/)).toBeInTheDocument();
    });

    it('should show quantity for each item', () => {
      render(<OrderCard order={mockOrder} />);

      expect(screen.getByText(/× 2/)).toBeInTheDocument();
      expect(screen.getByText(/× 1/)).toBeInTheDocument();
    });
  });

  describe('Status Display', () => {
    const statuses = [
      { status: 'pending', label: 'Chờ thanh toán' },
      { status: 'paid', label: 'Đã thanh toán' },
      { status: 'shipped', label: 'Đang giao hàng' },
      { status: 'delivered', label: 'Đã nhận hàng' },
      { status: 'cancelled', label: 'Đã hủy' },
    ];

    statuses.forEach(({ status, label }) => {
      it(`should show "${label}" for status "${status}"`, () => {
        const order = { ...mockOrder, status };
        render(<OrderCard order={order} />);

        expect(screen.getByText(label)).toBeInTheDocument();
      });
    });
  });

  describe('Cancel Button', () => {
    it('should show cancel button for pending orders', () => {
      render(<OrderCard order={mockOrder} onCancel={mockOnCancel} />);

      expect(screen.getByText('Hủy Đơn Hàng')).toBeInTheDocument();
    });

    it('should not show cancel button for non-pending orders', () => {
      const shippedOrder = { ...mockOrder, status: 'shipped' };
      render(<OrderCard order={shippedOrder} onCancel={mockOnCancel} />);

      expect(screen.queryByText('Hủy Đơn Hàng')).not.toBeInTheDocument();
    });

    it('should call onCancel with order ID', () => {
      render(<OrderCard order={mockOrder} onCancel={mockOnCancel} />);

      fireEvent.click(screen.getByText('Hủy Đơn Hàng'));

      expect(mockOnCancel).toHaveBeenCalledWith(1);
    });

    it('should not show cancel button without onCancel prop', () => {
      render(<OrderCard order={mockOrder} />);

      expect(screen.queryByText('Hủy Đơn Hàng')).not.toBeInTheDocument();
    });
  });

  describe('Confirm Delivery Button', () => {
    it('should show confirm button for shipped orders', () => {
      const shippedOrder = { ...mockOrder, status: 'shipped' };
      render(<OrderCard order={shippedOrder} onConfirmDelivery={mockOnConfirmDelivery} />);

      expect(screen.getByText(/Đã Nhận Hàng/)).toBeInTheDocument();
    });

    it('should not show confirm button for non-shipped orders', () => {
      render(<OrderCard order={mockOrder} onConfirmDelivery={mockOnConfirmDelivery} />);

      expect(screen.queryByText(/Đã Nhận Hàng/)).not.toBeInTheDocument();
    });

    it('should call onConfirmDelivery with order ID', () => {
      const shippedOrder = { ...mockOrder, status: 'shipped' };
      render(<OrderCard order={shippedOrder} onConfirmDelivery={mockOnConfirmDelivery} />);

      fireEvent.click(screen.getByText(/Đã Nhận Hàng/));

      expect(mockOnConfirmDelivery).toHaveBeenCalledWith(1);
    });
  });

  describe('View Detail Button', () => {
    it('should always show view detail button', () => {
      render(<OrderCard order={mockOrder} onViewDetail={mockOnViewDetail} />);

      expect(screen.getByText('Xem Chi Tiết')).toBeInTheDocument();
    });

    it('should call onViewDetail with order', () => {
      render(<OrderCard order={mockOrder} onViewDetail={mockOnViewDetail} />);

      fireEvent.click(screen.getByText('Xem Chi Tiết'));

      expect(mockOnViewDetail).toHaveBeenCalledWith(mockOrder);
    });
  });

  describe('Card Click', () => {
    it('should call onViewDetail when clicking card', () => {
      render(<OrderCard order={mockOrder} onViewDetail={mockOnViewDetail} />);

      fireEvent.click(screen.getByTestId('order-card'));

      expect(mockOnViewDetail).toHaveBeenCalledWith(mockOrder);
    });
  });

  describe('Payment Hint', () => {
    it('should show payment hint for pending orders', () => {
      render(<OrderCard order={mockOrder} />);

      expect(screen.getByText(/Nhấn để xem mã QR/)).toBeInTheDocument();
    });

    it('should not show payment hint for paid orders', () => {
      const paidOrder = { ...mockOrder, status: 'paid' };
      render(<OrderCard order={paidOrder} />);

      expect(screen.queryByText(/Nhấn để xem mã QR/)).not.toBeInTheDocument();
    });
  });

  describe('Empty Items', () => {
    it('should handle empty items array', () => {
      const orderWithoutItems = { ...mockOrder, items: [] };
      render(<OrderCard order={orderWithoutItems} />);

      expect(screen.queryByText('Sản phẩm:')).not.toBeInTheDocument();
    });

    it('should show fallback product name when productName is missing', () => {
      const orderWithMissingName = {
        ...mockOrder,
        items: [{ productId: 99, price: 100000, quantity: 1 }],
      };
      render(<OrderCard order={orderWithMissingName} />);

      expect(screen.getByText(/Sản phẩm #99/)).toBeInTheDocument();
    });
  });
});

