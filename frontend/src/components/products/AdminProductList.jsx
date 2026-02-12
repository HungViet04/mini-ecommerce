/**
 * AdminProductList Component
 * Product management for admin (CRUD)
 */
import React, { useState } from 'react';
import { useProducts, useCategories } from '../../hooks';
import { productService, uploadService } from '../../services';
import { Card, Button, ErrorAlert, SuccessAlert } from '../ui';
import CreateProductForm from './CreateProductForm';
import { formatPrice } from '../../utils';

export function AdminProductList() {
  const { products, loading, refetch } = useProducts();
  const { categories } = useCategories();
  const [editingProduct, setEditingProduct] = useState(null);
  const [showForm, setShowForm] = useState(false);
  const [submitError, setSubmitError] = useState('');
  const [success, setSuccess] = useState('');
  const [deleteConfirm, setDeleteConfirm] = useState(null);

  const resetForm = () => {
    setEditingProduct(null);
    setSubmitError('');
  };

  const handleOpenCreate = () => {
    resetForm();
    setShowForm(true);
  };

  const handleOpenEdit = (product) => {
    setEditingProduct(product);
    setShowForm(true);
    setSubmitError('');
  };

  const handleCancel = () => {
    setShowForm(false);
    resetForm();
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
    const category = categories.find((c) => c.id === categoryId);
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
          product={editingProduct}
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
                {products.map((product) => (
                  <tr key={product.id}>
                    <td>
                      <div className="product-thumb">
                        {product.image_url ? (
                          <img
                            src={uploadService.getImageUrl(product.image_url)}
                            alt={product.name}
                          />
                        ) : (
                          <span className="no-image">📦</span>
                        )}
                      </div>
                    </td>
                    <td>
                      <div className="product-name">{product.name}</div>
                      {product.description && (
                        <div className="product-desc">
                          {product.description.substring(0, 50)}...
                        </div>
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
                          variant="secondary"
                          onClick={() => handleOpenEdit(product)}
                        >
                          ✏️ Sửa
                        </Button>
                        <Button
                          size="sm"
                          variant={deleteConfirm === product.id ? 'danger' : 'secondary'}
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
