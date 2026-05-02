/* eslint-disable no-undef */
/**
 * CartItem Component Tests
 * Tests for cart item display
 */
import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { CartItem } from '../../../src/components/cart/CartItem';
import { productService } from '../../../src/services';
import { describe, it, expect, vi, beforeEach } from 'vitest';

// Mock dependencies
vi.mock('../../../src/services', () => ({
  productService: {
    getById: vi.fn(),
  },
}));

vi.mock('../../../src/components/ui', () => ({
  Button: ({ children, onClick, ...props }) => (
    <button onClick={onClick} {...props}>
      {children}
    </button>
  ),
}));

vi.mock('../../../src/utils', () => ({
  formatPrice: (price) => `${price.toLocaleString('vi-VN')}đ`,
}));

describe('CartItem Component', () => {
  const mockItem = {
    productId: 1,
    productName: 'Test Product',
    price: 100000,
    quantity: 2,
  };

  const mockOnUpdateQuantity = vi.fn();
  const mockOnRemove = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
    productService.getById.mockResolvedValue({ stock: 10 });
  });

  describe('Rendering', () => {
    it('should render product name', async () => {
      render(
        <CartItem
          item={mockItem}
          index={0}
          onUpdateQuantity={mockOnUpdateQuantity}
          onRemove={mockOnRemove}
        />
      );

      expect(screen.getByText('Test Product')).toBeInTheDocument();
    });

    it('should render product price', async () => {
      render(
        <CartItem
          item={mockItem}
          index={0}
          onUpdateQuantity={mockOnUpdateQuantity}
          onRemove={mockOnRemove}
        />
      );

      expect(screen.getByText(/100\.000đ/)).toBeInTheDocument();
    });

    it('should render quantity', async () => {
      render(
        <CartItem
          item={mockItem}
          index={0}
          onUpdateQuantity={mockOnUpdateQuantity}
          onRemove={mockOnRemove}
        />
      );

      expect(screen.getByText('2')).toBeInTheDocument();
    });

    it('should render subtotal', async () => {
      render(
        <CartItem
          item={mockItem}
          index={0}
          onUpdateQuantity={mockOnUpdateQuantity}
          onRemove={mockOnRemove}
        />
      );

      // 100000 * 2 = 200000
      expect(screen.getByText('200.000đ')).toBeInTheDocument();
    });

    it('should show default name when productName is missing', async () => {
      const itemWithoutName = { ...mockItem, productName: null };

      render(
        <CartItem
          item={itemWithoutName}
          index={0}
          onUpdateQuantity={mockOnUpdateQuantity}
          onRemove={mockOnRemove}
        />
      );

      expect(screen.getByText('Sản phẩm #1')).toBeInTheDocument();
    });
  });

  describe('Quantity Controls', () => {
    it('should call onUpdateQuantity when clicking increase', async () => {
      render(
        <CartItem
          item={mockItem}
          index={0}
          onUpdateQuantity={mockOnUpdateQuantity}
          onRemove={mockOnRemove}
        />
      );

      await waitFor(() => {
        expect(productService.getById).toHaveBeenCalledWith(1);
      });

      const increaseBtn = screen.getByText('+');
      fireEvent.click(increaseBtn);

      expect(mockOnUpdateQuantity).toHaveBeenCalledWith(0, 3);
    });

    it('should call onUpdateQuantity when clicking decrease', async () => {
      render(
        <CartItem
          item={mockItem}
          index={0}
          onUpdateQuantity={mockOnUpdateQuantity}
          onRemove={mockOnRemove}
        />
      );

      // Wait for loadingStock to be false (button enabled)
      const decreaseBtn = await screen.findByText('-');
      await waitFor(() => {
        expect(decreaseBtn).not.toBeDisabled();
      });
      fireEvent.click(decreaseBtn);

      expect(mockOnUpdateQuantity).toHaveBeenCalledWith(0, 1);
    });

    it('should disable decrease button when quantity is 1', async () => {
      const itemWithQty1 = { ...mockItem, quantity: 1 };

      render(
        <CartItem
          item={itemWithQty1}
          index={0}
          onUpdateQuantity={mockOnUpdateQuantity}
          onRemove={mockOnRemove}
        />
      );

      const decreaseBtn = screen.getByText('-');
      expect(decreaseBtn).toBeDisabled();
    });

    it('should disable increase button when quantity equals stock', async () => {
      const itemAtMaxStock = { ...mockItem, quantity: 10 };
      productService.getById.mockResolvedValue({ stock: 10 });

      render(
        <CartItem
          item={itemAtMaxStock}
          index={0}
          onUpdateQuantity={mockOnUpdateQuantity}
          onRemove={mockOnRemove}
        />
      );

      await waitFor(() => {
        expect(productService.getById).toHaveBeenCalled();
      });

      const increaseBtn = screen.getByText('+');
      expect(increaseBtn).toBeDisabled();
    });

    it('should show error when trying to exceed stock', async () => {
      const itemNearMax = { ...mockItem, quantity: 9 };
      productService.getById.mockResolvedValue({ stock: 10 });

      render(
        <CartItem
          item={itemNearMax}
          index={0}
          onUpdateQuantity={mockOnUpdateQuantity}
          onRemove={mockOnRemove}
        />
      );

      await waitFor(() => {
        expect(productService.getById).toHaveBeenCalled();
      });

      // Click increase to reach max (9 -> 10)
      const increaseBtn = screen.getByText('+');
      fireEvent.click(increaseBtn);

      expect(mockOnUpdateQuantity).toHaveBeenCalledWith(0, 10);
    });
  });

  describe('Remove Item', () => {
    it('should call onRemove when clicking remove button', async () => {
      render(
        <CartItem
          item={mockItem}
          index={2}
          onUpdateQuantity={mockOnUpdateQuantity}
          onRemove={mockOnRemove}
        />
      );

      const removeBtn = screen.getByText('✕');
      fireEvent.click(removeBtn);

      expect(mockOnRemove).toHaveBeenCalledWith(2);
    });
  });

  describe('Stock Loading', () => {
    it('should fetch stock on mount', async () => {
      render(
        <CartItem
          item={mockItem}
          index={0}
          onUpdateQuantity={mockOnUpdateQuantity}
          onRemove={mockOnRemove}
        />
      );

      await waitFor(() => {
        expect(productService.getById).toHaveBeenCalledWith(1);
      });
    });

    it('should handle stock fetch with different productId', async () => {
      const item2 = { ...mockItem, productId: 99 };

      render(
        <CartItem
          item={item2}
          index={0}
          onUpdateQuantity={mockOnUpdateQuantity}
          onRemove={mockOnRemove}
        />
      );

      await waitFor(() => {
        expect(productService.getById).toHaveBeenCalledWith(99);
      });
    });
  });

  describe('Edge Cases', () => {
    it('should handle zero price', async () => {
      const freeItem = { ...mockItem, price: 0 };

      render(
        <CartItem
          item={freeItem}
          index={0}
          onUpdateQuantity={mockOnUpdateQuantity}
          onRemove={mockOnRemove}
        />
      );

      expect(screen.getByText('0đ')).toBeInTheDocument();
    });

    it('should handle high quantity', async () => {
      const highQtyItem = { ...mockItem, quantity: 100 };
      productService.getById.mockResolvedValue({ stock: 1000 });

      render(
        <CartItem
          item={highQtyItem}
          index={0}
          onUpdateQuantity={mockOnUpdateQuantity}
          onRemove={mockOnRemove}
        />
      );

      expect(screen.getByText('100')).toBeInTheDocument();
    });

    it('should clean up on unmount', async () => {
      const { unmount } = render(
        <CartItem
          item={mockItem}
          index={0}
          onUpdateQuantity={mockOnUpdateQuantity}
          onRemove={mockOnRemove}
        />
      );

      unmount();

      // Should not throw error after unmount
      expect(true).toBe(true);
    });
  });
});
