/**
 * ProductList Container
 * Manages product list state and logic
 * Pattern: Container Component
 */
import React, { useState, useEffect, useMemo } from 'react';
import { useProducts } from '../../hooks';
import { useCart, useAuth } from '../../contexts';
import { ProductSlider } from './ProductSlider';
import { ProductDetail } from './ProductDetail';
import { productService } from '../../services';
import { CategorySidebar } from '../layout';
import { Pagination } from '../ui';
import { Toast } from '../ui/Toast';
import { ProductCard } from './ProductCard';

const PRODUCTS_PER_PAGE = 8;
const FEATURED_PRODUCTS_COUNT = 4;

export function ProductList({ searchQuery = '', categoryId = null, onCategoryChange }) {
  const { products: allProducts, loading: defaultLoading } = useProducts();
  const { addItem } = useCart();
  const { isAdmin } = useAuth();
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [currentPage, setCurrentPage] = useState(1);

  // State for filtered/searched products
  const [filteredProducts, setFilteredProducts] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  // Effect to handle search and category filtering
  useEffect(() => {
    const fetchFilteredProducts = async () => {
      // If no filter, use all products
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

    fetchFilteredProducts();
  }, [searchQuery, categoryId, allProducts]);

  // Reset page when filters change
  useEffect(() => {
    setCurrentPage(1);
  }, [searchQuery, categoryId]);

  const [addCartError, setAddCartError] = useState('');
  const [addCartErrorProductId, setAddCartErrorProductId] = useState(null);
  const { items } = useCart();
  const handleAddToCart = async (product) => {
    if (isAdmin) return;
    const cartItem = items.find((i) => i.productId === product.id);
    const currentQty = cartItem ? cartItem.quantity : 0;
    const latest = await productService.getById(product.id);
    if (currentQty + 1 > latest.stock) {
      setAddCartError(`Chỉ còn ${latest.stock} sản phẩm trong kho. Không thể thêm vượt quá.`);
      setAddCartErrorProductId(product.id);
      setTimeout(() => {
        setAddCartError('');
        setAddCartErrorProductId(null);
      }, 2200);
      return;
    }
    setAddCartError('');
    setAddCartErrorProductId(null);
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
  const displayProducts = searchQuery || categoryId ? filteredProducts : allProducts;
  const isLoading = searchQuery || categoryId ? loading : defaultLoading;

  // Featured products for slider (only show on main page without filters)
  const featuredProducts = useMemo(() => {
    if (searchQuery || categoryId) return [];
    return allProducts.slice(0, FEATURED_PRODUCTS_COUNT);
  }, [allProducts, searchQuery, categoryId]);

  // Paginated products for grid
  const { paginatedProducts, totalPages } = useMemo(() => {
    const startIndex = (currentPage - 1) * PRODUCTS_PER_PAGE;
    const endIndex = startIndex + PRODUCTS_PER_PAGE;
    return {
      paginatedProducts: displayProducts.slice(startIndex, endIndex),
      totalPages: Math.ceil(displayProducts.length / PRODUCTS_PER_PAGE),
    };
  }, [displayProducts, currentPage]);

  // Get subtitle based on filter
  const getSubtitle = () => {
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

  // Custom ProductCard render để truyền Toast đúng vị trí
  const renderProductCard = (product, onAddToCart, onViewDetail) => (
    <div style={{ position: 'relative' }} key={product.id}>
      <ProductCard
        product={product}
        onAddToCart={onAddToCart}
        onViewDetail={onViewDetail}
        showActions={true}
      />
      <div style={{ minHeight: 32, position: 'relative' }}>
        {addCartErrorProductId === product.id && addCartError && (
          <div style={{ position: 'absolute', left: 0, right: 0, top: 0, zIndex: 10 }}>
            <Toast
              message={addCartError}
              type="error"
              duration={2200}
              onClose={() => setAddCartError('')}
            />
          </div>
        )}
      </div>
    </div>
  );

  return (
    <section className="product-list-section with-sidebar">
      {/* Category Sidebar */}
      <CategorySidebar selectedCategory={categoryId} onSelectCategory={handleCategorySelect} />

      {/* Products Area */}
      <div className="products-main">
        {/* Featured Products Slider - only on main page */}
        {featuredProducts.length > 0 && !searchQuery && !categoryId && (
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
            <h2 className="section-title">
              {searchQuery || categoryId ? 'Kết Quả' : 'Tất Cả Sản Phẩm'}
            </h2>
            <p className="section-subtitle">{getSubtitle()}</p>
          </div>

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

      {/* Toast notification nổi toàn cục */}
      {addCartError && (
        <Toast
          message={addCartError}
          type="error"
          duration={2200}
          onClose={() => setAddCartError('')}
        />
      )}
    </section>
  );
}

export default ProductList;
