/**
 * Navbar Component
 * Main navigation header
 * Pattern: Presentational Component
 */
import { useAuth } from '../../contexts';
import { Button } from '../ui';
import { SearchBar } from './SearchBar';
import { UserDropdown } from './UserDropdown';
import { useNavigate, useLocation } from 'react-router-dom';

export function Navbar({ onSearch }) {
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
        style={isAdmin ? { cursor: 'default' } : { cursor: 'pointer' }}
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

      {/* Search Bar - ẩn ở trang đăng nhập/đăng ký và khi là admin */}
      {location.pathname !== '/auth' && !isAdmin && (
        <div className="navbar-search">
          <SearchBar onSearch={onSearch} />
        </div>
      )}

      <nav className="navbar-nav">
        {/* Admin Navigation */}
        {isAdmin && (
          <NavLink
            active={location.pathname === '/admin/dashboard'}
            onClick={() => navigate('/admin/dashboard')}
          >
            📊 Dashboard
          </NavLink>
        )}

        {isAdmin && (
          <NavLink
            active={location.pathname === '/admin/orders'}
            onClick={() => navigate('/admin/orders')}
          >
            📦 Đơn Hàng
          </NavLink>
        )}

        {isAdmin && (
          <NavLink
            active={location.pathname === '/admin/users'}
            onClick={() => navigate('/admin/users')}
          >
            👥 Người Dùng
          </NavLink>
        )}

        {isAdmin && (
          <NavLink
            active={location.pathname === '/admin/products'}
            onClick={() => navigate('/admin/products')}
          >
            📱 Sản Phẩm
          </NavLink>
        )}

        {isAdmin && (
          <NavLink
            active={location.pathname === '/admin/categories'}
            onClick={() => navigate('/admin/categories')}
          >
            🏷️ Danh Mục
          </NavLink>
        )}
      </nav>

      <div className="navbar-actions">
        {isAuthenticated ? (
          <>
            {/* Desktop version - user dropdown */}
            <div className="navbar-actions-desktop">
              <UserDropdown
                user={user}
                isAdmin={isAdmin}
                onLogout={handleLogout}
                onViewOrders={() => navigate('/orders')}
                showOrdersLink={false}
                showAdminLinks={false}
              />
            </div>

            {/* Mobile version - dropdown menu */}
            <div className="navbar-actions-mobile">
              <UserDropdown
                user={user}
                isAdmin={isAdmin}
                onLogout={handleLogout}
                onViewOrders={() => navigate('/orders')}
              />
            </div>
          </>
        ) : (
          showAuthButton && (
            <Button variant="primary" size="sm" onClick={() => navigate('/auth')}>
              Đăng Nhập / Đăng Ký
            </Button>
          )
        )}
      </div>
    </header>
  );
}

function NavLink({ children, active, onClick, className = '' }) {
  return (
    <button className={`nav-link ${active ? 'active' : ''} ${className}`} onClick={onClick}>
      {children}
    </button>
  );
}

export default Navbar;
