/**
 * ProductList Container
 * Manages product list state and logic
 * Pattern: Container Component
 */
import React, { useState, useEffect, useMemo, useCallback } from 'react';
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
  const { addItem, items } = useCart();
  const { isAdmin } = useAuth();
  const { notifyToast } = useNotification();
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [currentPage, setCurrentPage] = useState(1);

  const [products, setProducts] = useState([]);
  const [productsTotal, setProductsTotal] = useState(0);
  const [featuredProducts, setFeaturedProducts] = useState([]);
  const [baseLoading, setBaseLoading] = useState(false);
  const [baseError, setBaseError] = useState(null);

  // State for filtered/searched products
  const [filteredProducts, setFilteredProducts] = useState([]);
  const [filterTotal, setFilterTotal] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  // Advanced filter state
  const [activeFilters, setActiveFilters] = useState({});
  const keyword = searchQuery.trim();
  const combinedFilters = useMemo(
    () => ({
      keyword: keyword || undefined,
      category_id: activeFilters.category_id || categoryId || undefined,
      min_price: activeFilters.min_price,
      max_price: activeFilters.max_price,
    }),
    [keyword, activeFilters, categoryId]
  );

  const hasAdvancedFilters = !!(
    combinedFilters.keyword ||
    combinedFilters.category_id ||
    combinedFilters.min_price !== undefined ||
    combinedFilters.max_price !== undefined
  );

  const fetchProductsPage = useCallback(async (page) => {
    setBaseLoading(true);
    setBaseError(null);

    try {
      const result = await productService.getAll(
        { page, limit: PRODUCTS_PER_PAGE },
        { skipLoading: true }
      );
      if (result && result.meta && result.meta.pagination) {
        setProducts(result.data || []);
        setProductsTotal(result.meta.pagination.total || 0);
      } else {
        const items = Array.isArray(result) ? result : result.items || result.data || [];
        setProducts(items);
        setProductsTotal(items.length);
      }
    } catch (err) {
      setBaseError(err.message || 'Không thể tải sản phẩm');
      setProducts([]);
      setProductsTotal(0);
    } finally {
      setBaseLoading(false);
    }
  }, []);

  const fetchFeatured = useCallback(async () => {
    try {
      const result = await productService.getAll(
        { page: 1, limit: FEATURED_PRODUCTS_COUNT },
        { skipLoading: true }
      );
      if (result && result.meta && result.meta.pagination) {
        setFeaturedProducts(result.data || []);
      } else {
        const items = Array.isArray(result) ? result : result.items || result.data || [];
        setFeaturedProducts(items.slice(0, FEATURED_PRODUCTS_COUNT));
      }
    } catch (err) {
      setFeaturedProducts([]);
    }
  }, []);

  // Handler for advanced search/filter
  const handleFilter = useCallback((filters) => {
    setActiveFilters(filters);
    setCurrentPage(1);
  }, []);

  // Re-fetch when page changes and advanced filters are active
  useEffect(() => {
    if (!hasAdvancedFilters) return;

    const fetchPage = async () => {
      setLoading(true);
      setError(null);
      try {
        const result = await productService.searchAndFilter(
          {
            ...combinedFilters,
            page: currentPage,
            limit: PRODUCTS_PER_PAGE,
          },
          { skipLoading: true }
        );
        setFilteredProducts(result.data || []);
        setFilterTotal(result.meta?.pagination?.total || 0);
      } catch (err) {
        setError(err.message || 'Không thể tải sản phẩm');
        setFilteredProducts([]);
        setFilterTotal(0);
      } finally {
        setLoading(false);
      }
    };

    fetchPage();
  }, [currentPage, hasAdvancedFilters, combinedFilters]);

  // Effect to handle navbar search bar and sidebar category filtering (legacy)
  useEffect(() => {
    if (hasAdvancedFilters) return;

    if (!keyword && !categoryId) {
      fetchProductsPage(currentPage);
      return;
    }

    const fetchFilteredProducts = async () => {
      setLoading(true);
      setError(null);

      try {
        const result = await productService.searchAndFilter(
          {
            keyword: keyword || undefined,
            category_id: categoryId || undefined,
            page: currentPage,
            limit: PRODUCTS_PER_PAGE,
          },
          { skipLoading: true }
        );
        setFilteredProducts(result.data || []);
        setFilterTotal(result.meta?.pagination?.total || 0);
      } catch (err) {
        setError(err.message || 'Không thể tải sản phẩm');
        setFilteredProducts([]);
        setFilterTotal(0);
      } finally {
        setLoading(false);
      }
    };

    fetchFilteredProducts();
  }, [keyword, categoryId, hasAdvancedFilters, currentPage, fetchProductsPage]);

  // Reset page when filters change
  useEffect(() => {
    setCurrentPage(1);
  }, [searchQuery, categoryId]);

  useEffect(() => {
    if (!hasAdvancedFilters && !keyword && !categoryId) {
      fetchFeatured();
    }
  }, [hasAdvancedFilters, keyword, categoryId, fetchFeatured]);

  const handleAddToCart = (product) => {
    if (isAdmin) return;
    const cartItem = items.find((i) => i.productId === product.id);
    const currentQty = cartItem ? cartItem.quantity : 0;
    const maxStock = Number.isFinite(Number(product.stock)) ? Number(product.stock) : null;
    if (maxStock !== null && currentQty + 1 > maxStock) {
      notifyToast(`Chỉ còn ${maxStock} sản phẩm trong kho. Không thể thêm vượt quá.`, {
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
  const isFilterActive = hasAdvancedFilters || keyword || categoryId;
  const displayProducts = isFilterActive ? filteredProducts : products;
  const isLoading = isFilterActive ? loading : baseLoading;
  const displayError = isFilterActive ? error : baseError;

  // Featured products for slider (only show on main page without filters)
  const featuredItems = useMemo(() => {
    if (isFilterActive) return [];
    return featuredProducts;
  }, [featuredProducts, isFilterActive]);

  // Paginated products for grid
  // When using advanced filters, server handles pagination
  const { paginatedProducts, totalPages } = useMemo(() => {
    if (isFilterActive) {
      return {
        paginatedProducts: filteredProducts,
        totalPages: Math.ceil(filterTotal / PRODUCTS_PER_PAGE),
      };
    }
    return {
      paginatedProducts: products,
      totalPages: Math.ceil(productsTotal / PRODUCTS_PER_PAGE),
    };
  }, [filteredProducts, filterTotal, products, productsTotal, isFilterActive]);

  // Get subtitle based on filter
  const getSubtitle = () => {
    if (hasAdvancedFilters) {
      return `Tìm thấy ${filterTotal} sản phẩm phù hợp`;
    }
    if (searchQuery) {
      return `Kết quả tìm kiếm cho "${searchQuery}" (${filterTotal} sản phẩm)`;
    }
    if (categoryId) {
      return `Hiển thị ${filterTotal} sản phẩm trong danh mục`;
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
    <div key={product.id}>
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
        {featuredItems.length > 0 && !searchQuery && !categoryId && !hasAdvancedFilters && (
          <div className="featured-section">
            <div className="section-header">
              <h2 className="section-title">🔥 Sản Phẩm Nổi Bật</h2>
              <p className="section-subtitle">Những sản phẩm được yêu thích nhất</p>
            </div>
            <ProductSlider
              products={featuredItems}
              onAddToCart={handleAddToCart}
              onViewDetail={handleViewDetail}
            />
          </div>
        )}

        {/* Products Grid Section */}
        <div className="products-grid-section">
          <div className="section-header">
            <div className="section-header-left">
              <h2 className="section-title">{isFilterActive ? 'Kết Quả' : 'Tất Cả Sản Phẩm'}</h2>
              <p className="section-subtitle">{getSubtitle()}</p>
            </div>
            <ProductSearchFilter onFilter={handleFilter} initialFilters={activeFilters} />
          </div>

          {displayError && <div className="alert alert-error">{displayError}</div>}

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
