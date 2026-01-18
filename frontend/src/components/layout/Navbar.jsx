/**
 * Navbar Component
 * Main navigation header
 * Pattern: Presentational Component
 */
import React from "react";
import { useAuth } from "../../contexts";
import { Button } from "../ui";
import { SearchBar } from "./SearchBar";

export function Navbar({ onNavigate, currentView, onSearch }) {
  const { user, isAdmin, isAuthenticated, logout } = useAuth();

  const handleLogout = () => {
    logout();
    onNavigate("products");
  };

  const handleLogoClick = () => {
    if (!isAdmin) {
      onNavigate("products");
    }
  };

  return (
    <header className="navbar">
      <div
        className="navbar-brand brand-highlight"
        onClick={handleLogoClick}
        style={isAdmin ? { cursor: "default" } : { cursor: "pointer" }}
      >
        <span className="brand-icon">🛒</span>
        <span className="brand-name">
          <span className="logo-smart">Smart</span>
          <span className="logo-shop">Shop</span>
        </span>
      </div>

      {/* Contact Info - chỉ hiển thị ở trang chủ cho khách và user thường */}
      {currentView === "products" && !isAdmin && (
        <div className="navbar-contact">
          <span className="contact-icon">📞</span>
          <span className="contact-text">Liên hệ: 0325251470</span>
        </div>
      )}

      {/* Search Bar - ẩn ở trang đăng nhập/đăng ký */}
      {currentView !== "auth" && (
        <div className="navbar-search">
          <SearchBar onSearch={onSearch} />
        </div>
      )}

      <nav className="navbar-nav">
        {/* My Orders - only for regular users, not admin */}
        {isAuthenticated && !isAdmin && (
          <NavLink
            active={currentView === "orders"}
            onClick={() => onNavigate("orders")}
          >
            Đơn Hàng Của Tôi
          </NavLink>
        )}

        {/* Admin Navigation */}
        {isAdmin && (
          <NavLink
            active={currentView === "admin-dashboard"}
            onClick={() => onNavigate("admin-dashboard")}
          >
            📊 Dashboard
          </NavLink>
        )}

        {isAdmin && (
          <NavLink
            active={currentView === "admin-orders"}
            onClick={() => onNavigate("admin-orders")}
          >
            📦 Đơn Hàng
          </NavLink>
        )}

        {isAdmin && (
          <NavLink
            active={currentView === "admin-users"}
            onClick={() => onNavigate("admin-users")}
          >
            👥 Người Dùng
          </NavLink>
        )}

        {isAdmin && (
          <NavLink
            active={currentView === "admin-products"}
            onClick={() => onNavigate("admin-products")}
          >
            📱 Sản Phẩm
          </NavLink>
        )}

        {isAdmin && (
          <NavLink
            active={currentView === "admin-categories"}
            onClick={() => onNavigate("admin-categories")}
          >
            🏷️ Danh Mục
          </NavLink>
        )}
      </nav>

      <div className="navbar-actions">
        {isAuthenticated ? (
          <>
            <span className="user-info">
              {user?.email}
              {isAdmin && <span className="badge">Quản trị</span>}
            </span>
            <Button variant="ghost" size="sm" onClick={handleLogout}>
              Đăng Xuất
            </Button>
          </>
        ) : (
          <Button
            variant="primary"
            size="sm"
            onClick={() => onNavigate("auth")}
          >
            Đăng Nhập / Đăng Ký
          </Button>
        )}
      </div>
    </header>
  );
}

function NavLink({ children, active, onClick }) {
  return (
    <button className={`nav-link ${active ? "active" : ""}`} onClick={onClick}>
      {children}
    </button>
  );
}

export default Navbar;
