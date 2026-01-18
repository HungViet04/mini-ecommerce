/**
 * AdminCategoryList Component
 * Admin view for category management (CRUD)
 * Pattern: Container Component
 */
import React, { useState } from 'react';
import { useAdminCategories } from '../../hooks';
import { useAuth } from '../../contexts';
import { Card, Button, Input, Loading, ErrorAlert, SuccessAlert } from '../ui';

export function AdminCategoryList() {
  const { isAuthenticated, isAdmin } = useAuth();
  const {
    categories,
    loading,
    error,
    saving,
    createCategory,
    updateCategory,
    deleteCategory,
    clearError,
    refetch,
  } = useAdminCategories({ autoFetch: isAuthenticated && isAdmin });

  const [showForm, setShowForm] = useState(false);
  const [editingCategory, setEditingCategory] = useState(null);
  const [formData, setFormData] = useState({ name: '' });
  const [formError, setFormError] = useState('');
  const [successMessage, setSuccessMessage] = useState('');

  if (!isAuthenticated) {
    return (
      <div className="categories-container">
        <div className="empty-container">
          <span className="empty-icon">🔒</span>
          <p>Vui lòng đăng nhập để truy cập trang này</p>
        </div>
      </div>
    );
  }

  if (!isAdmin) {
    return (
      <div className="categories-container">
        <div className="empty-container">
          <span className="empty-icon">⛔</span>
          <p>Truy cập bị từ chối. Chỉ dành cho Quản trị viên.</p>
        </div>
      </div>
    );
  }

  const handleOpenCreateForm = () => {
    setEditingCategory(null);
    setFormData({ name: '' });
    setFormError('');
    setShowForm(true);
  };

  const handleOpenEditForm = (category) => {
    setEditingCategory(category);
    setFormData({ name: category.name });
    setFormError('');
    setShowForm(true);
  };

  const handleCloseForm = () => {
    setShowForm(false);
    setEditingCategory(null);
    setFormData({ name: '' });
    setFormError('');
  };

  const handleInputChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
    setFormError('');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!formData.name.trim()) {
      setFormError('Vui lòng nhập tên danh mục');
      return;
    }

    let result;
    if (editingCategory) {
      result = await updateCategory(editingCategory.id, { name: formData.name.trim() });
      if (result) {
        setSuccessMessage('Cập nhật danh mục thành công!');
      }
    } else {
      result = await createCategory({ name: formData.name.trim() });
      if (result) {
        setSuccessMessage('Tạo danh mục thành công!');
      }
    }

    if (result) {
      handleCloseForm();
      setTimeout(() => setSuccessMessage(''), 3000);
    }
  };

  const handleDelete = async (category) => {
    if (window.confirm(`Bạn có chắc muốn xóa danh mục "${category.name}"?`)) {
      const success = await deleteCategory(category.id);
      if (success) {
        setSuccessMessage('Xóa danh mục thành công!');
        setTimeout(() => setSuccessMessage(''), 3000);
      }
    }
  };

  return (
    <section className="categories-section admin-categories">
      <div className="section-header">
        <h1 className="section-title">📂 Quản Lý Danh Mục</h1>
        <p className="section-subtitle">Tạo, chỉnh sửa và xóa danh mục sản phẩm</p>
      </div>

      <div className="categories-actions">
        <Button variant="primary" onClick={handleOpenCreateForm}>
          ➕ Tạo Danh Mục Mới
        </Button>
        <Button variant="ghost" size="sm" onClick={refetch} disabled={loading}>
          🔄 Làm mới
        </Button>
      </div>

      {error && <ErrorAlert message={error} onDismiss={clearError} />}
      {successMessage && <SuccessAlert message={successMessage} />}

      {/* Create/Edit Form Modal */}
      {showForm && (
        <div className="modal-overlay" onClick={handleCloseForm}>
          <Card className="modal-content category-form-modal" onClick={(e) => e.stopPropagation()}>
            <h3 className="modal-title">
              {editingCategory ? '✏️ Chỉnh Sửa Danh Mục' : '➕ Tạo Danh Mục Mới'}
            </h3>
            
            <form onSubmit={handleSubmit}>
              {formError && <ErrorAlert message={formError} />}
              
              <Input
                label="Tên danh mục"
                name="name"
                placeholder="Nhập tên danh mục..."
                value={formData.name}
                onChange={handleInputChange}
                required
                autoFocus
              />
              
              <div className="modal-actions">
                <Button variant="ghost" type="button" onClick={handleCloseForm}>
                  Hủy
                </Button>
                <Button variant="primary" type="submit" loading={saving}>
                  {editingCategory ? 'Cập Nhật' : 'Tạo Mới'}
                </Button>
              </div>
            </form>
          </Card>
        </div>
      )}

      {/* Category List */}
      {loading ? (
        <Loading text="Đang tải danh mục..." />
      ) : categories.length === 0 ? (
        <div className="empty-container">
          <span className="empty-icon">📂</span>
          <p>Chưa có danh mục nào</p>
          <p className="muted">Tạo danh mục đầu tiên của bạn</p>
        </div>
      ) : (
        <div className="categories-list">
          <Card className="categories-table-card">
            <table className="categories-table">
              <thead>
                <tr>
                  <th>ID</th>
                  <th>Tên Danh Mục</th>
                  <th>Thao Tác</th>
                </tr>
              </thead>
              <tbody>
                {categories.map((category) => (
                  <tr key={category.id}>
                    <td className="category-id">#{category.id}</td>
                    <td className="category-name">{category.name}</td>
                    <td className="category-actions">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleOpenEditForm(category)}
                      >
                        ✏️ Sửa
                      </Button>
                      <Button
                        variant="danger"
                        size="sm"
                        onClick={() => handleDelete(category)}
                        disabled={saving}
                      >
                        🗑️ Xóa
                      </Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </Card>
          
          <div className="categories-stats">
            <span>Tổng cộng: {categories.length} danh mục</span>
          </div>
        </div>
      )}
    </section>
  );
}

export default AdminCategoryList;
