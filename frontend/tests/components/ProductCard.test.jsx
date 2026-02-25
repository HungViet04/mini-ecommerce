/**
 * ProductCard Component Tests
 * Comprehensive tests for product card display
 */
import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { ProductCard } from '../../src/components/products/ProductCard';

// Mock http.client to prevent import error from barrel
vi.mock('../../src/services/http.client', () => ({
  default: {
    get: vi.fn(),
    post: vi.fn(),
    put: vi.fn(),
    delete: vi.fn(),
    addRequestInterceptor: vi.fn(),
    addResponseInterceptor: vi.fn(),
  },
  HttpError: class HttpError extends Error {
    constructor(status, data) {
      super(data?.message || 'Error');
      this.status = status;
    }
  },
}));

// Mock uploadService
vi.mock('../../src/services', () => ({
  uploadService: {
    getImageUrl: vi.fn((url) => (url ? `http://localhost:3000${url}` : null)),
  },
}));

// Mock useAuth hook
vi.mock('../../src/contexts', async () => {
  const actual = await vi.importActual('../../src/contexts');
  return {
    ...actual,
    useAuth: vi.fn(() => ({ isAdmin: false })),
  };
});

const renderProductCard = (props = {}) => {
  const defaultProduct = {
    id: 1,
    name: 'iPhone 15 Pro',
    description: 'Latest iPhone with advanced features',
    image_url: '/images/iphone.jpg',
    price: 28990000,
    stock: 10,
    category_name: 'Điện thoại',
  };

  const defaultProps = {
    product: defaultProduct,
    onAddToCart: vi.fn(),
    onViewDetail: vi.fn(),
    showActions: true,
    ...props,
  };

  return render(<ProductCard {...defaultProps} />);
};

describe('ProductCard', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('rendering', () => {
    it('should render product name', () => {
      renderProductCard();
      expect(screen.getByText('iPhone 15 Pro')).toBeInTheDocument();
    });

    it('should render product price formatted', () => {
      renderProductCard();
      // Check for formatted Vietnamese price
      expect(screen.getByText(/28.*990.*000|28,990,000/)).toBeInTheDocument();
    });

    it('should render category name', () => {
      renderProductCard();
      expect(screen.getByText('Điện thoại')).toBeInTheDocument();
    });

    it('should render stock status for in-stock product', () => {
      renderProductCard();
      expect(screen.getByText(/Còn 10 sản phẩm/)).toBeInTheDocument();
    });

    it('should render out of stock message', () => {
      const outOfStockProduct = {
        id: 2,
        name: 'Out of Stock Product',
        price: 1000000,
        stock: 0,
      };
      renderProductCard({ product: outOfStockProduct });
      expect(screen.getByText('Hết hàng')).toBeInTheDocument();
    });

    it('should render product image when image_url provided', () => {
      renderProductCard();
      const img = screen.getByRole('img');
      expect(img).toHaveAttribute('alt', 'iPhone 15 Pro');
    });

    it('should render emoji placeholder when no image', () => {
      const noImageProduct = {
        id: 3,
        name: 'No Image Product',
        price: 500000,
        stock: 5,
        image_url: null,
      };
      renderProductCard({ product: noImageProduct });
      expect(screen.getByText('📦')).toBeInTheDocument();
    });
  });

  describe('interactions', () => {
    it('should call onViewDetail when card is clicked', () => {
      const onViewDetail = vi.fn();
      const product = {
        id: 1,
        name: 'Test Product',
        price: 100000,
        stock: 5,
      };
      renderProductCard({ product, onViewDetail });

      const card = screen.getByText('Test Product').closest('.product-card');
      fireEvent.click(card);

      expect(onViewDetail).toHaveBeenCalledWith(product);
    });

    it('should not throw when onViewDetail is not provided', () => {
      const product = {
        id: 1,
        name: 'Test Product',
        price: 100000,
        stock: 5,
      };
      renderProductCard({ product, onViewDetail: undefined });

      const card = screen.getByText('Test Product').closest('.product-card');
      expect(() => fireEvent.click(card)).not.toThrow();
    });
  });

  describe('stock display', () => {
    it('should show in-stock class for products with stock', () => {
      renderProductCard();
      const stockElement = screen.getByText(/Còn 10 sản phẩm/);
      expect(stockElement).toHaveClass('in-stock');
    });

    it('should show out-of-stock class for products without stock', () => {
      const outOfStockProduct = {
        id: 2,
        name: 'No Stock',
        price: 100000,
        stock: 0,
      };
      renderProductCard({ product: outOfStockProduct });
      const stockElement = screen.getByText('Hết hàng');
      expect(stockElement).toHaveClass('out-of-stock');
    });

    it('should show correct stock count', () => {
      const productWithFewStock = {
        id: 3,
        name: 'Low Stock',
        price: 100000,
        stock: 3,
      };
      renderProductCard({ product: productWithFewStock });
      expect(screen.getByText(/Còn 3 sản phẩm/)).toBeInTheDocument();
    });

    it('should handle stock of 1', () => {
      const productWithOneStock = {
        id: 4,
        name: 'Single Stock',
        price: 100000,
        stock: 1,
      };
      renderProductCard({ product: productWithOneStock });
      expect(screen.getByText(/Còn 1 sản phẩm/)).toBeInTheDocument();
    });
  });

  describe('image handling', () => {
    it('should use uploadService to get full image URL', async () => {
      const { uploadService } = await import('../../src/services');
      renderProductCard();
      expect(uploadService.getImageUrl).toHaveBeenCalledWith('/images/iphone.jpg');
    });

    it('should handle empty image_url', () => {
      const productNoImage = {
        id: 5,
        name: 'No Image',
        price: 100000,
        stock: 5,
        image_url: '',
      };
      renderProductCard({ product: productNoImage });
      expect(screen.getByText('📦')).toBeInTheDocument();
    });
  });

  describe('category display', () => {
    it('should display category when provided', () => {
      renderProductCard();
      expect(screen.getByText('Điện thoại')).toBeInTheDocument();
    });

    it('should not show category element when not provided', () => {
      const productNoCategory = {
        id: 6,
        name: 'No Category Product',
        price: 100000,
        stock: 5,
        category_name: null,
      };
      renderProductCard({ product: productNoCategory });
      expect(document.querySelector('.product-category')).toBeNull();
    });
  });

  describe('price formatting', () => {
    it('should format large prices correctly', () => {
      const expensiveProduct = {
        id: 7,
        name: 'Expensive Product',
        price: 99999999,
        stock: 1,
      };
      renderProductCard({ product: expensiveProduct });
      // Should contain formatted number
      expect(screen.getByText(/99.*999.*999/)).toBeInTheDocument();
    });

    it('should format zero price', () => {
      const freeProduct = {
        id: 8,
        name: 'Free Product',
        price: 0,
        stock: 100,
      };
      renderProductCard({ product: freeProduct });
      // Price is formatted by formatPrice, check it renders without error
      const priceEl = document.querySelector('.product-price');
      expect(priceEl).toBeInTheDocument();
    });

    it('should handle decimal prices', () => {
      const decimalProduct = {
        id: 9,
        name: 'Decimal Price',
        price: 1234567.89,
        stock: 5,
      };
      renderProductCard({ product: decimalProduct });
      expect(screen.getByText(/1.*234/)).toBeInTheDocument();
    });
  });
});
