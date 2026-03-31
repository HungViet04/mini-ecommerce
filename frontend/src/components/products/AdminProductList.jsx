/**
 * AdminProductList Component
 * Product management for admin (CRUD)
 */
import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useCategories } from '../../hooks';
import { productService, uploadService } from '../../services';
import { Card, Button, ErrorAlert, SuccessAlert, Pagination } from '../ui';
import CreateProductForm from './CreateProductForm';
import { ProductSearchFilter } from './ProductSearchFilter';
import { formatPrice } from '../../utils';

const PAGE_SIZE = 10;

export function AdminProductList() {
  const { categories } = useCategories();
  const [searchQuery, setSearchQuery] = useState('');
  const [activeFilters, setActiveFilters] = useState({});
  const [searchResults, setSearchResults] = useState([]);
  const [searchTotal, setSearchTotal] = useState(0);
  const [searchLoading, setSearchLoading] = useState(false);
  const [searchError, setSearchError] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [editingProduct, setEditingProduct] = useState(null);
  const [showForm, setShowForm] = useState(false);
  const [submitError, setSubmitError] = useState('');
  const [success, setSuccess] = useState('');
  const [deleteConfirm, setDeleteConfirm] = useState(null);
  const searchDebounceRef = useRef(null);
  const lastSearchRef = useRef('');
  const skipNextSearchEffectRef = useRef(false);

  const hasSearch = searchQuery.trim().length > 0;
  const hasFilters = !!(
    activeFilters.category_id ||
    activeFilters.min_price !== undefined ||
    activeFilters.max_price !== undefined
  );

  const runSearch = useCallback(async (keyword, filters = {}, page = 1) => {
    setSearchLoading(true);
    setSearchError('');
    const requestKey = JSON.stringify({ keyword, filters, page });
    lastSearchRef.current = requestKey;

    try {
      const result = await productService.searchAndFilter({
        keyword,
        category_id: filters.category_id,
        min_price: filters.min_price,
        max_price: filters.max_price,
        page,
        limit: PAGE_SIZE,
      });
      const items = result?.data || result?.items || [];
      const total = result?.meta?.pagination?.total ?? items.length;
      const totalPageCount = Math.max(1, Math.ceil(total / PAGE_SIZE));
      if (lastSearchRef.current !== requestKey) {
        return;
      }
      setSearchResults(items);
      setSearchTotal(total);
      setTotalPages(totalPageCount);
    } catch (err) {
      setSearchError(err.message || 'Không thể tìm kiếm sản phẩm');
      setSearchResults([]);
      setSearchTotal(0);
      setTotalPages(1);
    } finally {
      setSearchLoading(false);
    }
  }, []);

  const resetForm = () => {
    setEditingProduct(null);
    setSubmitError('');
  };

  const handleOpenCreate = () => {
    resetForm();
    setShowForm(true);
  };

  const handleOpenEdit = (product) => {
    setEditingProduct(product);
    setShowForm(true);
    setSubmitError('');
  };

  const handleCancel = () => {
    setShowForm(false);
    resetForm();
  };

  const refreshList = useCallback(() => {
    const keyword = searchQuery.trim();
    if (keyword || hasFilters) {
      runSearch(keyword, activeFilters, currentPage);
    } else {
      runSearch('', {}, currentPage);
    }
  }, [searchQuery, runSearch, hasFilters, activeFilters, currentPage]);

  const handleDelete = async (product) => {
    if (deleteConfirm !== product.id) {
      setDeleteConfirm(product.id);
      return;
    }

    try {
      await productService.delete(product.id);
      setSuccess('Xóa sản phẩm thành công!');
      setDeleteConfirm(null);
      refreshList();
      setTimeout(() => setSuccess(''), 3000);
    } catch (err) {
      setSubmitError(err.message || 'Không thể xóa sản phẩm');
    }
  };

  const getCategoryName = (categoryId) => {
    const category = categories.find((c) => c.id === categoryId);
    return category?.name || 'Không có';
  };

  const handleSearchSubmit = (event) => {
    event.preventDefault();
    const keyword = searchQuery.trim();

    if (searchDebounceRef.current) {
      clearTimeout(searchDebounceRef.current);
    }
    setCurrentPage(1);
    runSearch(keyword, activeFilters, 1);
  };

  const handleClearSearch = () => {
    setSearchQuery('');
    if (searchDebounceRef.current) {
      clearTimeout(searchDebounceRef.current);
    }
    skipNextSearchEffectRef.current = true;
    setCurrentPage(1);
    runSearch('', activeFilters, 1);
  };

  const handleFilter = (filters) => {
    setActiveFilters(filters);
    const keyword = searchQuery.trim();
    if (searchDebounceRef.current) {
      clearTimeout(searchDebounceRef.current);
    }
    skipNextSearchEffectRef.current = true;
    setCurrentPage(1);
    runSearch(keyword, filters, 1);
  };

  useEffect(() => {
    if (searchDebounceRef.current) {
      clearTimeout(searchDebounceRef.current);
    }

    if (skipNextSearchEffectRef.current) {
      skipNextSearchEffectRef.current = false;
      return;
    }

    const keyword = searchQuery.trim();

    if (!keyword && !hasFilters) {
      setCurrentPage(1);
      runSearch('', activeFilters, 1);
      return;
    }

    searchDebounceRef.current = setTimeout(() => {
      setCurrentPage(1);
      runSearch(keyword, activeFilters, 1);
    }, 300);

    return () => {
      if (searchDebounceRef.current) {
        clearTimeout(searchDebounceRef.current);
      }
    };
  }, [searchQuery, runSearch, hasFilters, activeFilters]);

  const isFilterActive = hasSearch || hasFilters;
  const displayProducts = searchResults;
  const displayCount = searchTotal;
  const isLoading = searchLoading;

  const handlePageChange = (page) => {
    if (page === currentPage) return;
    if (searchDebounceRef.current) {
      clearTimeout(searchDebounceRef.current);
    }
    setCurrentPage(page);
    runSearch(searchQuery.trim(), activeFilters, page);
  };

  return (
    <div className="admin-products">
      <div className="section-header">
        <div>
          <h1 className="section-title">Quản Lý Sản Phẩm</h1>
          <p className="section-subtitle">Thêm, sửa, xóa sản phẩm trong cửa hàng</p>
        </div>
        {!showForm && (
          <Button variant="primary" onClick={handleOpenCreate}>
            + Thêm Sản Phẩm
          </Button>
        )}
      </div>

      {success && <SuccessAlert message={success} />}
      {submitError && !showForm && <ErrorAlert message={submitError} />}

      {/* Product Form Modal */}
      {showForm && (
        <CreateProductForm
          onSuccess={refreshList}
          onClose={handleCancel}
          categories={categories}
          product={editingProduct}
        />
      )}

      {/* Products Table */}
      <Card className="products-table-card">
        <div className="table-header">
          <span className="products-count">{displayCount} sản phẩm</span>
          <form className="admin-product-search" onSubmit={handleSearchSubmit}>
            <div className="admin-search-field">
              <input
                type="text"
                className="admin-search-input"
                placeholder="Tìm theo tên sản phẩm..."
                value={searchQuery}
                onChange={(event) => setSearchQuery(event.target.value)}
                aria-label="Tìm kiếm sản phẩm"
              />
              {hasSearch && (
                <button
                  type="button"
                  className="admin-search-clear"
                  onClick={handleClearSearch}
                  aria-label="Xóa tìm kiếm"
                >
                  ×
                </button>
              )}
            </div>
            <button type="submit" className="admin-search-button" aria-label="Tìm kiếm">
              {searchLoading ? '⏳' : '🔍'}
            </button>
            <ProductSearchFilter onFilter={handleFilter} initialFilters={activeFilters} />
          </form>
        </div>

        {searchError && <ErrorAlert message={searchError} />}

        {isLoading ? (
          <div className="loading-state">Đang tải...</div>
        ) : displayProducts.length === 0 ? (
          <div className="empty-state">
            <span className="empty-icon">📦</span>
            <p>{isFilterActive ? 'Không tìm thấy sản phẩm phù hợp' : 'Chưa có sản phẩm nào'}</p>
          </div>
        ) : (
          <div className="products-table-wrapper">
            <table className="products-table">
              <thead>
                <tr>
                  <th>Hình ảnh</th>
                  <th>Tên sản phẩm</th>
                  <th>Danh mục</th>
                  <th>Giá</th>
                  <th>Tồn kho</th>
                  <th>Thao tác</th>
                </tr>
              </thead>
              <tbody>
                {displayProducts.map((product) => (
                  <tr key={product.id}>
                    <td>
                      <div className="product-thumb">
                        {product.image_url ? (
                          <img
                            src={uploadService.getImageUrl(product.image_url)}
                            alt={product.name}
                          />
                        ) : (
                          <span className="no-image">📦</span>
                        )}
                      </div>
                    </td>
                    <td>
                      <div className="product-name">{product.name}</div>
                      {product.description && (
                        <div className="product-desc">
                          {product.description.substring(0, 50)}...
                        </div>
                      )}
                    </td>
                    <td>{getCategoryName(product.category_id)}</td>
                    <td className="price-cell">{formatPrice(product.price)}</td>
                    <td>
                      <span className={`stock-badge ${product.stock <= 5 ? 'low' : ''}`}>
                        {product.stock}
                      </span>
                    </td>
                    <td>
                      <div className="action-buttons">
                        <Button
                          size="sm"
                          variant="secondary"
                          onClick={() => handleOpenEdit(product)}
                        >
                          ✏️ Sửa
                        </Button>
                        <Button
                          size="sm"
                          variant={deleteConfirm === product.id ? 'danger' : 'secondary'}
                          onClick={() => handleDelete(product)}
                        >
                          {deleteConfirm === product.id ? 'Xác nhận xóa?' : '🗑️ Xóa'}
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {!isLoading && displayProducts.length > 0 && (
          <Pagination
            currentPage={currentPage}
            totalPages={totalPages}
            onPageChange={handlePageChange}
          />
        )}
      </Card>
    </div>
  );
}

export default AdminProductList;
