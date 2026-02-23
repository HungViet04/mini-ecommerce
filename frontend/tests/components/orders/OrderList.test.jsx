/**
 * OrderList Component Tests
 * Tests for order list display (container component)
 */
import React from 'react';
import { render, screen } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { OrderList } from '../../../src/components/orders/OrderList';

// Mock hooks
const mockUseOrders = vi.fn();
const mockUseAuth = vi.fn();

vi.mock('../../../src/hooks', () => ({
  useOrders: (...args) => mockUseOrders(...args),
}));

vi.mock('../../../src/contexts', () => ({
  useAuth: () => mockUseAuth(),
}));

// Mock OrderCard component
vi.mock('../../../src/components/orders/OrderCard', () => ({
  OrderCard: ({ order, onCancel, onConfirmDelivery, onViewDetail }) => (
    <div data-testid={`order-${order.id}`}>
      <span>Order #{order.id}</span>
      <span>{order.status}</span>
      {onCancel && <button onClick={() => onCancel(order.id)}>Cancel</button>}
      {onConfirmDelivery && (
        <button onClick={() => onConfirmDelivery(order.id)}>Confirm</button>
      )}
      {onViewDetail && <button onClick={() => onViewDetail(order)}>Detail</button>}
    </div>
  ),
}));

// Mock OrderDetail component
vi.mock('../../../src/components/orders/OrderDetail', () => ({
  OrderDetail: () => <div data-testid="order-detail">Order Detail</div>,
}));

// Mock UI components
vi.mock('../../../src/components/ui', () => ({
  Loading: ({ text }) => <div data-testid="loading">{text || 'Loading...'}</div>,
  ErrorAlert: ({ message }) => (message ? <div role="alert">{message}</div> : null),
}));

describe('OrderList Component', () => {
  const mockOrders = [
    { id: 1, status: 'pending', total: 100000 },
    { id: 2, status: 'shipped', total: 200000 },
    { id: 3, status: 'delivered', total: 300000 },
  ];

  beforeEach(() => {
    vi.clearAllMocks();
    mockUseAuth.mockReturnValue({ isAuthenticated: true });
    mockUseOrders.mockReturnValue({
      orders: mockOrders,
      loading: false,
      error: null,
      cancelOrder: vi.fn(),
      confirmDelivery: vi.fn(),
    });
  });

  describe('Rendering', () => {
    it('should render all orders', () => {
      render(<OrderList />);

      expect(screen.getByTestId('order-1')).toBeInTheDocument();
      expect(screen.getByTestId('order-2')).toBeInTheDocument();
      expect(screen.getByTestId('order-3')).toBeInTheDocument();
    });

    it('should show loading state', () => {
      mockUseOrders.mockReturnValue({
        orders: [],
        loading: true,
        error: null,
        cancelOrder: vi.fn(),
        confirmDelivery: vi.fn(),
      });

      render(<OrderList />);

      expect(screen.getByTestId('loading')).toBeInTheDocument();
    });

    it('should show empty message when no orders', () => {
      mockUseOrders.mockReturnValue({
        orders: [],
        loading: false,
        error: null,
        cancelOrder: vi.fn(),
        confirmDelivery: vi.fn(),
      });

      render(<OrderList />);

      expect(screen.getByText(/chưa có đơn hàng/i)).toBeInTheDocument();
    });

    it('should show error message', () => {
      mockUseOrders.mockReturnValue({
        orders: [],
        loading: false,
        error: 'Failed to load orders',
        cancelOrder: vi.fn(),
        confirmDelivery: vi.fn(),
      });

      render(<OrderList />);

      expect(screen.getByText(/Failed to load orders/)).toBeInTheDocument();
    });
  });

  describe('Order Actions', () => {
    it('should pass onCancel to OrderCard', () => {
      render(<OrderList />);

      const cancelButtons = screen.getAllByText('Cancel');
      expect(cancelButtons.length).toBeGreaterThan(0);
    });

    it('should pass onConfirmDelivery to OrderCard', () => {
      render(<OrderList />);

      const confirmButtons = screen.getAllByText('Confirm');
      expect(confirmButtons.length).toBeGreaterThan(0);
    });

    it('should pass onViewDetail to OrderCard', () => {
      render(<OrderList />);

      const detailButtons = screen.getAllByText('Detail');
      expect(detailButtons.length).toBeGreaterThan(0);
    });
  });

  describe('Authentication', () => {
    it('should show login prompt when not authenticated', () => {
      mockUseAuth.mockReturnValue({ isAuthenticated: false });

      render(<OrderList />);

      expect(
        screen.getByText(/Vui lòng đăng nhập để xem đơn hàng/),
      ).toBeInTheDocument();
    });
  });

  describe('Order Filtering', () => {
    it('should render orders in correct order', () => {
      render(<OrderList />);

      const orders = screen.getAllByTestId(/order-\d/);
      expect(orders).toHaveLength(3);
    });
  });
});

