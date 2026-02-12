/**
 * Navbar Component
 * Main navigation header
 * Pattern: Presentational Component
 */
import { useAuth } from "../../contexts";
import { Button } from "../ui";
import { SearchBar } from "./SearchBar";
import { useNavigate, useLocation } from 'react-router-dom';

export function Navbar({ currentView, onSearch }) {
  const { user, isAdmin, isAuthenticated, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const showAuthButton = location.pathname !== '/auth';

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  const handleLogoClick = () => {
    if (!isAdmin) {
      navigate('/');
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
      {location.pathname === '/' && !isAdmin && (
        <div className="navbar-contact">
          <span className="contact-icon">📞</span>
          <span className="contact-text">Liên hệ: 0325251470</span>
        </div>
      )}

      {/* Search Bar - ẩn ở trang đăng nhập/đăng ký */}
      {location.pathname !== '/auth' && (
        <div className="navbar-search">
          <SearchBar onSearch={onSearch} />
        </div>
      )}

      <nav className="navbar-nav">
        {/* My Orders - only for regular users, not admin */}
        {isAuthenticated && !isAdmin && (
            <NavLink
              active={location.pathname === '/orders'}
              onClick={() => navigate('/orders')}
            >
              Đơn Hàng Của Tôi
            </NavLink>
          )}

        {/* Admin Navigation */}
        {isAdmin && (
          <NavLink active={location.pathname === '/admin/dashboard'} onClick={() => navigate('/admin/dashboard')}>📊 Dashboard</NavLink>
        )}

        {isAdmin && (
          <NavLink active={location.pathname === '/admin/orders'} onClick={() => navigate('/admin/orders')}>📦 Đơn Hàng</NavLink>
        )}

        {isAdmin && (
          <NavLink active={location.pathname === '/admin/users'} onClick={() => navigate('/admin/users')}>👥 Người Dùng</NavLink>
        )}

        {isAdmin && (
          <NavLink active={location.pathname === '/admin/products'} onClick={() => navigate('/admin/products')}>📱 Sản Phẩm</NavLink>
        )}

        {isAdmin && (
          <NavLink active={location.pathname === '/admin/categories'} onClick={() => navigate('/admin/categories')}>🏷️ Danh Mục</NavLink>
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
          showAuthButton && (
            <Button
              variant="primary"
              size="sm"
              onClick={() => navigate('/auth')}
            >
              Đăng Nhập / Đăng Ký
            </Button>
          )
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
