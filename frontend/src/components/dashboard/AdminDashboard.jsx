/**
 * AdminDashboard Component
 * Dashboard with statistics for admin
 */
import React, { useState, useEffect } from 'react';
import { useAuth } from '../../contexts';
import { statsService } from '../../services';
import { Card, Loading } from '../ui';
import { formatPrice } from '../../utils';

const StatCard = ({ icon, label, value, subValue, color }) => (
  <div className={`stat-card stat-${color}`}>
    <div className="stat-icon">{icon}</div>
    <div className="stat-content">
      <span className="stat-value">{value}</span>
      <span className="stat-label">{label}</span>
      {subValue && <span className="stat-sub">{subValue}</span>}
    </div>
  </div>
);

const statusLabels = {
  pending: 'Chờ xử lý',
  paid: 'Đã thanh toán',
  shipped: 'Đang giao',
  delivered: 'Đã nhận',
};

const statusColors = {
  pending: '#f59e0b',
  paid: '#10b981',
  shipped: '#3b82f6',
  delivered: '#059669',
};

export function AdminDashboard() {
  const { isAuthenticated, isAdmin } = useAuth();
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchStats = async () => {
      if (!isAuthenticated || !isAdmin) return;

      try {
        setLoading(true);
        const data = await statsService.getDashboard();
        setStats(data);
      } catch (err) {
        setError(err.message || 'Không thể tải thống kê');
      } finally {
        setLoading(false);
      }
    };

    fetchStats();
  }, [isAuthenticated, isAdmin]);

  if (!isAuthenticated || !isAdmin) {
    return (
      <div className="dashboard-container">
        <div className="empty-container">
          <span className="empty-icon">⛔</span>
          <p>Truy cập bị từ chối</p>
        </div>
      </div>
    );
  }

  if (loading) {
    return <Loading text="Đang tải thống kê..." />;
  }

  if (error) {
    return (
      <div className="dashboard-container">
        <div className="alert alert-error">{error}</div>
      </div>
    );
  }

  if (!stats) return null;

  const { orders, revenue, products, users, recentOrders, topProducts, monthlyRevenue } = stats;

  return (
    <div className="admin-dashboard">
      <div className="dashboard-header">
        <h1>📊 Dashboard</h1>
        <p className="dashboard-subtitle">Tổng quan hoạt động cửa hàng</p>
      </div>

      {/* Stats Grid */}
      <div className="stats-grid">
        <StatCard
          icon="💰"
          label="Doanh thu tháng này"
          value={formatPrice(revenue.monthRevenue)}
          subValue={`Hôm nay: ${formatPrice(revenue.todayRevenue)}`}
          color="primary"
        />
        <StatCard
          icon="📦"
          label="Tổng đơn hàng"
          value={orders.total}
          subValue={`${orders.pending} đơn chờ xử lý`}
          color="info"
        />
        <StatCard
          icon="📱"
          label="Sản phẩm"
          value={products.total}
          subValue={`${products.lowStock} sắp hết hàng`}
          color="warning"
        />
        <StatCard
          icon="👥"
          label="Khách hàng"
          value={users.customers}
          subValue={`+${users.newToday} hôm nay`}
          color="success"
        />
      </div>

      {/* Revenue Summary */}
      <div className="dashboard-row">
        <Card className="dashboard-card revenue-card">
          <h3>💵 Doanh thu</h3>
          <div className="revenue-grid">
            <div className="revenue-item">
              <span className="revenue-label">Tổng doanh thu</span>
              <span className="revenue-value">{formatPrice(revenue.totalRevenue)}</span>
            </div>
            <div className="revenue-item">
              <span className="revenue-label">Đã xác nhận</span>
              <span className="revenue-value confirmed">
                {formatPrice(revenue.confirmedRevenue)}
              </span>
            </div>
            <div className="revenue-item">
              <span className="revenue-label">Chờ thanh toán</span>
              <span className="revenue-value pending">{formatPrice(revenue.pendingRevenue)}</span>
            </div>
            <div className="revenue-item">
              <span className="revenue-label">Tuần này</span>
              <span className="revenue-value">{formatPrice(revenue.weekRevenue)}</span>
            </div>
          </div>
        </Card>

        <Card className="dashboard-card orders-summary-card">
          <h3>📊 Trạng thái đơn hàng</h3>
          <div className="orders-chart">
            {Object.entries(statusLabels).map(([status, label]) => (
              <div key={status} className="order-status-bar">
                <div className="status-info">
                  <span className="status-label">{label}</span>
                  <span className="status-count">{orders[status] || 0}</span>
                </div>
                <div className="status-bar-bg">
                  <div
                    className="status-bar-fill"
                    style={{
                      width: `${orders.total > 0 ? ((orders[status] || 0) / orders.total) * 100 : 0}%`,
                      backgroundColor: statusColors[status],
                    }}
                  />
                </div>
              </div>
            ))}
          </div>
        </Card>
      </div>

      {/* Recent Orders & Top Products */}
      <div className="dashboard-row">
        <Card className="dashboard-card">
          <h3>🕐 Đơn hàng gần đây</h3>
          <div className="recent-orders-list">
            {recentOrders.length === 0 ? (
              <p className="empty-text">Chưa có đơn hàng nào</p>
            ) : (
              recentOrders.map((order) => (
                <div key={order.id} className="recent-order-item">
                  <div className="order-info">
                    <span className="order-id">#{order.id}</span>
                    <span className="order-customer">{order.userName || 'Khách'}</span>
                  </div>
                  <div className="order-details">
                    <span className={`order-status status-${order.status}`}>
                      {statusLabels[order.status]}
                    </span>
                    <span className="order-total">{formatPrice(order.total)}</span>
                  </div>
                </div>
              ))
            )}
          </div>
        </Card>

        <Card className="dashboard-card">
          <h3>🏆 Sản phẩm bán chạy</h3>
          <div className="top-products-list">
            {topProducts.length === 0 ? (
              <p className="empty-text">Chưa có dữ liệu</p>
            ) : (
              topProducts.map((product, index) => (
                <div key={product.id} className="top-product-item">
                  <span className="product-rank">#{index + 1}</span>
                  <div className="product-info">
                    <span className="product-name">{product.name}</span>
                    <span className="product-stats">
                      Đã bán: {product.totalSold} | Còn: {product.stock}
                    </span>
                  </div>
                  <span className="product-revenue">{formatPrice(product.totalRevenue)}</span>
                </div>
              ))
            )}
          </div>
        </Card>
      </div>

      {/* Monthly Revenue Chart */}
      {monthlyRevenue.length > 0 && (
        <Card className="dashboard-card chart-card">
          <h3>📈 Doanh thu theo tháng</h3>
          <div className="monthly-chart">
            {monthlyRevenue.map((item) => {
              const maxRevenue = Math.max(...monthlyRevenue.map((m) => m.revenue)) || 1;
              const height = (item.revenue / maxRevenue) * 100;
              return (
                <div key={item.month} className="chart-bar-container">
                  <div className="chart-bar-wrapper">
                    <div
                      className="chart-bar"
                      style={{ height: `${Math.max(height, 5)}%` }}
                      title={`${formatPrice(item.revenue)} (${item.orderCount} đơn)`}
                    />
                  </div>
                  <span className="chart-label">{item.label}</span>
                </div>
              );
            })}
          </div>
        </Card>
      )}
    </div>
  );
}

export default AdminDashboard;
