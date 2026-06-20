/**
 * AdminTopProductsReport
 * Report page for top products by quantity + revenue
 */
import React, { useEffect, useMemo, useState } from 'react';
import { useAuth } from '../../contexts';
import { reportsService, categoryService } from '../../services';
import { Button, Card, Loading } from '../ui';
import { formatPrice } from '../../utils';

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
  const d = new Date(year, month - 1, day);
  if (d.getFullYear() !== year || d.getMonth() !== month - 1 || d.getDate() !== day) return null;
  d.setHours(0, 0, 0, 0);
  return d;
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

export function AdminTopProductsReport() {
  const { isAuthenticated, isAdmin } = useAuth();

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const today = useMemo(() => {
    const d = new Date();
    d.setHours(0, 0, 0, 0);
    return d;
  }, []);

  const defaultRangeDays = 30;
  const defaultFrom = useMemo(() => {
    const d = new Date(today);
    d.setDate(today.getDate() - (defaultRangeDays - 1));
    return d;
  }, [today]);

  const [from, setFrom] = useState(toInputDate(defaultFrom));
  const [to, setTo] = useState(toInputDate(today));

  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [selectedCategoryId, setSelectedCategoryId] = useState('');
  const [selectedProductIds, setSelectedProductIds] = useState([]);


  const [rows, setRows] = useState([]);

  useEffect(() => {
    const loadProductsAndCategories = async () => {
      try {
        const [productsRes, categoriesRes] = await Promise.all([
          reportsService.getProductsForReport(200),
          categoryService.getAll(),
        ]);
        setProducts(productsRes || []);
        setCategories(categoriesRes || []);
      } catch (e) {
        setError(e?.message || 'Không thể tải danh sách sản phẩm');
      }
    };
    if (isAuthenticated && isAdmin) loadProductsAndCategories();
  }, [isAuthenticated, isAdmin]);

  const validateRange = (fromValue, toValue) => {
    const fromDate = parseInputDate(fromValue);
    const toDate = parseInputDate(toValue);

    // Allow empty dates - means no date filter
    if (!fromDate && !toDate) return null;

    // If one date is provided, the other must also be provided
    if (!fromDate || !toDate) return 'Vui lòng chọn đầy đủ ngày bắt đầu và kết thúc';

    // From date must be <= to date
    if (fromDate.getTime() > toDate.getTime()) return 'Ngày bắt đầu phải nhỏ hơn hoặc bằng ngày kết thúc';

    // Max range is 2 months when both dates are provided
    const maxEnd = addMonthsLocal(fromDate, 2);
    if (toDate.getTime() > maxEnd.getTime()) return 'Khoảng thời gian tối đa là 2 tháng';
    return null;
  };

  const fetchReport = async ({ doSetLoading = true } = {}) => {
    if (doSetLoading) setLoading(true);
    setError(null);

    const rangeError = validateRange(from, to);
    if (rangeError) {
      setError(rangeError);
      setLoading(false);
      return;
    }

    try {
      const res = await reportsService.getTopProductsReport({
        from,
        to,
        categoryId: selectedCategoryId || null,
        productIds: selectedProductIds,
      });
      setRows(res?.data || res || []);
    } catch (e) {
      setError(e?.message || 'Không thể tải báo cáo');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isAuthenticated && isAdmin) {
      fetchReport({ doSetLoading: true });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isAuthenticated, isAdmin]);

  const productsInCategory = useMemo(() => {
    if (!selectedCategoryId) return products;
    return products.filter((p) => Number(p.categoryId) === Number(selectedCategoryId));
  }, [products, selectedCategoryId]);

  const handleToggleProduct = (id) => {
    setSelectedProductIds((prev) => {
      if (prev.includes(id)) return prev.filter((x) => x !== id);
      return [...prev, id];
    });
  };


  const handleExportCsv = async () => {
    const rangeError = validateRange(from, to);
    if (rangeError) {
      setError(rangeError);
      return;
    }

    try {
      setError(null);
      const blob = await reportsService.downloadTopProductsCsv({
        from,
        to,
        categoryId: selectedCategoryId || null,
        productIds: selectedProductIds,
      });

      // Trigger download from blob
      const url = window.URL.createObjectURL(blob);


      const a = document.createElement('a');
      a.href = url;
      a.download = `top_products_${from}_to_${to}.csv`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      window.URL.revokeObjectURL(url);
    } catch (e) {
      setError(e?.message || 'Không thể xuất CSV');
    }
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

  return (
    <div className="admin-dashboard">
      <div className="dashboard-header">
        <h1>📊 Báo cáo thống kê</h1>
        <p className="dashboard-subtitle">Top sản phẩm theo số lượng bán & doanh thu</p>
      </div>

      <div className="dashboard-filter">
        <div className="filter-group">
          <label className="filter-label" htmlFor="from">Từ ngày</label>
          <input
            id="from"
            type="date"
            value={from}
            onChange={(e) => setFrom(e.target.value)}
            className="filter-input"
          />
        </div>
        <div className="filter-group">
          <label className="filter-label" htmlFor="to">Đến ngày</label>
          <input
            id="to"
            type="date"
            value={to}
            onChange={(e) => setTo(e.target.value)}
            className="filter-input"
          />
        </div>

        <div className="filter-actions">
          <button className="btn btn-primary" type="button" onClick={() => fetchReport({ doSetLoading: true })}>
            Áp dụng
          </button>
          <button className="btn btn-secondary" type="button" onClick={() => {
            setFrom(toInputDate(defaultFrom));
            setTo(toInputDate(today));
            setSelectedCategoryId('');
            setSelectedProductIds([]);
            fetchReport({ doSetLoading: true });
          }}>
            Đặt lại
          </button>
        </div>

        <div style={{ width: '100%' }} />

        <div className="filter-group" style={{ width: '100%' }}>
          <label className="filter-label">Chọn theo danh mục → sản phẩm (tuỳ chọn)</label>

          <div style={{ display: 'grid', gridTemplateColumns: '280px 1fr', gap: 12 }}>
            <div style={{ minWidth: 0 }}>
              <label style={{ display: 'block', fontSize: 13, color: '#475569', marginBottom: 6 }}>
                Danh mục
              </label>
              <select
                className="filter-input"
                value={selectedCategoryId}
                onChange={(e) => {
                  const next = e.target.value === '' ? '' : Number(e.target.value);
                  setSelectedCategoryId(next);
                  setSelectedProductIds([]);
                }}
              >
                <option value="">Tất cả danh mục</option>
                {categories.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name}
                  </option>
                ))}
              </select>
            </div>

            <div style={{ minWidth: 0 }}>
              <label style={{ display: 'block', fontSize: 13, color: '#475569', marginBottom: 6 }}>
                Sản phẩm (bấm để chọn)
              </label>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, maxHeight: 160, overflowY: 'auto', paddingRight: 6 }}>
                {productsInCategory.map((p) => {
                  const isSelected = selectedProductIds.includes(p.id);
                  return (
                    <label
                      key={p.id}
                      style={{
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: 6,
                        padding: '4px 10px',
                        border: isSelected ? '1px solid #3b82f6' : '1px solid #e2e8f0',
                        borderRadius: 999,
                        background: isSelected ? '#eff6ff' : '#f8fafc',
                        color: isSelected ? '#1d4ed8' : '#334155',
                        fontSize: 12,
                        cursor: 'pointer',
                        userSelect: 'none',
                      }}
                    >
                      <input
                        type="checkbox"
                        checked={isSelected}
                        onChange={() => handleToggleProduct(p.id)}
                        style={{ width: 14, height: 14, cursor: 'pointer' }}
                      />
                      {p.name}
                    </label>
                  );
                })}
                {productsInCategory.length === 0 && (
                  <span style={{ color: '#64748b', fontSize: 13 }}>Không có sản phẩm trong danh mục này</span>
                )}
              </div>
            </div>
          </div>
        </div>

        {error && <span className="filter-error">{error}</span>}
      </div>

      <div className="dashboard-row">
        <Card className="dashboard-card">
          <div className="flex-between" style={{ gap: 16 }}>
            <h3 style={{ marginBottom: 0 }}>📈 Bảng thống kê</h3>
            <Button variant="secondary" onClick={handleExportCsv} loading={loading}>
              ⬇️ Xuất CSV
            </Button>
          </div>

          {loading ? (
            <Loading text="Đang tải báo cáo..." />
          ) : rows.length === 0 ? (
            <p className="empty-text">Chưa có dữ liệu theo tiêu chí</p>
          ) : (
            <div className="products-table-wrapper" style={{ marginTop: 16 }}>
              <table className="products-table" style={{ minWidth: 800 }}>
                <thead>
                  <tr>
                    <th>Sản phẩm</th>
                    <th>Số lượng bán</th>
                    <th>Doanh thu</th>
                    <th>Giá bán TB</th>
                  </tr>
                </thead>
                <tbody>
                  {rows.map((r) => (
                    <tr key={r.productId}>
                      <td style={{ fontWeight: 600 }}>{r.productName}</td>
                      <td>{r.totalQuantity}</td>
                      <td style={{ color: '#10b981', fontWeight: 700 }}>{formatPrice(r.totalRevenue)}</td>
                      <td>{formatPrice(r.avgPrice)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </Card>
      </div>
    </div>
  );
}

export default AdminTopProductsReport;

