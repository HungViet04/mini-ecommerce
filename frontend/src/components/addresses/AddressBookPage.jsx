/**
 * AddressBookPage Component
 * Manage saved shipping addresses
 */
import React, { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { addressService } from '../../services';
import { Card, Button, Input, ErrorAlert, SuccessAlert } from '../ui';

const EMPTY_FORM = {
  fullName: '',
  phone: '',
  province: '',
  district: '',
  ward: '',
  address: '',
  note: '',
  type: 'home',
  isDefault: false,
};

const TYPE_LABELS = {
  home: 'Nhà riêng',
  office: 'Cơ quan',
  other: 'Khác',
};

export function AddressBookPage() {
  const navigate = useNavigate();
  const [addresses, setAddresses] = useState([]);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [editingId, setEditingId] = useState(null);
  const [formData, setFormData] = useState(EMPTY_FORM);
  const [touched, setTouched] = useState({});
  const [fieldErrors, setFieldErrors] = useState({});

  const isEditing = Boolean(editingId);

  const loadAddresses = async () => {
    setLoading(true);
    setError('');
    try {
      const result = await addressService.getMyAddresses();
      setAddresses(result || []);
    } catch (err) {
      setError(err.message || 'Không thể tải địa chỉ');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadAddresses();
  }, []);

  const resetForm = () => {
    setFormData({ ...EMPTY_FORM, isDefault: !defaultAddressId });
    setTouched({});
    setFieldErrors({});
    setEditingId(null);
  };

  const handleEdit = (address) => {
    setEditingId(address.id);
    setFormData({
      fullName: address.fullName,
      phone: address.phone,
      province: address.province,
      district: address.district,
      ward: address.ward,
      address: address.address,
      note: address.note || '',
      type: address.type || 'home',
      isDefault: address.isDefault,
    });
    setTouched({});
    setFieldErrors({});
  };

  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target;
    const nextValue = type === 'checkbox' ? checked : value;
    setFormData((prev) => ({ ...prev, [name]: nextValue }));
    setFieldErrors((prev) => ({ ...prev, [name]: undefined }));
  };

  const handleBlur = (e) => {
    const { name } = e.target;
    setTouched((prev) => ({ ...prev, [name]: true }));
  };

  const validateForm = () => {
    const errors = {};

    if (!formData.fullName.trim()) errors.fullName = 'Vui lòng nhập họ tên';
    if (!formData.phone.trim()) {
      errors.phone = 'Vui lòng nhập số điện thoại';
    } else if (!/^(0[3|5|7|8|9])+([0-9]{8})$/.test(formData.phone)) {
      errors.phone = 'Số điện thoại không hợp lệ';
    }
    if (!formData.province.trim()) errors.province = 'Vui lòng nhập Tỉnh/Thành phố';
    if (!formData.district.trim()) errors.district = 'Vui lòng nhập Quận/Huyện';
    if (!formData.ward.trim()) errors.ward = 'Vui lòng nhập Phường/Xã';
    if (!formData.address.trim()) errors.address = 'Vui lòng nhập địa chỉ cụ thể';

    setFieldErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSuccess('');
    if (!validateForm()) {
      setTouched({
        fullName: true,
        phone: true,
        province: true,
        district: true,
        ward: true,
        address: true,
      });
      return;
    }

    setSaving(true);
    setError('');
    try {
      const payload = {
        fullName: formData.fullName,
        phone: formData.phone,
        province: formData.province,
        district: formData.district,
        ward: formData.ward,
        address: formData.address,
        note: formData.note,
        type: formData.type,
        isDefault: formData.isDefault,
      };

      if (isEditing) {
        await addressService.update(editingId, payload);
        setSuccess('Cập nhật địa chỉ thành công');
      } else {
        await addressService.create(payload);
        setSuccess('Thêm địa chỉ thành công');
      }

      resetForm();
      await loadAddresses();
    } catch (err) {
      setError(err.message || 'Không thể lưu địa chỉ');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (address) => {
    if (!window.confirm(`Bạn có chắc muốn xóa địa chỉ của "${address.fullName}"?`)) {
      return;
    }
    setError('');
    setSuccess('');
    try {
      await addressService.remove(address.id);
      await loadAddresses();
      if (editingId === address.id) {
        resetForm();
      }
    } catch (err) {
      setError(err.message || 'Không thể xóa địa chỉ');
    }
  };

  const handleSetDefault = async (address) => {
    setError('');
    setSuccess('');
    try {
      await addressService.setDefault(address.id);
      await loadAddresses();
    } catch (err) {
      setError(err.message || 'Không thể đặt mặc định');
    }
  };

  const defaultAddressId = useMemo(() => {
    const defaultAddress = addresses.find((item) => item.isDefault);
    return defaultAddress?.id || null;
  }, [addresses]);

  return (
    <div className="address-book-page">
      <button className="back-button" onClick={() => navigate('/')}>
        ← Quay về Trang Chủ
      </button>

      <div className="address-header">
        <div>
          <h1 className="address-title">Sổ Địa Chỉ</h1>
          <p className="address-subtitle">Quản lý thông tin nhận hàng của bạn</p>
        </div>
        <Button variant="secondary" onClick={resetForm}>
          + Thêm địa chỉ mới
        </Button>
      </div>

      {error && <ErrorAlert message={error} onDismiss={() => setError('')} />}
      {success && <SuccessAlert message={success} onDismiss={() => setSuccess('')} />}

      <div className="address-grid">
        <Card className="address-list-card">
          <h2 className="section-title">Danh sách địa chỉ</h2>

          {loading ? (
            <p className="empty-text">Đang tải địa chỉ...</p>
          ) : addresses.length === 0 ? (
            <div className="empty-container">
              <span className="empty-icon">📭</span>
              <p className="empty-text">Bạn chưa có địa chỉ nào</p>
            </div>
          ) : (
            <div className="address-list">
              {addresses.map((address) => (
                <div
                  key={address.id}
                  className={`address-item ${address.isDefault ? 'default' : ''}`}
                >
                  <div className="address-item-header">
                    <div>
                      <div className="address-item-name">
                        {address.fullName}
                        {address.isDefault && <span className="address-badge">Mặc định</span>}
                      </div>
                      <div className="address-item-meta">
                        {TYPE_LABELS[address.type] || 'Khác'} · {address.phone}
                      </div>
                    </div>
                    {!address.isDefault && (
                      <Button variant="ghost" size="sm" onClick={() => handleSetDefault(address)}>
                        Đặt mặc định
                      </Button>
                    )}
                  </div>

                  <div className="address-item-body">
                    <p>
                      {address.address}, {address.ward}, {address.district}, {address.province}
                    </p>
                    {address.note && <p className="address-note">Ghi chú: {address.note}</p>}
                  </div>

                  <div className="address-item-actions">
                    <Button variant="secondary" size="sm" onClick={() => handleEdit(address)}>
                      Chỉnh sửa
                    </Button>
                    <Button variant="danger" size="sm" onClick={() => handleDelete(address)}>
                      Xóa
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </Card>

        <Card className="address-form-card">
          <h2 className="section-title">{isEditing ? 'Cập nhật địa chỉ' : 'Thêm địa chỉ'}</h2>
          <form onSubmit={handleSubmit}>
            <div className="form-grid">
              <Input
                label="Họ và tên"
                name="fullName"
                value={formData.fullName}
                onChange={handleInputChange}
                onBlur={handleBlur}
                error={fieldErrors.fullName}
                touched={touched.fullName}
                required
              />
              <Input
                label="Số điện thoại"
                name="phone"
                value={formData.phone}
                onChange={handleInputChange}
                onBlur={handleBlur}
                error={fieldErrors.phone}
                touched={touched.phone}
                required
              />
              <Input
                label="Tỉnh/Thành phố"
                name="province"
                value={formData.province}
                onChange={handleInputChange}
                onBlur={handleBlur}
                error={fieldErrors.province}
                touched={touched.province}
                required
              />
              <Input
                label="Quận/Huyện"
                name="district"
                value={formData.district}
                onChange={handleInputChange}
                onBlur={handleBlur}
                error={fieldErrors.district}
                touched={touched.district}
                required
              />
              <Input
                label="Phường/Xã"
                name="ward"
                value={formData.ward}
                onChange={handleInputChange}
                onBlur={handleBlur}
                error={fieldErrors.ward}
                touched={touched.ward}
                required
              />
              <Input
                label="Địa chỉ cụ thể"
                name="address"
                value={formData.address}
                onChange={handleInputChange}
                onBlur={handleBlur}
                error={fieldErrors.address}
                touched={touched.address}
                required
              />
            </div>

            <div className="form-grid form-grid-compact">
              <div className="form-group">
                <label htmlFor="type" className="form-label">
                  Loại địa chỉ
                </label>
                <select
                  id="type"
                  name="type"
                  className="form-input"
                  value={formData.type}
                  onChange={handleInputChange}
                >
                  <option value="home">Nhà riêng</option>
                  <option value="office">Cơ quan</option>
                  <option value="other">Khác</option>
                </select>
              </div>
              <Input
                label="Ghi chú"
                name="note"
                value={formData.note}
                onChange={handleInputChange}
                placeholder="VD: Giao giờ hành chính"
              />
            </div>

            <label className="checkbox-field">
              <input
                type="checkbox"
                name="isDefault"
                checked={formData.isDefault}
                onChange={handleInputChange}
              />
              Đặt làm địa chỉ mặc định
            </label>

            <div className="address-form-actions">
              <Button type="submit" loading={saving}>
                {isEditing ? 'Lưu thay đổi' : 'Thêm địa chỉ'}
              </Button>
              {isEditing && (
                <Button variant="ghost" onClick={resetForm}>
                  Hủy
                </Button>
              )}
            </div>
          </form>
        </Card>
      </div>
    </div>
  );
}

export default AddressBookPage;
