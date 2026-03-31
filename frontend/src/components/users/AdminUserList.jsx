/**
 * AdminUserList Component
 * User management for admin
 */
import React, { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../../contexts';
import { userService } from '../../services';
import { Card, Button, Loading, Pagination } from '../ui';
import { formatPrice, formatDate } from '../../utils';

export function AdminUserList() {
  const { isAuthenticated, isAdmin, user: currentUser } = useAuth();
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);
  const [search, setSearch] = useState('');
  const [pagination, setPagination] = useState({
    page: 1,
    total: 0,
    limit: 10,
  });
  const [updating, setUpdating] = useState(null);
  const [selectedUser, setSelectedUser] = useState(null);
  const [userOrders, setUserOrders] = useState([]);
  const [loadingOrders, setLoadingOrders] = useState(false);

  const fetchUsers = useCallback(async () => {
    if (!isAuthenticated || !isAdmin) return;

    try {
      setLoading(true);
      setError(null);
      const result = await userService.getAll({
        page: pagination.page,
        limit: pagination.limit,
        role: undefined,
        search: search || undefined,
      });
      if (result && result.meta && result.meta.pagination) {
        setUsers(result.data || []);
        setPagination((prev) => ({ ...prev, total: result.meta.pagination.total || 0 }));
      } else {
        setUsers(result.items || []);
        setPagination((prev) => ({ ...prev, total: result.total || 0 }));
      }
    } catch (err) {
      setError(err.message || 'Không thể tải danh sách người dùng');
    } finally {
      setLoading(false);
    }
  }, [isAuthenticated, isAdmin, pagination.page, pagination.limit, search]);

  useEffect(() => {
    fetchUsers();
  }, [fetchUsers]);

  const handleSearch = (e) => {
    e.preventDefault();
    setPagination((prev) => ({ ...prev, page: 1 }));
  };

  // role change handled elsewhere (UI for changing role currently disabled)

  const handleViewOrders = async (user) => {
    try {
      setLoadingOrders(true);
      setSelectedUser(user);
      const orders = await userService.getUserOrders(user.id);
      setUserOrders(orders);
    } catch (err) {
      setError(err.message || 'Không thể tải đơn hàng');
    } finally {
      setLoadingOrders(false);
    }
  };

  const handleDeleteUser = async (user) => {
    if (user.id === currentUser?.id) {
      setError('Không thể xóa tài khoản của chính mình');
      return;
    }

    if (user.orderCount > 0) {
      setError(`Không thể xóa người dùng có ${user.orderCount} đơn hàng`);
      return;
    }

    if (!window.confirm(`Bạn có chắc muốn xóa người dùng "${user.name}"?`)) {
      return;
    }

    try {
      setUpdating(user.id);
      setError(null);
      await userService.delete(user.id);
      setSuccess('Xóa người dùng thành công');
      fetchUsers();
      setTimeout(() => setSuccess(null), 3000);
    } catch (err) {
      setError(err.message || 'Không thể xóa người dùng');
    } finally {
      setUpdating(null);
    }
  };

  const handleCloseModal = () => {
    setSelectedUser(null);
    setUserOrders([]);
  };

  if (!isAuthenticated || !isAdmin) {
    return (
      <div className="users-container">
        <div className="empty-container">
          <span className="empty-icon">⛔</span>
          <p>Truy cập bị từ chối</p>
        </div>
      </div>
    );
  }

  return (
    <section className="admin-users-section">
      <div className="section-header">
        <h1 className="section-title">👥 Quản Lý Người Dùng</h1>
        <p className="section-subtitle">Xem và quản lý tài khoản khách hàng</p>
      </div>

      {/* Filters */}
      <div className="admin-filters">
        <form onSubmit={handleSearch} className="search-form">
          <input
            type="text"
            placeholder="Tìm theo tên, email..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="search-input search-admin-input"
          />
          <Button type="submit" className="search-button">
            🔍 Tìm
          </Button>
        </form>

        {/* <select
          value={roleFilter}
          onChange={(e) => {
            setRoleFilter(e.target.value);
            setPagination(prev => ({ ...prev, page: 1 }));
          }}
          className="filter-select"
        >
          <option value="">Tất cả vai trò</option>
          <option value="user">Khách hàng</option>
          <option value="admin">Quản trị viên</option>
        </select> */}

        <div className="filter-actions">
          <Button variant="primary" onClick={fetchUsers} disabled={loading}>
            🔄 Làm mới
          </Button>
        </div>
      </div>

      {/* Alerts */}
      {error && <div className="alert alert-error">❌ {error}</div>}
      {success && <div className="alert alert-success">✅ {success}</div>}

      {/* Stats */}
      <div className="users-stats">
        <span>Tổng: {pagination.total} người dùng</span>
      </div>

      {/* Users List */}
      {loading ? (
        <Loading text="Đang tải..." />
      ) : users.length === 0 ? (
        <div className="empty-container">
          <span className="empty-icon">👤</span>
          <p>Không tìm thấy người dùng nào</p>
        </div>
      ) : (
        <div className="users-grid">
          {users.map((user) => (
            <Card key={user.id} className="user-card">
              <div className="user-header">
                <div className="user-avatar">{user.name?.charAt(0).toUpperCase() || '?'}</div>
                <div className="user-info">
                  <span className="user-name">{user.name}</span>
                  <span className="user-email">{user.email}</span>
                </div>
                {/* <span className={`user-role ${roleColors[user.role]}`}>
                  {roleLabels[user.role]}
                </span> */}
              </div>

              <div className="user-stats">
                <div className="user-stat">
                  <span className="stat-icon">📦</span>
                  <span className="stat-value">{user.orderCount}</span>
                  <span className="stat-label">Đơn hàng</span>
                </div>
                <div className="user-stat">
                  <span className="stat-icon">💰</span>
                  <span className="stat-value">{formatPrice(user.totalSpent)}</span>
                  <span className="stat-label">Đã chi</span>
                </div>
              </div>

              <div className="user-meta">
                <span>Tham gia: {formatDate(user.createdAt)}</span>
              </div>

              <div className="user-actions">
                <Button variant="primary" size="sm" onClick={() => handleViewOrders(user)}>
                  📋 Xem đơn hàng
                </Button>

                {user.id !== currentUser?.id && (
                  <>
                    {/* <select
                      value={user.role}
                      onChange={(e) => handleRoleChange(user.id, e.target.value)}
                      disabled={updating === user.id}
                      className="role-select"
                    >
                      <option value="user">Khách hàng</option>
                      <option value="admin">Quản trị viên</option>
                    </select> */}

                    <Button
                      variant="danger"
                      size="sm"
                      onClick={() => handleDeleteUser(user)}
                      disabled={updating === user.id || user.orderCount > 0}
                      title={
                        user.orderCount > 0
                          ? 'Không thể xóa người dùng có đơn hàng'
                          : 'Xóa người dùng'
                      }
                    >
                      🗑️
                    </Button>
                  </>
                )}
              </div>
            </Card>
          ))}
        </div>
      )}

      {/* Pagination */}
      {pagination.total > pagination.limit && (
        <Pagination
          currentPage={pagination.page}
          totalPages={Math.ceil(pagination.total / pagination.limit)}
          onPageChange={(page) => setPagination((prev) => ({ ...prev, page }))}
        />
      )}

      {/* User Orders Modal */}
      {selectedUser && (
        <div className="modal-overlay" onClick={handleCloseModal}>
          <div className="user-orders-modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2>📦 Đơn hàng của {selectedUser.name}</h2>
              <button className="modal-close" onClick={handleCloseModal}>
                ✕
              </button>
            </div>

            <div className="modal-body">
              {loadingOrders ? (
                <Loading text="Đang tải đơn hàng..." />
              ) : userOrders.length === 0 ? (
                <p className="empty-text">Chưa có đơn hàng nào</p>
              ) : (
                <div className="user-orders-list">
                  {userOrders.map((order) => (
                    <div key={order.id} className="user-order-item">
                      <div className="order-row">
                        <span className="order-id">#{order.id}</span>
                        <span className={`order-status status-${order.status}`}>
                          {order.status}
                        </span>
                      </div>
                      <div className="order-row">
                        <span>{formatDate(order.createdAt)}</span>
                        <span className="order-total">{formatPrice(order.total)}</span>
                      </div>
                      {order.shippingName && (
                        <div className="order-shipping">
                          {order.shippingName} - {order.shippingPhone}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </section>
  );
}

export default AdminUserList;
