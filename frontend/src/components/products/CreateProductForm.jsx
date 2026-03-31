import { useNotification } from '../../contexts';
/**
 * CreateProductForm Component
 * Form for creating new products (Admin)
 * Pattern: Container/Presenter
 */
import React from 'react';
import { useForm } from '../../hooks';
import { productService, uploadService } from '../../services';
import { Button, Input } from '../ui';

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

export function CreateProductForm({ onSuccess, onClose, categories = [], product = null }) {
  const { notifyToast } = useNotification();
  const [success, setSuccess] = React.useState(false);
  const [imageFile, setImageFile] = React.useState(null);
  const [imagePreview, setImagePreview] = React.useState('');
  const [uploadingImage, setUploadingImage] = React.useState(false);
  const [imageRemoved, setImageRemoved] = React.useState(false);

  const isEdit = Boolean(product?.id);

  const form = useForm(
    { name: '', description: '', image_url: '', price: '', stock: '', category_id: '' },
    async (values) => {
      let imageUrl = values.image_url;
      const previousImage = product?.image_url;
      let shouldDeleteOld = false;

      // Upload ảnh nếu có file mới được chọn
      if (imageFile) {
        setUploadingImage(true);
        try {
          const uploadResult = await uploadService.uploadImage(imageFile);
          imageUrl = uploadResult.url;
          // Nếu ảnh cũ là local và đã thay bằng ảnh mới -> xóa ảnh cũ
          if (
            previousImage &&
            previousImage.startsWith('/uploads/') &&
            previousImage !== imageUrl
          ) {
            shouldDeleteOld = true;
          }
        } catch (err) {
          throw new Error('Upload ảnh thất bại: ' + err.message);
        } finally {
          setUploadingImage(false);
        }
      }

      // Nếu người dùng xóa ảnh mà không upload mới
      if (!imageFile && imageRemoved) {
        imageUrl = '';
        if (previousImage && previousImage.startsWith('/uploads/')) {
          shouldDeleteOld = true;
        }
      }

      const payload = {
        ...values,
        image_url: imageUrl,
        price: Number(values.price),
        stock: Number(values.stock),
        category_id: values.category_id ? Number(values.category_id) : null,
      };

      if (isEdit) {
        await productService.update(product.id, payload);
      } else {
        await productService.create(payload);
      }

      // Xóa ảnh cũ (nếu cần) sau khi update/create thành công
      if (shouldDeleteOld) {
        try {
          await uploadService.deleteByPath(previousImage);
        } catch (err) {
          // Không chặn luồng chính nếu xóa file thất bại
          console.warn('Không thể xóa ảnh cũ:', err.message || err);
        }
      }

      setSuccess(true);
      setImageFile(null);
      setImagePreview('');
      setImageRemoved(false);
      form.reset();
      setTimeout(() => {
        setSuccess(false);
        onSuccess?.();
        onClose?.();
      }, 2000);
    },
    validateProduct
  );

  // Prefill form when editing
  React.useEffect(() => {
    if (product) {
      form.setFieldValue('name', product.name || '');
      form.setFieldValue('description', product.description || '');
      form.setFieldValue('image_url', product.image_url || '');
      form.setFieldValue('price', product.price ?? '');
      form.setFieldValue('stock', product.stock ?? '');
      form.setFieldValue('category_id', product.category_id ? String(product.category_id) : '');
      setImagePreview(product.image_url ? uploadService.getImageUrl(product.image_url) : '');
      setImageFile(null);
      setImageRemoved(false);
    } else {
      form.reset();
      setImagePreview('');
      setImageFile(null);
      setImageRemoved(false);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [product]);

  // Xử lý khi chọn file ảnh
  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      // Kiểm tra loại file
      if (!file.type.startsWith('image/')) {
        notifyToast('Vui lòng chọn file ảnh hợp lệ', { type: 'error' });
        return;
      }
      // Kiểm tra kích thước (5MB)
      if (file.size > 5 * 1024 * 1024) {
        notifyToast('Kích thước file không được vượt quá 5MB', { type: 'error' });
        return;
      }
      setImageFile(file);
      // Tạo preview
      const reader = new FileReader();
      reader.onloadend = () => {
        setImagePreview(reader.result);
      };
      reader.readAsDataURL(file);
    }
  };

  // Xóa ảnh đã chọn
  const handleRemoveImage = () => {
    setImageFile(null);
    setImagePreview('');
    setImageRemoved(true);
    form.setFieldValue('image_url', '');
  };

  React.useEffect(() => {
    if (form.submitError) {
      notifyToast(form.submitError, { type: 'error' });
    }
  }, [form.submitError, notifyToast]);

  React.useEffect(() => {
    if (success) {
      notifyToast(isEdit ? 'Cập nhật sản phẩm thành công!' : 'Tạo sản phẩm thành công!', {
        type: 'success',
      });
    }
  }, [success, isEdit, notifyToast]);

  return (
    <div className="modal-overlay">
      <div className="modal" style={{ width: 600, maxWidth: '98vw' }}>
        <div className="modal-header">
          <span className="modal-title">{isEdit ? 'Cập nhật sản phẩm' : 'Thêm Sản Phẩm Mới'}</span>
          <button className="modal-close" onClick={onClose} aria-label="Đóng">
            ×
          </button>
        </div>
        <div className="modal-body">
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
                  {categories.map((cat) => (
                    <option key={cat.id} value={cat.id}>
                      {cat.name}
                    </option>
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
            <div className="form-group">
              <label className="form-label">Hình ảnh sản phẩm</label>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleImageChange}
                  style={{ padding: '8px 0' }}
                />
                {imagePreview && (
                  <div style={{ position: 'relative', display: 'inline-block' }}>
                    <img
                      src={imagePreview}
                      alt="Preview"
                      style={{
                        maxWidth: '200px',
                        maxHeight: '200px',
                        objectFit: 'cover',
                        borderRadius: '8px',
                        border: '1px solid #ddd',
                      }}
                    />
                    <button
                      type="button"
                      onClick={handleRemoveImage}
                      style={{
                        position: 'absolute',
                        top: '-8px',
                        right: '-8px',
                        background: '#ff4444',
                        color: 'white',
                        border: 'none',
                        borderRadius: '50%',
                        width: '24px',
                        height: '24px',
                        cursor: 'pointer',
                        fontSize: '14px',
                      }}
                    >
                      ×
                    </button>
                  </div>
                )}
                {uploadingImage && (
                  <span style={{ color: '#666', fontSize: '14px' }}>Đang upload ảnh...</span>
                )}
              </div>
            </div>
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
              <Button type="submit" loading={form.loading || uploadingImage}>
                {uploadingImage ? 'Đang upload ảnh...' : isEdit ? 'Lưu thay đổi' : 'Tạo Sản Phẩm'}
              </Button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}

export default CreateProductForm;
