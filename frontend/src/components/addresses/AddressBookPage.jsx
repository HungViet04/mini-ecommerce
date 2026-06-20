/**
 * AddressBookPage Component
 * Manage saved shipping addresses
 */
import React, { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { addressService } from '../../services';
import { Button, Input, ErrorAlert, SuccessAlert } from '../ui';

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

const TYPE_ICONS = {
  home: '🏠',
  office: '🏢',
  other: '📍',
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
        <Button variant="primary" onClick={resetForm}>
          + Thêm địa chỉ mới
        </Button>
      </div>

      {error && <ErrorAlert message={error} onDismiss={() => setError('')} />}
      {success && <SuccessAlert message={success} onDismiss={() => setSuccess('')} />}

      <div className="address-layout">
        {/* Address List - Left Side */}
        <div className="address-list-section">
          {loading ? (
            <div className="address-list-card">
              <div className="loading-state">
                <span className="loading-spinner"></span>
                <p>Đang tải địa chỉ...</p>
              </div>
            </div>
          ) : addresses.length === 0 ? (
            <div className="address-list-card">
              <div className="empty-state">
                <div className="empty-icon-wrapper">
                  <span className="empty-icon">📭</span>
                </div>
                <h3 className="empty-title">Chưa có địa chỉ nào</h3>
                <p className="empty-desc">Thêm địa chỉ giao hàng để mua sắm nhanh hơn</p>
              </div>
            </div>
          ) : (
            <div className="address-list-card">
              <div className="section-header">
                <h2 className="section-title">
                  <span className="section-icon">📋</span>
                  Danh sách địa chỉ ({addresses.length})
                </h2>
              </div>
              <div className="address-grid-cards">
                {addresses.map((address) => (
                  <div
                    key={address.id}
                    className={`address-card-modern ${address.isDefault ? 'default' : ''}`}
                  >
                    <div className="address-card-type-icon">
                      {TYPE_ICONS[address.type] || '📍'}
                    </div>
                    <div className="address-card-content">
                      <div className="address-card-header">
                        <span className="address-card-name">{address.fullName}</span>
                        {address.isDefault && <span className="address-badge">Mặc định</span>}
                      </div>
                      <div className="address-card-phone">{address.phone}</div>
                      <div className="address-card-address">
                        {address.address}, {address.ward}, {address.district}
                        <br />
                        {address.province}
                      </div>
                      {address.note && (
                        <div className="address-card-note">
                          <span className="note-icon">📝</span> {address.note}
                        </div>
                      )}
                    </div>
                    <div className="address-card-actions">
                      <button
                        className="action-btn edit"
                        onClick={() => handleEdit(address)}
                        title="Chỉnh sửa"
                      >
                        ✏️
                      </button>
                      {!address.isDefault && (
                        <>
                          <button
                            className="action-btn default"
                            onClick={() => handleSetDefault(address)}
                            title="Đặt làm mặc định"
                          >
                            ���
                          </button>
                          <button
                            className="action-btn delete"
                            onClick={() => handleDelete(address)}
                            title="Xóa"
                          >
                            🗑️
                          </button>
                        </>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Address Form - Right Side */}
        <div className="address-form-section">
          <div className="address-form-card">
            <div className="form-header">
              <h2 className="form-title">
                {isEditing ? (
                  <>
                    <span>✏️</span> Cập nhật địa chỉ
                  </>
                ) : (
                  <>
                    <span>➕</span> Thêm địa chỉ mới
                  </>
                )}
              </h2>
              {isEditing && (
                <button className="cancel-edit-btn" onClick={resetForm}>
                  Hủy
                </button>
              )}
            </div>
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

              <div className="form-actions">
                <Button type="submit" variant="primary" className="submit-btn" loading={saving}>
                  {isEditing ? '💾 Lưu thay đổi' : '➕ Thêm địa chỉ'}
                </Button>
                {isEditing && (
                  <Button variant="ghost" onClick={resetForm} className="cancel-btn">
                    Hủy
                  </Button>
                )}
              </div>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
}

export default AddressBookPage;
