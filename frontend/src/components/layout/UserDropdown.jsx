/**
 * UserDropdown Component
 * Dropdown menu for user actions
 * Pattern: Presentational Component
 */
import React, { useState, useRef, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';

export function UserDropdown({ user, isAdmin, onLogout, onViewOrders }) {
  const navigate = useNavigate();
  const location = useLocation();
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef(null);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    };

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen]);

  const handleToggle = () => {
    setIsOpen(!isOpen);
  };

  const handleMenuItemClick = (action) => {
    action();
    setIsOpen(false);
  };

  // Extract username from email or use email
  const displayName = user?.name || user?.email?.split('@')[0] || 'User';

  return (
    <div className="user-dropdown" ref={dropdownRef}>
      <button className="user-dropdown-toggle" onClick={handleToggle}>
        <span className="user-avatar">⚙️</span>
        <span className="user-name">{displayName}</span>
        {isAdmin && <span className="user-badge">Admin</span>}
        <span className={`dropdown-arrow ${isOpen ? 'open' : ''}`}>▼</span>
      </button>

      {isOpen && (
        <div className="user-dropdown-menu">
          <div className="dropdown-header">
            <div className="dropdown-user-info">
              <div className="dropdown-user-name">{user?.name || 'User'}</div>
              <div className="dropdown-user-email">{user?.email}</div>
            </div>
          </div>

          <div className="dropdown-divider"></div>

          <div className="dropdown-items">
            {!isAdmin && (
              <button className="dropdown-item" onClick={() => handleMenuItemClick(onViewOrders)}>
                <span className="dropdown-item-icon">📦</span>
                <span className="dropdown-item-text">Đơn hàng của tôi</span>
              </button>
            )}

            {isAdmin && (
              <>
                <button
                  className={`dropdown-item ${location.pathname === '/admin/dashboard' ? 'active' : ''}`}
                  onClick={() => handleMenuItemClick(() => navigate('/admin/dashboard'))}
                >
                  <span className="dropdown-item-icon">📊</span>
                  <span className="dropdown-item-text">Dashboard</span>
                </button>

                <button
                  className={`dropdown-item ${location.pathname === '/admin/orders' ? 'active' : ''}`}
                  onClick={() => handleMenuItemClick(() => navigate('/admin/orders'))}
                >
                  <span className="dropdown-item-icon">📦</span>
                  <span className="dropdown-item-text">Đơn Hàng</span>
                </button>

                <button
                  className={`dropdown-item ${location.pathname === '/admin/users' ? 'active' : ''}`}
                  onClick={() => handleMenuItemClick(() => navigate('/admin/users'))}
                >
                  <span className="dropdown-item-icon">👥</span>
                  <span className="dropdown-item-text">Người Dùng</span>
                </button>

                <button
                  className={`dropdown-item ${location.pathname === '/admin/products' ? 'active' : ''}`}
                  onClick={() => handleMenuItemClick(() => navigate('/admin/products'))}
                >
                  <span className="dropdown-item-icon">📱</span>
                  <span className="dropdown-item-text">Sản Phẩm</span>
                </button>

                <button
                  className={`dropdown-item ${location.pathname === '/admin/categories' ? 'active' : ''}`}
                  onClick={() => handleMenuItemClick(() => navigate('/admin/categories'))}
                >
                  <span className="dropdown-item-icon">🏷️</span>
                  <span className="dropdown-item-text">Danh Mục</span>
                </button>
              </>
            )}

            <button
              className="dropdown-item dropdown-item-danger"
              onClick={() => handleMenuItemClick(onLogout)}
            >
              <span className="dropdown-item-icon">🚪</span>
              <span className="dropdown-item-text">Đăng xuất</span>
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

export default UserDropdown;
