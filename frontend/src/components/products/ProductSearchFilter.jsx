/**
 * ProductSearchFilter Component
 * Compact filter icon with dropdown for category and price range
 */
import React, { useState, useCallback, useRef, useEffect } from 'react';
import { useCategories } from '../../hooks';
import { formatPrice } from '../../utils';

export function ProductSearchFilter({ onFilter, initialFilters = {} }) {
  const { categories, loading: categoriesLoading } = useCategories();
  const [open, setOpen] = useState(false);
  const [categoryId, setCategoryId] = useState(initialFilters.category_id || '');
  const [minPrice, setMinPrice] = useState(initialFilters.min_price ?? '');
  const [maxPrice, setMaxPrice] = useState(initialFilters.max_price ?? '');
  const dropdownRef = useRef(null);

  // Close on click outside
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
        setOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleApply = useCallback(
    (e) => {
      e.preventDefault();
      onFilter({
        category_id: categoryId || undefined,
        min_price: minPrice !== '' ? Number(minPrice) : undefined,
        max_price: maxPrice !== '' ? Number(maxPrice) : undefined,
      });
      setOpen(false);
    },
    [categoryId, minPrice, maxPrice, onFilter]
  );

  const handleReset = useCallback(() => {
    setCategoryId('');
    setMinPrice('');
    setMaxPrice('');
    onFilter({});
    setOpen(false);
  }, [onFilter]);

  const activeCount = [
    categoryId,
    minPrice !== '' ? minPrice : null,
    maxPrice !== '' ? maxPrice : null,
  ].filter(Boolean).length;

  const hasFilters = !!(categoryId || minPrice !== '' || maxPrice !== '');

  return (
    <div className="filter-dropdown-wrapper" ref={dropdownRef}>
      {/* Button + dropdown anchor */}
      <div className="filter-btn-anchor">
        <button
          type="button"
          className={`filter-icon-btn ${open ? 'active' : ''} ${hasFilters ? 'has-filters' : ''}`}
          onClick={() => setOpen((prev) => !prev)}
          title="Bộ lọc sản phẩm"
        >
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <line x1="4" y1="6" x2="20" y2="6" />
            <line x1="7" y1="12" x2="17" y2="12" />
            <line x1="10" y1="18" x2="14" y2="18" />
          </svg>
          <span className="filter-icon-label">Bộ lọc</span>
          {activeCount > 0 && <span className="filter-badge">{activeCount}</span>}
        </button>

        {/* Dropdown panel - positioned directly below button */}
        {open && (
          <form className="filter-dropdown-panel" onSubmit={handleApply}>
          <div className="filter-dropdown-section">
            <label className="filter-dropdown-label" htmlFor="fd-category">📂 Danh mục</label>
            <select
              id="fd-category"
              className="filter-dropdown-select"
              value={categoryId}
              onChange={(e) => setCategoryId(e.target.value)}
              disabled={categoriesLoading}
            >
              <option value="">Tất cả danh mục</option>
              {categories.map((cat) => (
                <option key={cat.id} value={cat.id}>{cat.name}</option>
              ))}
            </select>
          </div>

          <div className="filter-dropdown-section">
            <label className="filter-dropdown-label">💰 Khoảng giá</label>
            <div className="filter-dropdown-price">
              <input
                type="number"
                className="filter-dropdown-input"
                placeholder="Từ"
                value={minPrice}
                min="0"
                onChange={(e) => setMinPrice(e.target.value)}
              />
              <span className="filter-dropdown-sep">—</span>
              <input
                type="number"
                className="filter-dropdown-input"
                placeholder="Đến"
                value={maxPrice}
                min="0"
                onChange={(e) => setMaxPrice(e.target.value)}
              />
            </div>
          </div>

          <div className="filter-dropdown-actions">
            <button type="submit" className="btn-filter btn-filter-apply">
              Áp dụng
            </button>
            {hasFilters && (
              <button type="button" className="btn-filter btn-filter-clear" onClick={handleReset}>
                Xóa lọc
              </button>
            )}
          </div>
        </form>
        )}
      </div>

      {/* Active filter tags - shown inline next to the button */}
      {hasFilters && (
        <div className="filter-active-tags">
          {categoryId && (
            <span className="filter-tag">
              {categories.find((c) => String(c.id) === String(categoryId))?.name}
              <button type="button" onClick={() => { setCategoryId(''); onFilter({ category_id: undefined, min_price: minPrice !== '' ? Number(minPrice) : undefined, max_price: maxPrice !== '' ? Number(maxPrice) : undefined }); }}>×</button>
            </span>
          )}
          {(minPrice !== '' || maxPrice !== '') && (
            <span className="filter-tag">
              {minPrice !== '' ? formatPrice(minPrice) : '0'} — {maxPrice !== '' ? formatPrice(maxPrice) : '∞'}
              <button type="button" onClick={() => { setMinPrice(''); setMaxPrice(''); onFilter({ category_id: categoryId || undefined }); }}>×</button>
            </span>
          )}
        </div>
      )}
    </div>
  );
}

export default ProductSearchFilter;
