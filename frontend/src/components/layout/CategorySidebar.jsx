/**
 * CategorySidebar Component
 * Sidebar category menu for homepage
 */
import React, { useState, useRef, useEffect } from 'react';
import { useCategories } from '../../hooks';

// Category icons mapping
const categoryIcons = {
  // Điện tử / Điện thoại
  'điện tử': '📱',
  'điện thoại': '📱',
  'iphone': '📱',
  'samsung': '📱',
  'phone': '📱',
  
  // Máy tính
  'laptop': '💻',
  'máy tính': '💻',
  'computer': '💻',
  'pc': '💻',
  
  // Tablet
  'máy tính bảng': '📱',
  'tablet': '📱',
  'ipad': '📱',
  
  // Tai nghe / Âm thanh
  'tai nghe': '🎧',
  'headphone': '🎧',
  'âm thanh': '🎧',
  'loa': '🔊',
  'speaker': '🔊',
  
  // Đồng hồ
  'đồng hồ': '⌚',
  'watch': '⌚',
  'smartwatch': '⌚',
  
  // Phụ kiện
  'phụ kiện': '🔌',
  'accessory': '🔌',
  'sạc': '🔋',
  'cáp': '🔌',
  
  // Khác
  'hàng cũ': '♻️',
  'tin tức': '📰',
  'game': '🎮',
  'camera': '📷',
  'tivi': '📺',
  'tv': '📺',
  'default': '📦'
};

const getIcon = (name) => {
  if (!name) return categoryIcons.default;
  const lowerName = name.toLowerCase();
  
  for (const [key, icon] of Object.entries(categoryIcons)) {
    if (lowerName.includes(key)) {
      return icon;
    }
  }
  return categoryIcons.default;
};

export function CategorySidebar({ selectedCategory, onSelectCategory, collapsed = false }) {
  const { categories, loading } = useCategories();
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const dropdownRef = useRef(null);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleSelect = (categoryId) => {
    onSelectCategory(categoryId);
    setDropdownOpen(false);
  };

  // Collapsed mode - show dropdown button
  if (collapsed) {
    return (
      <div className="category-dropdown-wrapper" ref={dropdownRef}>
        <button 
          className={`category-toggle-btn ${dropdownOpen ? 'active' : ''}`} 
          onClick={() => setDropdownOpen(!dropdownOpen)}
        >
          <span className="toggle-icon">☰</span>
          <span className="toggle-text">Danh mục</span>
          <span className="toggle-arrow">{dropdownOpen ? '▲' : '▼'}</span>
        </button>

        {dropdownOpen && (
          <div className="category-dropdown">
            <button
              className={`dropdown-item ${selectedCategory === null ? 'active' : ''}`}
              onClick={() => handleSelect(null)}
            >
              <span className="item-icon">🏠</span>
              <span className="item-text">Tất cả sản phẩm</span>
            </button>

            {loading ? (
              <div className="dropdown-loading">Đang tải...</div>
            ) : (
              categories.map((category) => (
                <button
                  key={category.id}
                  className={`dropdown-item ${selectedCategory === category.id ? 'active' : ''}`}
                  onClick={() => handleSelect(category.id)}
                >
                  <span className="item-icon">{getIcon(category.name)}</span>
                  <span className="item-text">{category.name}</span>
                </button>
              ))
            )}
          </div>
        )}
      </div>
    );
  }

  // Full sidebar mode
  return (
    <aside className="category-sidebar">
      <div className="sidebar-header">
        <span className="sidebar-icon">☰</span>
        <span className="sidebar-title">Danh mục sản phẩm</span>
      </div>

      <nav className="sidebar-nav">
        <button
          className={`sidebar-item ${selectedCategory === null ? 'active' : ''}`}
          onClick={() => onSelectCategory(null)}
        >
          <span className="item-icon">🏠</span>
          <span className="item-text">Tất cả sản phẩm</span>
          <span className="item-arrow">›</span>
        </button>

        {loading ? (
          <div className="sidebar-loading">Đang tải...</div>
        ) : (
          categories.map((category) => (
            <button
              key={category.id}
              className={`sidebar-item ${selectedCategory === category.id ? 'active' : ''}`}
              onClick={() => onSelectCategory(category.id)}
            >
              <span className="item-icon">{getIcon(category.name)}</span>
              <span className="item-text">{category.name}</span>
              <span className="item-arrow">›</span>
            </button>
          ))
        )}
      </nav>
    </aside>
  );
}

// Keep CategoryDrawer for backward compatibility but it's not used anymore
export function CategoryDrawer({ isOpen, onClose, selectedCategory, onSelectCategory }) {
  return null;
}

export default CategorySidebar;
