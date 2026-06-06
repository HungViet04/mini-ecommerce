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

const DEFAULT_RANGE_DAYS = 30;

const toInputDate = (date) => {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

const parseInputDate = (value) => {
  if (!value) return null;
  const [year, month, day] = value.split('-').map((part) => Number(part));
  if (!year || !month || !day) return null;
  const date = new Date(year, month - 1, day);
  if (date.getFullYear() !== year || date.getMonth() !== month - 1 || date.getDate() !== day) {
    return null;
  }
  date.setHours(0, 0, 0, 0);
  return date;
};

const addMonthsLocal = (date, months) => {
  const year = date.getFullYear();
  const month = date.getMonth();
  const day = date.getDate();
  const base = new Date(year, month + months, 1);
  const lastDay = new Date(base.getFullYear(), base.getMonth() + 1, 0).getDate();
  base.setDate(Math.min(day, lastDay));
  base.setHours(0, 0, 0, 0);
  return base;
};

const formatDateLabel = (value) => {
  const date = parseInputDate(value);
  if (!date) return value || '';
  const day = String(date.getDate()).padStart(2, '0');
  const month = String(date.getMonth() + 1).padStart(2, '0');
  return `${day}/${month}`;
};

const buildDefaultRange = () => {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const fromDate = new Date(today);
  fromDate.setDate(today.getDate() - (DEFAULT_RANGE_DAYS - 1));
  return { from: toInputDate(fromDate), to: toInputDate(today) };
};

export function AdminDashboard() {
  const { isAuthenticated, isAdmin } = useAuth();
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [rangeError, setRangeError] = useState(null);

  const defaultRange = buildDefaultRange();
  const [rangeFrom, setRangeFrom] = useState(defaultRange.from);
  const [rangeTo, setRangeTo] = useState(defaultRange.to);
  const [appliedRange, setAppliedRange] = useState(defaultRange);

  useEffect(() => {
    const fetchStats = async () => {
      if (!isAuthenticated || !isAdmin) return;

      try {
        setLoading(true);
        const data = await statsService.getDashboard(appliedRange);
        setStats(data);
      } catch (err) {
        setError(err.message || 'Không thể tải thống kê');
      } finally {
        setLoading(false);
      }
    };

    fetchStats();
  }, [isAuthenticated, isAdmin, appliedRange]);

  const validateRange = (fromValue, toValue) => {
    const fromDate = parseInputDate(fromValue);
    const toDate = parseInputDate(toValue);

    if (!fromDate || !toDate) {
      return 'Vui lòng chọn đầy đủ ngày bắt đầu và kết thúc';
    }

    if (fromDate.getTime() > toDate.getTime()) {
      return 'Ngày bắt đầu phải nhỏ hơn hoặc bằng ngày kết thúc';
    }

    const maxEnd = addMonthsLocal(fromDate, 2);
    if (toDate.getTime() > maxEnd.getTime()) {
      return 'Khoảng thời gian tối đa là 2 tháng';
    }

    return null;
  };

  const handleApplyRange = () => {
    const errorMessage = validateRange(rangeFrom, rangeTo);
    setRangeError(errorMessage);
    if (errorMessage) return;

    setAppliedRange({ from: rangeFrom, to: rangeTo });
  };

  const handleResetRange = () => {
    const nextRange = buildDefaultRange();
    setRangeFrom(nextRange.from);
    setRangeTo(nextRange.to);
    setRangeError(null);
    setAppliedRange(nextRange);
  };

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
  const rangeActive = appliedRange?.from && appliedRange?.to;
  const getTotalDays = () => {
    if (!appliedRange?.from || !appliedRange?.to) return 0;

    const fromDate = parseInputDate(appliedRange.from);
    const toDate = parseInputDate(appliedRange.to);

    return Math.floor((toDate.getTime() - fromDate.getTime()) / (1000 * 60 * 60 * 24)) + 1;
  };
  const dailyAverage = revenue.totalRevenue > 0 ? revenue.totalRevenue / getTotalDays() : 0;

  const today = toInputDate(new Date());

  const minFrom = rangeTo ? toInputDate(addMonthsLocal(parseInputDate(rangeTo), -2)) : undefined;

  const maxTo = rangeFrom
    ? (() => {
        const twoMonthsLater = toInputDate(addMonthsLocal(parseInputDate(rangeFrom), 2));

        return twoMonthsLater > today ? today : twoMonthsLater;
      })()
    : today;

  return (
    <div className="admin-dashboard">
      <div className="dashboard-header">
        <h1>📊 Dashboard</h1>
        <p className="dashboard-subtitle">Tổng quan hoạt động cửa hàng</p>
      </div>

      <div className="dashboard-filter">
        <div className="filter-group">
          <label className="filter-label" htmlFor="range-from">
            Từ ngày
          </label>
          <input
            id="range-from"
            type="date"
            value={rangeFrom}
            min={minFrom}
            max={rangeTo || today}
            onChange={(event) => setRangeFrom(event.target.value)}
            className="filter-input"
          />
        </div>
        <div className="filter-group">
          <label className="filter-label" htmlFor="range-to">
            Đến ngày
          </label>
          <input
            id="range-to"
            type="date"
            value={rangeTo}
            min={rangeFrom || undefined}
            max={maxTo}
            onChange={(event) => setRangeTo(event.target.value)}
            className="filter-input"
          />
        </div>
        <div className="filter-actions">
          <button type="button" className="btn btn-primary" onClick={handleApplyRange}>
            Áp dụng
          </button>
          <button type="button" className="btn btn-secondary" onClick={handleResetRange}>
            Đặt lại
          </button>
        </div>
        {rangeError && <span className="filter-error">{rangeError}</span>}
      </div>

      {/* Stats Grid */}
      <div className="stats-grid">
        <StatCard
          icon="💰"
          label={rangeActive ? 'Doanh thu trong khoảng' : 'Doanh thu tháng này'}
          value={formatPrice(revenue.totalRevenue)}
          subValue={
            rangeActive
              ? `Từ ${formatDateLabel(appliedRange.from)} đến ${formatDateLabel(appliedRange.to)}`
              : ``
          }
          color="primary"
        />
        <StatCard
          icon="📦"
          label={rangeActive ? 'Tổng đơn hàng trong khoảng' : 'Tổng đơn hàng'}
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
          subValue={`+${users.newCustomers} hôm nay`}
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
              <span className="revenue-label">Trung bình/ngày</span>
              <span className="revenue-value">{formatPrice(dailyAverage)}</span>
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
