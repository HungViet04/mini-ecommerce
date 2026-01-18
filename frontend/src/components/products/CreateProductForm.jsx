/**
 * CreateProductForm Component
 * Form for creating new products (Admin)
 * Pattern: Container/Presenter
 */
import React from 'react';
import { useForm } from '../../hooks';
import { productService } from '../../services';
import { Button, Input, ErrorAlert, SuccessAlert } from '../ui';

/**
 * Validate product form
 */
function validateProduct(values) {
  const errors = {};

  if (!values.name) {
    errors.name = 'Vui lòng nhập tên sản phẩm';
  }

  if (!values.price) {
    errors.price = 'Vui lòng nhập giá sản phẩm';
  } else if (isNaN(values.price) || Number(values.price) <= 0) {
    errors.price = 'Giá phải là số dương';
  }

  if (!values.stock) {
    errors.stock = 'Vui lòng nhập số lượng tồn kho';
  } else if (isNaN(values.stock) || Number(values.stock) < 0) {
    errors.stock = 'Số lượng phải là số không âm';
  }

  return errors;
}

export function CreateProductForm({ onSuccess, onClose, categories = [] }) {
  const [success, setSuccess] = React.useState(false);

  const form = useForm(
    { name: '', description: '', image_url: '', price: '', stock: '', category_id: '' },
    async (values) => {
      await productService.create(values);
      setSuccess(true);
      form.reset();
      setTimeout(() => {
        setSuccess(false);
        onSuccess?.();
        onClose?.();
      }, 2000);
    },
    validateProduct
  );

  return (
    <div className="modal-overlay">
      <div className="modal" style={{ width: 600, maxWidth: '98vw' }}>
        <div className="modal-header">
          <span className="modal-title">Thêm Sản Phẩm Mới</span>
          <button className="modal-close" onClick={onClose} aria-label="Đóng">×</button>
        </div>
        <div className="modal-body">
          <ErrorAlert message={form.submitError} />
          {success && <SuccessAlert message="Tạo sản phẩm thành công!" />}
          <form className="product-form" onSubmit={form.handleSubmit}>
            <div className="form-row">
              <div className="form-group" style={{ flex: 1 }}>
                <Input
                  label="Tên sản phẩm"
                  name="name"
                  placeholder="Nhập tên sản phẩm"
                  value={form.values.name}
                  error={form.errors.name}
                  touched={form.touched.name}
                  onChange={form.handleChange}
                  onBlur={form.handleBlur}
                  required
                />
              </div>
              <div className="form-group" style={{ flex: 1 }}>
                <label className="form-label">Danh mục</label>
                <select
                  name="category_id"
                  className="form-select"
                  value={form.values.category_id}
                  onChange={form.handleChange}
                >
                  <option value="">-- Chọn danh mục --</option>
                  {categories.map(cat => (
                    <option key={cat.id} value={cat.id}>{cat.name}</option>
                  ))}
                </select>
              </div>
            </div>
            <div className="form-group">
              <label className="form-label">Mô tả</label>
              <textarea
                name="description"
                className="form-textarea"
                placeholder="Nhập mô tả sản phẩm..."
                value={form.values.description}
                onChange={form.handleChange}
                rows={3}
              />
            </div>
            <Input
              label="URL hình ảnh"
              name="image_url"
              placeholder="https://example.com/image.jpg"
              value={form.values.image_url}
              onChange={form.handleChange}
            />
            <div className="form-row">
              <div className="form-group" style={{ flex: 1 }}>
                <Input
                  label="Giá (VNĐ)"
                  name="price"
                  type="number"
                  placeholder="0"
                  value={form.values.price}
                  error={form.errors.price}
                  touched={form.touched.price}
                  onChange={form.handleChange}
                  onBlur={form.handleBlur}
                  required
                />
              </div>
              <div className="form-group" style={{ flex: 1 }}>
                <Input
                  label="Số lượng tồn kho"
                  name="stock"
                  type="number"
                  placeholder="0"
                  value={form.values.stock}
                  error={form.errors.stock}
                  touched={form.touched.stock}
                  onChange={form.handleChange}
                  onBlur={form.handleBlur}
                  required
                />
              </div>
            </div>
            <div className="form-actions">
              <Button type="submit" loading={form.loading}>
                Tạo Sản Phẩm
              </Button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}

export default CreateProductForm;
