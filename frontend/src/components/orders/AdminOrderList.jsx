/**
 * AdminOrderList Component
 * Admin view for all orders with status management
 * Pattern: Container Component
 */
import React, { useState } from 'react';
import { useAdminOrders } from '../../hooks';
import { useAuth } from '../../contexts';
import { Loading, Button } from '../ui';
import { AdminOrderCard } from './AdminOrderCard';
import { httpClient } from '../../services';
import { tokenStorage } from '../../utils/storage';

const STATUS_FILTERS = [
  { value: '', label: 'Tất cả đơn hàng' },
  { value: 'pending', label: 'Chờ xử lý' },
  { value: 'paid', label: 'Đã thanh toán' },
  { value: 'shipped', label: 'Đang giao hàng' },
  { value: 'delivered', label: 'Đã nhận hàng' },
];

export function AdminOrderList() {
  const { isAuthenticated, isAdmin } = useAuth();
  const [statusFilter, setStatusFilter] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [exporting, setExporting] = useState(false);
  
  const {
    orders,
    loading,
    error,
    updateOrderStatus,
    updating,
    refetch,
    setSearch,
  } = useAdminOrders({
    autoFetch: isAuthenticated && isAdmin,
    status: statusFilter || undefined,
  });

  if (!isAuthenticated) {
    return (
      <div className="orders-container">
        <div className="empty-container">
          <span className="empty-icon">🔒</span>
          <p>Vui lòng đăng nhập để truy cập trang này</p>
        </div>
      </div>
    );
  }

  if (!isAdmin) {
    return (
      <div className="orders-container">
        <div className="empty-container">
          <span className="empty-icon">⛔</span>
          <p>Truy cập bị từ chối. Chỉ dành cho Quản trị viên.</p>
        </div>
      </div>
    );
  }

  const handleStatusFilterChange = (e) => {
    setStatusFilter(e.target.value);
  };

  const handleSearch = (e) => {
    e.preventDefault();
    // Immediate search on form submit (Enter / search button)
    setSearch(searchQuery);
  };

  // Debounced live search: update hook search after user stops typing
  React.useEffect(() => {
    const t = setTimeout(() => {
      setSearch(searchQuery);
    }, 400);
    return () => clearTimeout(t);
  }, [searchQuery, setSearch]);

  const handleUpdateStatus = async (orderId, newStatus) => {
    const success = await updateOrderStatus(orderId, newStatus);
    if (success) {
      refetch();
    }
  };

  const handleExport = async () => {
    try {
      setExporting(true);
      const params = new URLSearchParams();
      if (statusFilter) params.set('status', statusFilter);
      
      const response = await fetch(`http://localhost:3000/api/v1/orders/admin/export?${params.toString()}`, {
        headers: {
          Authorization: `Bearer ${tokenStorage.get()}`,
        },
      });
      
      if (!response.ok) throw new Error('Export failed');
      
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `orders_${new Date().toISOString().split('T')[0]}.csv`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
    } catch (err) {
      alert('Xuất file thất bại: ' + err.message);
    } finally {
      setExporting(false);
    }
  };

  return (
    <section className="orders-section admin-orders">
      <div className="section-header">
        <h1 className="section-title">📦 Quản Lý Đơn Hàng</h1>
        <p className="section-subtitle">Xem và quản lý tất cả đơn hàng của khách hàng</p>
      </div>

      <div className="admin-filters">
        {/* Search */}
        <form onSubmit={handleSearch} className="search-form">
          <input
            type="text"
            placeholder="Tìm mã đơn, tên, SĐT..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="search-input search-admin-input"
          />
          <Button type="submit" className='search-button'>
            🔍 Tìm
          </Button>
        </form>

        {/* Status Filter */}
        <select
          id="status-filter"
          value={statusFilter}
          onChange={handleStatusFilterChange}
          className="filter-select"
        >
          {STATUS_FILTERS.map((f) => (
            <option key={f.value} value={f.value}>
              {f.label}
            </option>
          ))}
        </select>

        {/* Actions */}
        <div className="filter-actions">
          <Button variant="ghost" size="sm" onClick={refetch} disabled={loading}>
            🔄 Làm mới
          </Button>
          <Button 
            variant="secondary" 
            size="sm" 
            onClick={handleExport}
            disabled={exporting}
          >
            {exporting ? '⏳' : '📥'} Export CSV
          </Button>
        </div>
      </div>

      {error && (
        <div className="alert alert-error">
          <span>❌</span> {error}
        </div>
      )}

      {loading ? (
        <Loading text="Đang tải đơn hàng..." />
      ) : orders.length === 0 ? (
        <div className="empty-container">
          <span className="empty-icon">📋</span>
          <p>Không tìm thấy đơn hàng nào</p>
          {statusFilter && (
            <p className="muted">Thử thay đổi bộ lọc hoặc quay lại sau</p>
          )}
        </div>
      ) : (
        <>
          <div className="orders-stats">
            <span>Tổng số đơn hàng: {orders.length}</span>
          </div>
          
          <div className="orders-list admin-orders-list">
            {orders.map((order) => (
              <AdminOrderCard
                key={order.id}
                order={order}
                onUpdateStatus={handleUpdateStatus}
                updating={updating}
              />
            ))}
          </div>

          {/* Pagination removed */}
        </>
      )}
    </section>
  );
}

export default AdminOrderList;
