/**
 * ProductGrid Component Tests
 * Comprehensive tests for product grid layout
 */
import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { ProductGrid } from '../../src/components/products/ProductGrid';

// Mock ProductCard component
vi.mock('../../src/components/products/ProductCard', () => ({
  ProductCard: ({ product, onAddToCart, onViewDetail }) => (
    <div data-testid={`product-card-${product.id}`} onClick={() => onViewDetail?.(product)}>
      <span>{product.name}</span>
      <button
        onClick={(e) => {
          e.stopPropagation();
          onAddToCart?.(product);
        }}
      >
        Add to Cart
      </button>
    </div>
  ),
}));

// Mock UI components
vi.mock('../../src/components/ui', () => ({
  Loading: () => <div data-testid="loading">Loading...</div>,
  CardSkeleton: () => <div data-testid="skeleton">Skeleton</div>,
}));

describe('ProductGrid', () => {
  const mockProducts = [
    { id: 1, name: 'Product 1', price: 100000, stock: 10 },
    { id: 2, name: 'Product 2', price: 200000, stock: 20 },
    { id: 3, name: 'Product 3', price: 300000, stock: 30 },
  ];

  const defaultProps = {
    products: mockProducts,
    loading: false,
    error: null,
    onAddToCart: vi.fn(),
    onViewDetail: vi.fn(),
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('loading state', () => {
    it('should render skeleton cards when loading', () => {
      render(<ProductGrid {...defaultProps} loading={true} />);

      const skeletons = screen.getAllByTestId('skeleton');
      expect(skeletons).toHaveLength(6); // Default 6 skeletons
    });

    it('should not render products when loading', () => {
      render(<ProductGrid {...defaultProps} loading={true} />);

      expect(screen.queryByTestId('product-card-1')).not.toBeInTheDocument();
    });
  });

  describe('error state', () => {
    it('should render error message', () => {
      const errorMessage = 'Không thể tải sản phẩm';
      render(<ProductGrid {...defaultProps} error={errorMessage} />);

      expect(screen.getByText(errorMessage)).toBeInTheDocument();
    });

    it('should render error container', () => {
      render(<ProductGrid {...defaultProps} error="Error" />);

      const errorContainer = screen.getByText('Error').closest('.error-container');
      expect(errorContainer).toBeInTheDocument();
    });

    it('should not render products when error', () => {
      render(<ProductGrid {...defaultProps} error="Error" />);

      expect(screen.queryByTestId('product-card-1')).not.toBeInTheDocument();
    });
  });

  describe('empty state', () => {
    it('should render empty message when no products', () => {
      render(<ProductGrid {...defaultProps} products={[]} />);

      expect(screen.getByText('Không tìm thấy sản phẩm nào')).toBeInTheDocument();
    });

    it('should render empty icon', () => {
      render(<ProductGrid {...defaultProps} products={[]} />);

      expect(screen.getByText('📭')).toBeInTheDocument();
    });

    it('should render empty container', () => {
      render(<ProductGrid {...defaultProps} products={[]} />);

      const emptyContainer = screen.getByText('📭').closest('.empty-container');
      expect(emptyContainer).toBeInTheDocument();
    });
  });

  describe('products display', () => {
    it('should render all products', () => {
      render(<ProductGrid {...defaultProps} />);

      expect(screen.getByTestId('product-card-1')).toBeInTheDocument();
      expect(screen.getByTestId('product-card-2')).toBeInTheDocument();
      expect(screen.getByTestId('product-card-3')).toBeInTheDocument();
    });

    it('should render product names', () => {
      render(<ProductGrid {...defaultProps} />);

      expect(screen.getByText('Product 1')).toBeInTheDocument();
      expect(screen.getByText('Product 2')).toBeInTheDocument();
      expect(screen.getByText('Product 3')).toBeInTheDocument();
    });

    it('should render correct number of products', () => {
      render(<ProductGrid {...defaultProps} />);

      const productCards = screen.getAllByTestId(/product-card-/);
      expect(productCards).toHaveLength(3);
    });

    it('should render grid container', () => {
      const { container } = render(<ProductGrid {...defaultProps} />);

      expect(container.querySelector('.product-grid')).toBeInTheDocument();
    });
  });

  describe('interactions', () => {
    it('should call onViewDetail when product is clicked', () => {
      const onViewDetail = vi.fn();
      render(<ProductGrid {...defaultProps} onViewDetail={onViewDetail} />);

      fireEvent.click(screen.getByTestId('product-card-1'));

      expect(onViewDetail).toHaveBeenCalledWith(mockProducts[0]);
    });

    it('should call onAddToCart when add to cart is clicked', () => {
      const onAddToCart = vi.fn();
      render(<ProductGrid {...defaultProps} onAddToCart={onAddToCart} />);

      const addButtons = screen.getAllByText('Add to Cart');
      fireEvent.click(addButtons[0]);

      expect(onAddToCart).toHaveBeenCalledWith(mockProducts[0]);
    });

    it('should pass correct product to onViewDetail', () => {
      const onViewDetail = vi.fn();
      render(<ProductGrid {...defaultProps} onViewDetail={onViewDetail} />);

      fireEvent.click(screen.getByTestId('product-card-2'));

      expect(onViewDetail).toHaveBeenCalledWith(mockProducts[1]);
    });
  });

  describe('single product', () => {
    it('should render single product', () => {
      const singleProduct = [{ id: 1, name: 'Single Product', price: 100000, stock: 5 }];
      render(<ProductGrid {...defaultProps} products={singleProduct} />);

      expect(screen.getByText('Single Product')).toBeInTheDocument();
      expect(screen.getAllByTestId(/product-card-/)).toHaveLength(1);
    });
  });

  describe('many products', () => {
    it('should render many products', () => {
      const manyProducts = Array.from({ length: 20 }, (_, i) => ({
        id: i + 1,
        name: `Product ${i + 1}`,
        price: 100000 * (i + 1),
        stock: 10,
      }));
      render(<ProductGrid {...defaultProps} products={manyProducts} />);

      expect(screen.getAllByTestId(/product-card-/)).toHaveLength(20);
    });
  });

  describe('state priority', () => {
    it('should prioritize loading over error', () => {
      render(<ProductGrid {...defaultProps} loading={true} error="Error" />);

      expect(screen.getAllByTestId('skeleton')).toHaveLength(6);
      expect(screen.queryByText('Error')).not.toBeInTheDocument();
    });

    it('should prioritize error over empty', () => {
      render(<ProductGrid {...defaultProps} products={[]} error="Error occurred" />);

      expect(screen.getByText('Error occurred')).toBeInTheDocument();
      expect(screen.queryByText('Không tìm thấy sản phẩm nào')).not.toBeInTheDocument();
    });
  });
});
