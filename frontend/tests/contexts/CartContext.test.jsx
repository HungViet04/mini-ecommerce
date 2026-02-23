/**
 * CartContext Tests
 * Tests for shopping cart context
 */
import { describe, it, expect, vi } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { CartProvider, useCart } from '../../src/contexts/CartContext';

// Wrapper component for hooks
const wrapper = ({ children }) => <CartProvider>{children}</CartProvider>;

describe('CartContext', () => {
  describe('Initial state', () => {
    it('should have empty items array initially', () => {
      const { result } = renderHook(() => useCart(), { wrapper });

      expect(result.current.items).toEqual([]);
      expect(result.current.itemCount).toBe(0);
      expect(result.current.total).toBe(0);
    });
  });

  describe('addItem', () => {
    it('should add item to cart', () => {
      const { result } = renderHook(() => useCart(), { wrapper });

      act(() => {
        result.current.addItem(
          {
            id: 1,
            name: 'Test Product',
            price: 100000,
          },
          1
        );
      });

      expect(result.current.items).toHaveLength(1);
      expect(result.current.items[0]).toMatchObject({
        productId: 1,
        productName: 'Test Product',
        price: 100000,
        quantity: 1,
      });
    });

    it('should add multiple items to cart', () => {
      const { result } = renderHook(() => useCart(), { wrapper });

      act(() => {
        result.current.addItem({ id: 1, name: 'Product 1', price: 100000 }, 1);
        result.current.addItem({ id: 2, name: 'Product 2', price: 200000 }, 2);
      });

      expect(result.current.items).toHaveLength(2);
      expect(result.current.itemCount).toBe(3);
    });

    it('should update quantity if item already exists', () => {
      const { result } = renderHook(() => useCart(), { wrapper });

      act(() => {
        result.current.addItem({ id: 1, name: 'Test Product', price: 100000 }, 1);
        result.current.addItem({ id: 1, name: 'Test Product', price: 100000 }, 2);
      });

      expect(result.current.items).toHaveLength(1);
      expect(result.current.items[0].quantity).toBe(3);
    });

    it('should use default quantity of 1', () => {
      const { result } = renderHook(() => useCart(), { wrapper });

      act(() => {
        result.current.addItem({ id: 1, name: 'Test Product', price: 100000 });
      });

      expect(result.current.items[0].quantity).toBe(1);
    });
  });

  describe('removeItem', () => {
    it('should remove item by index', () => {
      const { result } = renderHook(() => useCart(), { wrapper });

      act(() => {
        result.current.addItem({ id: 1, name: 'Product 1', price: 100000 }, 1);
        result.current.addItem({ id: 2, name: 'Product 2', price: 200000 }, 1);
      });

      act(() => {
        result.current.removeItem(0);
      });

      expect(result.current.items).toHaveLength(1);
      expect(result.current.items[0].productId).toBe(2);
    });

    it('should handle removing last item', () => {
      const { result } = renderHook(() => useCart(), { wrapper });

      act(() => {
        result.current.addItem({ id: 1, name: 'Test Product', price: 100000 }, 1);
      });

      act(() => {
        result.current.removeItem(0);
      });

      expect(result.current.items).toHaveLength(0);
    });

    it('should do nothing if index is out of bounds', () => {
      const { result } = renderHook(() => useCart(), { wrapper });

      act(() => {
        result.current.addItem({ id: 1, name: 'Test Product', price: 100000 }, 1);
      });

      act(() => {
        result.current.removeItem(5);
      });

      expect(result.current.items).toHaveLength(1);
    });
  });

  describe('updateQuantity', () => {
    it('should update item quantity', () => {
      const { result } = renderHook(() => useCart(), { wrapper });

      act(() => {
        result.current.addItem({ id: 1, name: 'Test Product', price: 100000 }, 1);
      });

      act(() => {
        result.current.updateQuantity(0, 5);
      });

      expect(result.current.items[0].quantity).toBe(5);
    });

    it('should not allow quantity less than 1', () => {
      const { result } = renderHook(() => useCart(), { wrapper });

      act(() => {
        result.current.addItem({ id: 1, name: 'Test Product', price: 100000 }, 1);
      });

      act(() => {
        result.current.updateQuantity(0, 0);
      });

      expect(result.current.items[0].quantity).toBe(1);

      act(() => {
        result.current.updateQuantity(0, -5);
      });

      expect(result.current.items[0].quantity).toBe(1);
    });
  });

  describe('clearCart', () => {
    it('should remove all items', () => {
      const { result } = renderHook(() => useCart(), { wrapper });

      act(() => {
        result.current.addItem({ id: 1, name: 'Product 1', price: 100000 }, 1);
        result.current.addItem({ id: 2, name: 'Product 2', price: 200000 }, 2);
      });

      expect(result.current.items).toHaveLength(2);

      act(() => {
        result.current.clearCart();
      });

      expect(result.current.items).toHaveLength(0);
      expect(result.current.itemCount).toBe(0);
      expect(result.current.total).toBe(0);
    });
  });

  describe('total calculation', () => {
    it('should calculate total correctly', () => {
      const { result } = renderHook(() => useCart(), { wrapper });

      act(() => {
        result.current.addItem({ id: 1, name: 'Product 1', price: 100000 }, 2);
        result.current.addItem({ id: 2, name: 'Product 2', price: 50000 }, 3);
      });

      // 100000 * 2 + 50000 * 3 = 350000
      expect(result.current.total).toBe(350000);
    });

    it('should update total when quantity changes', () => {
      const { result } = renderHook(() => useCart(), { wrapper });

      act(() => {
        result.current.addItem({ id: 1, name: 'Product 1', price: 100000 }, 1);
      });

      expect(result.current.total).toBe(100000);

      act(() => {
        result.current.updateQuantity(0, 3);
      });

      expect(result.current.total).toBe(300000);
    });

    it('should update total when item is removed', () => {
      const { result } = renderHook(() => useCart(), { wrapper });

      act(() => {
        result.current.addItem({ id: 1, name: 'Product 1', price: 100000 }, 1);
        result.current.addItem({ id: 2, name: 'Product 2', price: 200000 }, 1);
      });

      expect(result.current.total).toBe(300000);

      act(() => {
        result.current.removeItem(0);
      });

      expect(result.current.total).toBe(200000);
    });
  });

  describe('itemCount calculation', () => {
    it('should calculate item count correctly', () => {
      const { result } = renderHook(() => useCart(), { wrapper });

      act(() => {
        result.current.addItem({ id: 1, name: 'Product 1', price: 100000 }, 2);
        result.current.addItem({ id: 2, name: 'Product 2', price: 50000 }, 3);
      });

      expect(result.current.itemCount).toBe(5);
    });
  });

  describe('useCart hook', () => {
    it('should throw error when used outside provider', () => {
      // This should throw because there's no provider
      expect(() => {
        renderHook(() => useCart());
      }).toThrow('useCart must be used within a CartProvider');
    });
  });
});

