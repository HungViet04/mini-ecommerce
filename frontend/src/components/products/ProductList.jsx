/**
 * ProductList Container
 * Manages product list state and logic
 * Pattern: Container Component
 */
import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { useProducts } from '../../hooks';
import { useCart, useAuth, useNotification } from '../../contexts';
import { ProductSlider } from './ProductSlider';
import ProductCard from './ProductCard';
import { ProductDetail } from './ProductDetail';
import { ProductSearchFilter } from './ProductSearchFilter';
import { productService } from '../../services';
import { CategorySidebar } from '../layout';
import { Pagination } from '../ui';

const PRODUCTS_PER_PAGE = 8;
const FEATURED_PRODUCTS_COUNT = 4;

export function ProductList({ searchQuery = '', categoryId = null, onCategoryChange }) {
  const { products: allProducts, loading: defaultLoading } = useProducts();
  const { addItem } = useCart();
  const { isAdmin } = useAuth();
  const { notifyToast } = useNotification();
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [currentPage, setCurrentPage] = useState(1);

  // State for filtered/searched products
  const [filteredProducts, setFilteredProducts] = useState([]);
  const [filterTotal, setFilterTotal] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  // Advanced filter state
  const [activeFilters, setActiveFilters] = useState({});
  const hasAdvancedFilters = !!(
    activeFilters.category_id ||
    activeFilters.min_price !== undefined ||
    activeFilters.max_price !== undefined
  );

  // Handler for advanced search/filter
  const handleFilter = useCallback(
    async (filters) => {
      setActiveFilters(filters);
      setCurrentPage(1);

      const hasAnyFilter = filters.category_id || filters.min_price !== undefined || filters.max_price !== undefined;

      if (!hasAnyFilter) {
        setFilteredProducts([]);
        setFilterTotal(0);
        return;
      }

      setLoading(true);
      setError(null);

      try {
        const result = await productService.searchAndFilter({
          ...filters,
          page: 1,
          limit: PRODUCTS_PER_PAGE,
        });
        setFilteredProducts(result.data || []);
        setFilterTotal(result.meta?.pagination?.total || 0);
      } catch (err) {
        setError(err.message || 'Không thể tải sản phẩm');
        setFilteredProducts([]);
        setFilterTotal(0);
      } finally {
        setLoading(false);
      }
    },
    []
  );

  // Re-fetch when page changes and advanced filters are active
  useEffect(() => {
    if (!hasAdvancedFilters) return;

    const fetchPage = async () => {
      setLoading(true);
      setError(null);
      try {
        const result = await productService.searchAndFilter({
          ...activeFilters,
          page: currentPage,
          limit: PRODUCTS_PER_PAGE,
        });
        setFilteredProducts(result.data || []);
        setFilterTotal(result.meta?.pagination?.total || 0);
      } catch (err) {
        setError(err.message || 'Không thể tải sản phẩm');
        setFilteredProducts([]);
      } finally {
        setLoading(false);
      }
    };

    fetchPage();
  }, [currentPage, hasAdvancedFilters, activeFilters]);

  // Effect to handle navbar search bar and sidebar category filtering (legacy)
  useEffect(() => {
    const fetchFilteredProducts = async () => {
      if (!searchQuery && !categoryId) {
        setFilteredProducts(allProducts);
        return;
      }

      setLoading(true);
      setError(null);

      try {
        let result;
        if (searchQuery) {
          result = await productService.search(searchQuery);
        } else if (categoryId) {
          result = await productService.getByCategory(categoryId);
        }
        setFilteredProducts(Array.isArray(result) ? result : result.items || []);
      } catch (err) {
        setError(err.message || 'Không thể tải sản phẩm');
        setFilteredProducts([]);
      } finally {
        setLoading(false);
      }
    };

    if (!hasAdvancedFilters) {
      fetchFilteredProducts();
    }
  }, [searchQuery, categoryId, allProducts, hasAdvancedFilters]);

  // Reset page when filters change
  useEffect(() => {
    setCurrentPage(1);
  }, [searchQuery, categoryId]);

  const { items } = useCart();
  const handleAddToCart = async (product) => {
    if (isAdmin) return;
    const cartItem = items.find((i) => i.productId === product.id);
    const currentQty = cartItem ? cartItem.quantity : 0;
    const latest = await productService.getById(product.id);
    if (currentQty + 1 > latest.stock) {
      notifyToast(`Chỉ còn ${latest.stock} sản phẩm trong kho. Không thể thêm vượt quá.`, {
        type: 'error',
      });
      return;
    }
    addItem(product, 1);
  };

  const handleViewDetail = (product) => {
    setSelectedProduct(product);
  };

  const handleBack = () => {
    setSelectedProduct(null);
  };

  const handleCategorySelect = (catId) => {
    if (onCategoryChange) {
      onCategoryChange(catId);
    }
    // If in detail view, go back to list
    if (selectedProduct) {
      setSelectedProduct(null);
    }
    setCurrentPage(1);
  };

  const handlePageChange = (page) => {
    setCurrentPage(page);
    // Scroll to products section
    document.querySelector('.products-grid-section')?.scrollIntoView({ behavior: 'smooth' });
  };

  // Determine which products and loading state to show
  const isFilterActive = hasAdvancedFilters || searchQuery || categoryId;
  const displayProducts = isFilterActive ? filteredProducts : allProducts;
  const isLoading = isFilterActive ? loading : defaultLoading;

  // Featured products for slider (only show on main page without filters)
  const featuredProducts = useMemo(() => {
    if (isFilterActive) return [];
    return allProducts.slice(0, FEATURED_PRODUCTS_COUNT);
  }, [allProducts, isFilterActive]);

  // Paginated products for grid
  // When using advanced filters, server handles pagination
  const { paginatedProducts, totalPages } = useMemo(() => {
    if (hasAdvancedFilters) {
      return {
        paginatedProducts: filteredProducts,
        totalPages: Math.ceil(filterTotal / PRODUCTS_PER_PAGE),
      };
    }
    const startIndex = (currentPage - 1) * PRODUCTS_PER_PAGE;
    const endIndex = startIndex + PRODUCTS_PER_PAGE;
    return {
      paginatedProducts: displayProducts.slice(startIndex, endIndex),
      totalPages: Math.ceil(displayProducts.length / PRODUCTS_PER_PAGE),
    };
  }, [displayProducts, currentPage, hasAdvancedFilters, filteredProducts, filterTotal]);

  // Get subtitle based on filter
  const getSubtitle = () => {
    if (hasAdvancedFilters) {
      return `Tìm thấy ${filterTotal} sản phẩm phù hợp`;
    }
    if (searchQuery) {
      return `Kết quả tìm kiếm cho "${searchQuery}" (${displayProducts.length} sản phẩm)`;
    }
    if (categoryId) {
      return `Hiển thị ${displayProducts.length} sản phẩm trong danh mục`;
    }
    return isAdmin
      ? 'Quản lý danh mục sản phẩm của bạn'
      : 'Khám phá bộ sưu tập tuyệt vời của chúng tôi';
  };

  // Show product detail if a product is selected
  if (selectedProduct) {
    return (
      <section className="product-list-section">
        {/* Collapsed category dropdown */}
        <CategorySidebar
          collapsed={true}
          selectedCategory={categoryId}
          onSelectCategory={handleCategorySelect}
        />

        <ProductDetail
          product={selectedProduct}
          onAddToCart={handleAddToCart}
          onBack={handleBack}
        />
      </section>
    );
  }

  const renderProductCard = (product, onAddToCart, onViewDetail) => (
    <div style={{ position: 'relative' }} key={product.id}>
      <ProductCard
        product={product}
        onAddToCart={onAddToCart}
        onViewDetail={onViewDetail}
        showActions={true}
      />
    </div>
  );

  return (
    <section className="product-list-section with-sidebar">
      {/* Category Sidebar */}
      <CategorySidebar selectedCategory={categoryId} onSelectCategory={handleCategorySelect} />

      {/* Products Area */}
      <div className="products-main">
        {/* Featured Products Slider - only on main page */}
        {featuredProducts.length > 0 && !searchQuery && !categoryId && !hasAdvancedFilters && (
          <div className="featured-section">
            <div className="section-header">
              <h2 className="section-title">🔥 Sản Phẩm Nổi Bật</h2>
              <p className="section-subtitle">Những sản phẩm được yêu thích nhất</p>
            </div>
            <ProductSlider
              products={featuredProducts}
              onAddToCart={handleAddToCart}
              onViewDetail={handleViewDetail}
            />
          </div>
        )}

        {/* Products Grid Section */}
        <div className="products-grid-section">
          <div className="section-header">
            <div className="section-header-left">
              <h2 className="section-title">
                {isFilterActive ? 'Kết Quả' : 'Tất Cả Sản Phẩm'}
              </h2>
              <p className="section-subtitle">{getSubtitle()}</p>
            </div>
            <ProductSearchFilter onFilter={handleFilter} initialFilters={activeFilters} />
          </div>

          {error && <div className="alert alert-error">{error}</div>}

          <div className="product-grid">
            {paginatedProducts.map((product) =>
              renderProductCard(product, handleAddToCart, handleViewDetail)
            )}
          </div>

          {/* Pagination */}
          {!isLoading && displayProducts.length > 0 && (
            <Pagination
              currentPage={currentPage}
              totalPages={totalPages}
              onPageChange={handlePageChange}
            />
          )}
        </div>
      </div>
    </section>
  );
}

export default ProductList;
