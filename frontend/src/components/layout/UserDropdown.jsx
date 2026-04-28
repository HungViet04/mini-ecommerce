/**
 * UserDropdown Component
 * Dropdown menu for user actions
 * Pattern: Presentational Component
 */
import React, { useState, useRef, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { authService } from '../../services';
import { Button, Card, Input, ErrorAlert, SuccessAlert } from '../ui';

const PASSWORD_MIN_LENGTH = 6;

export function UserDropdown({
  user,
  isAdmin,
  onLogout,
  onViewOrders,
  showOrdersLink = true,
  showAdminLinks = true,
}) {
  const navigate = useNavigate();
  const location = useLocation();
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef(null);
  const [showChangePassword, setShowChangePassword] = useState(false);
  const [formData, setFormData] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: '',
  });
  const [touched, setTouched] = useState({});
  const [fieldErrors, setFieldErrors] = useState({});
  const [formError, setFormError] = useState('');
  const [formSuccess, setFormSuccess] = useState('');
  const [saving, setSaving] = useState(false);

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

  const resetChangePasswordForm = () => {
    setFormData({ currentPassword: '', newPassword: '', confirmPassword: '' });
    setTouched({});
    setFieldErrors({});
    setFormError('');
    setFormSuccess('');
  };

  const handleOpenChangePassword = () => {
    resetChangePasswordForm();
    setShowChangePassword(true);
  };

  const handleCloseChangePassword = () => {
    setShowChangePassword(false);
    resetChangePasswordForm();
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    setFieldErrors((prev) => ({ ...prev, [name]: undefined }));
    setFormError('');
    setFormSuccess('');
  };

  const handleInputBlur = (e) => {
    const { name } = e.target;
    setTouched((prev) => ({ ...prev, [name]: true }));
  };

  const validateForm = () => {
    const errors = {};

    if (!formData.currentPassword) {
      errors.currentPassword = 'Vui lòng nhập mật khẩu hiện tại';
    }

    if (!formData.newPassword) {
      errors.newPassword = 'Vui lòng nhập mật khẩu mới';
    } else if (formData.newPassword.length < PASSWORD_MIN_LENGTH) {
      errors.newPassword = `Mật khẩu mới phải có ít nhất ${PASSWORD_MIN_LENGTH} ký tự`;
    }

    if (!formData.confirmPassword) {
      errors.confirmPassword = 'Vui lòng xác nhận mật khẩu mới';
    } else if (formData.newPassword !== formData.confirmPassword) {
      errors.confirmPassword = 'Mật khẩu xác nhận không khớp';
    }

    setFieldErrors(errors);
    if (Object.keys(errors).length > 0) {
      setTouched({ currentPassword: true, newPassword: true, confirmPassword: true });
      return false;
    }

    return true;
  };

  const handleSubmitChangePassword = async (e) => {
    e.preventDefault();

    if (!validateForm()) {
      return;
    }

    setSaving(true);
    setFormError('');
    setFormSuccess('');

    try {
      await authService.changePassword(formData.currentPassword, formData.newPassword);
      setFormSuccess('Đổi mật khẩu thành công');
      setFormData({ currentPassword: '', newPassword: '', confirmPassword: '' });
      setTouched({});
      setFieldErrors({});

      setTimeout(() => {
        setShowChangePassword(false);
        setFormSuccess('');
      }, 1200);
    } catch (err) {
      let message = err.message || 'Không thể đổi mật khẩu';
      if (message === 'Current password is incorrect') {
        message = 'Mật khẩu hiện tại không đúng';
      }
      setFormError(message);
    } finally {
      setSaving(false);
    }
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

            {!isAdmin && (
              <button
                className={`dropdown-item ${location.pathname === '/addresses' ? 'active' : ''}`}
                onClick={() => handleMenuItemClick(() => navigate('/addresses'))}
              >
                <span className="dropdown-item-icon">📍</span>
                <span className="dropdown-item-text">Sổ địa chỉ</span>
              </button>
            )}

            {showAdminLinks && isAdmin && (
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
              className="dropdown-item"
              onClick={() => handleMenuItemClick(handleOpenChangePassword)}
            >
              <span className="dropdown-item-icon">🔑</span>
              <span className="dropdown-item-text">Đổi mật khẩu</span>
            </button>

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

      {showChangePassword && (
        <div className="modal-overlay" onClick={handleCloseChangePassword}>
          <Card className="modal-content" onClick={(e) => e.stopPropagation()}>
            <h3 className="modal-title">🔐 Đổi mật khẩu</h3>
            <form onSubmit={handleSubmitChangePassword}>
              {formError && <ErrorAlert message={formError} />}
              {formSuccess && <SuccessAlert message={formSuccess} />}

              <Input
                label="Mật khẩu hiện tại"
                name="currentPassword"
                type="password"
                placeholder="Nhập mật khẩu hiện tại"
                value={formData.currentPassword}
                onChange={handleInputChange}
                onBlur={handleInputBlur}
                error={fieldErrors.currentPassword}
                touched={touched.currentPassword}
                required
              />

              <Input
                label="Mật khẩu mới"
                name="newPassword"
                type="password"
                placeholder={`Tối thiểu ${PASSWORD_MIN_LENGTH} ký tự`}
                value={formData.newPassword}
                onChange={handleInputChange}
                onBlur={handleInputBlur}
                error={fieldErrors.newPassword}
                touched={touched.newPassword}
                required
              />

              <Input
                label="Xác nhận mật khẩu mới"
                name="confirmPassword"
                type="password"
                placeholder="Nhập lại mật khẩu mới"
                value={formData.confirmPassword}
                onChange={handleInputChange}
                onBlur={handleInputBlur}
                error={fieldErrors.confirmPassword}
                touched={touched.confirmPassword}
                required
              />

              <div className="form-actions">
                <Button variant="ghost" type="button" onClick={handleCloseChangePassword}>
                  Hủy
                </Button>
                <Button variant="primary" type="submit" loading={saving}>
                  Cập nhật
                </Button>
              </div>
            </form>
          </Card>
        </div>
      )}
    </div>
  );
}

export default UserDropdown;
