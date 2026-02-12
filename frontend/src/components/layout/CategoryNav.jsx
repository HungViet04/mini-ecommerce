/**
 * CategoryNav Component
 * Horizontal category navigation
 */
import React from 'react';
import { useCategories } from '../../hooks';

export function CategoryNav({ selectedCategory, onSelectCategory }) {
  const { categories, loading } = useCategories();

  if (loading) {
    return (
      <nav className="category-nav">
        <span className="category-nav-loading">Đang tải danh mục...</span>
      </nav>
    );
  }

  return (
    <nav className="category-nav">
      <div className="category-nav-container">
        <span className="category-nav-icon">🏠</span>
        <button
          className={`category-nav-item ${selectedCategory === null ? 'active' : ''}`}
          onClick={() => onSelectCategory(null)}
        >
          Tất cả sản phẩm
        </button>

        {categories.map((category) => (
          <React.Fragment key={category.id}>
            <span className="category-nav-separator">/</span>
            <button
              className={`category-nav-item ${selectedCategory === category.id ? 'active' : ''}`}
              onClick={() => onSelectCategory(category.id)}
            >
              {category.name}
            </button>
          </React.Fragment>
        ))}
      </div>
    </nav>
  );
}

export default CategoryNav;
