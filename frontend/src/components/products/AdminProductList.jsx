/**
 * AdminProductList Component
 * Product management for admin (CRUD)
 */
import React, { useState } from 'react';
import { useProducts, useCategories } from '../../hooks';
import { productService } from '../../services';
import { Card, Button, Input, ErrorAlert, SuccessAlert } from '../ui';
import CreateProductForm from './CreateProductForm';
import { formatPrice } from '../../utils';

/**
 * Validate product form
 */
function validateProduct(values) {
  const errors = {};

  if (!values.name?.trim()) {
    errors.name = 'Vui lòng nhập tên sản phẩm';
  }

  if (!values.price) {
    errors.price = 'Vui lòng nhập giá sản phẩm';
  } else if (isNaN(values.price) || Number(values.price) <= 0) {
    errors.price = 'Giá phải là số dương';
  }

  if (values.stock === '' || values.stock === undefined) {
    errors.stock = 'Vui lòng nhập số lượng tồn kho';
  } else if (isNaN(values.stock) || Number(values.stock) < 0) {
    errors.stock = 'Số lượng phải là số không âm';
  }

  return errors;
}

export function AdminProductList() {
  const { products, loading, refetch } = useProducts();
  const { categories } = useCategories();
  const [editingProduct, setEditingProduct] = useState(null);
  const [showForm, setShowForm] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    image_url: '',
    price: '',
    stock: '',
    category_id: ''
  });
  const [errors, setErrors] = useState({});
  const [submitError, setSubmitError] = useState('');
  const [success, setSuccess] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [deleteConfirm, setDeleteConfirm] = useState(null);

  const resetForm = () => {
    setFormData({
      name: '',
      description: '',
      image_url: '',
      price: '',
      stock: '',
      category_id: ''
    });
    setErrors({});
    setSubmitError('');
    setEditingProduct(null);
  };

  const handleOpenCreate = () => {
    resetForm();
    setShowForm(true);
  };

  const handleOpenEdit = (product) => {
    setFormData({
      name: product.name || '',
      description: product.description || '',
      image_url: product.image_url || '',
      price: product.price?.toString() || '',
      stock: product.stock?.toString() || '',
      category_id: product.category_id?.toString() || ''
    });
    setEditingProduct(product);
    setShowForm(true);
    setErrors({});
    setSubmitError('');
  };

  const handleCancel = () => {
    setShowForm(false);
    resetForm();
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    // Clear error when user types
    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: '' }));
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    const validationErrors = validateProduct(formData);
    if (Object.keys(validationErrors).length > 0) {
      setErrors(validationErrors);
      return;
    }

    setSubmitting(true);
    setSubmitError('');

    try {
      const data = {
        name: formData.name.trim(),
        description: formData.description.trim(),
        image_url: formData.image_url.trim(),
        price: Number(formData.price),
        stock: Number(formData.stock),
        category_id: formData.category_id ? Number(formData.category_id) : null
      };

      if (editingProduct) {
        await productService.update(editingProduct.id, data);
        setSuccess('Cập nhật sản phẩm thành công!');
      } else {
        await productService.create(data);
        setSuccess('Tạo sản phẩm thành công!');
      }

      setShowForm(false);
      resetForm();
      refetch();
      
      setTimeout(() => setSuccess(''), 3000);
    } catch (err) {
      setSubmitError(err.message || 'Có lỗi xảy ra');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (product) => {
    if (deleteConfirm !== product.id) {
      setDeleteConfirm(product.id);
      return;
    }

    try {
      await productService.delete(product.id);
      setSuccess('Xóa sản phẩm thành công!');
      setDeleteConfirm(null);
      refetch();
      setTimeout(() => setSuccess(''), 3000);
    } catch (err) {
      setSubmitError(err.message || 'Không thể xóa sản phẩm');
    }
  };

  const getCategoryName = (categoryId) => {
    const category = categories.find(c => c.id === categoryId);
    return category?.name || 'Không có';
  };

  return (
    <div className="admin-products">
      <div className="section-header">
        <div>
          <h1 className="section-title">Quản Lý Sản Phẩm</h1>
          <p className="section-subtitle">Thêm, sửa, xóa sản phẩm trong cửa hàng</p>
        </div>
        {!showForm && (
          <Button variant="primary" onClick={handleOpenCreate}>
            + Thêm Sản Phẩm
          </Button>
        )}
      </div>

      {success && <SuccessAlert message={success} />}
      {submitError && !showForm && <ErrorAlert message={submitError} />}

      {/* Product Form Modal */}
      {showForm && (
        <CreateProductForm
          onSuccess={refetch}
          onClose={handleCancel}
          categories={categories}
        />
      )}

      {/* Products Table */}
      <Card className="products-table-card">
        <div className="table-header">
          <span className="products-count">{products.length} sản phẩm</span>
        </div>

        {loading ? (
          <div className="loading-state">Đang tải...</div>
        ) : products.length === 0 ? (
          <div className="empty-state">
            <span className="empty-icon">📦</span>
            <p>Chưa có sản phẩm nào</p>
          </div>
        ) : (
          <div className="products-table-wrapper">
            <table className="products-table">
              <thead>
                <tr>
                  <th>Hình ảnh</th>
                  <th>Tên sản phẩm</th>
                  <th>Danh mục</th>
                  <th>Giá</th>
                  <th>Tồn kho</th>
                  <th>Thao tác</th>
                </tr>
              </thead>
              <tbody>
                {products.map(product => (
                  <tr key={product.id}>
                    <td>
                      <div className="product-thumb">
                        {product.image_url ? (
                          <img src={product.image_url} alt={product.name} />
                        ) : (
                          <span className="no-image">📦</span>
                        )}
                      </div>
                    </td>
                    <td>
                      <div className="product-name">{product.name}</div>
                      {product.description && (
                        <div className="product-desc">{product.description.substring(0, 50)}...</div>
                      )}
                    </td>
                    <td>{getCategoryName(product.category_id)}</td>
                    <td className="price-cell">{formatPrice(product.price)}</td>
                    <td>
                      <span className={`stock-badge ${product.stock <= 5 ? 'low' : ''}`}>
                        {product.stock}
                      </span>
                    </td>
                    <td>
                      <div className="action-buttons">
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => handleOpenEdit(product)}
                        >
                          ✏️ Sửa
                        </Button>
                        <Button
                          size="sm"
                          variant={deleteConfirm === product.id ? 'danger' : 'ghost'}
                          onClick={() => handleDelete(product)}
                        >
                          {deleteConfirm === product.id ? 'Xác nhận xóa?' : '🗑️ Xóa'}
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>
    </div>
  );
}

export default AdminProductList;
