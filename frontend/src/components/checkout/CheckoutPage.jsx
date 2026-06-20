/**
 * CheckoutPage Component
 * Checkout flow with shipping info and payment selection
 * Pattern: Container Component
 */
import React, { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useCart, useAuth } from '../../contexts';
import { addressService, orderService, productService, uploadService } from '../../services';
import { vnpayService } from '../../services/vnpay.service';
import { Card, Button, Input, ErrorAlert } from '../ui';
import { formatPrice } from '../../utils';

const PAYMENT_METHODS = {
  COD: 'cod',
  VNPAY: 'vnpay',
};

export function CheckoutPage({ onBack, onSuccess }) {
  const navigate = useNavigate();
  const { items, total, clearCart } = useCart();
  const { user } = useAuth();

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [itemDetails, setItemDetails] = useState({});
  const [addresses, setAddresses] = useState([]);
  const [addressLoading, setAddressLoading] = useState(false);
  const [addressError, setAddressError] = useState('');
  const [addressMode, setAddressMode] = useState('saved');
  const [selectedAddressId, setSelectedAddressId] = useState(null);
  const [saveAddress, setSaveAddress] = useState(true);
  const [setDefaultAddress, setSetDefaultAddress] = useState(false);

  useEffect(() => {
    let mounted = true;

    const fillMissingItemDetails = async () => {
      const missingIds = items
        .filter((item) => {
          const hasName = Boolean(item.productName || item.name);
          const hasImage = Boolean(item.imageUrl || item.image_url);
          return !hasName || !hasImage;
        })
        .map((item) => item.productId)
        .filter(Boolean);

      if (missingIds.length === 0) return;

      const uniqueIds = [...new Set(missingIds)];

      try {
        const details = await Promise.all(
          uniqueIds.map(async (id) => {
            const product = await productService.getById(id, { skipLoading: true });
            return [id, product];
          })
        );

        if (!mounted) return;

        setItemDetails((prev) => ({
          ...prev,
          ...Object.fromEntries(details),
        }));
      } catch {
        // Keep checkout usable even if detail prefetch fails
      }
    };

    fillMissingItemDetails();

    return () => {
      mounted = false;
    };
  }, [items]);

  useEffect(() => {
    let mounted = true;

    const loadAddresses = async () => {
      if (!user) return;
      setAddressLoading(true);
      setAddressError('');
      try {
        const result = await addressService.getMyAddresses();
        if (!mounted) return;
        const list = result || [];
        setAddresses(list);
        const defaultAddress = list.find((item) => item.isDefault) || list[0];
        if (defaultAddress) {
          setSelectedAddressId(defaultAddress.id);
          setAddressMode('saved');
        } else {
          setAddressMode('new');
        }
      } catch (err) {
        if (!mounted) return;
        setAddressError(err.message || 'Không thể tải địa chỉ');
        setAddressMode('new');
      } finally {
        if (mounted) setAddressLoading(false);
      }
    };

    loadAddresses();

    return () => {
      mounted = false;
    };
  }, [user]);

  const selectedAddress = useMemo(
    () => addresses.find((item) => item.id === selectedAddressId),
    [addresses, selectedAddressId]
  );

  const showNewAddressForm = addressMode === 'new' || addresses.length === 0;

  useEffect(() => {
    if (!saveAddress) {
      setSetDefaultAddress(false);
    }
  }, [saveAddress]);

  // Shipping info
  const [shippingInfo, setShippingInfo] = useState({
    fullName: user?.name || '',
    phone: '',
    province: '',
    district: '',
    ward: '',
    address: '',
    note: '',
    type: 'home',
  });

  // Payment method
  const [paymentMethod, setPaymentMethod] = useState(PAYMENT_METHODS.COD);

  // Form errors
  const [formErrors, setFormErrors] = useState({});
  const [submitted, setSubmitted] = useState(false);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setShippingInfo((prev) => ({ ...prev, [name]: value }));
    // Clear error when user types
    if (formErrors[name]) {
      setFormErrors((prev) => ({ ...prev, [name]: null }));
    }
  };

  const validateForm = () => {
    const errors = {};

    if (!shippingInfo.fullName.trim()) {
      errors.fullName = 'Vui lòng nhập họ tên';
    }

    if (!shippingInfo.phone.trim()) {
      errors.phone = 'Vui lòng nhập số điện thoại';
    } else if (!/^(0[3|5|7|8|9])+([0-9]{8})$/.test(shippingInfo.phone)) {
      errors.phone = 'Số điện thoại không hợp lệ';
    }

    if (!shippingInfo.province.trim()) {
      errors.province = 'Vui lòng nhập Tỉnh/Thành phố';
    }

    if (!shippingInfo.district.trim()) {
      errors.district = 'Vui lòng nhập Quận/Huyện';
    }

    if (!shippingInfo.ward.trim()) {
      errors.ward = 'Vui lòng nhập Phường/Xã';
    }

    if (!shippingInfo.address.trim()) {
      errors.address = 'Vui lòng nhập địa chỉ cụ thể';
    }

    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitted(true);
    if (showNewAddressForm && !validateForm()) {
      return;
    }
    if (!showNewAddressForm && !selectedAddressId) {
      setError('Vui lòng chọn địa chỉ giao hàng');
      return;
    }
    setLoading(true);
    setError(null);
    try {
      // Kiểm tra tồn kho từng sản phẩm
      const stockChecks = await Promise.all(
        items.map(async (item) => {
          const product = await productService.getById(item.productId, { skipLoading: true });
          return { item, product };
        })
      );

      const insufficientStock = stockChecks.find(({ item, product }) => {
        const stockValue = Number(product?.stock);
        return Number.isFinite(stockValue) && item.quantity > stockValue;
      });

      if (insufficientStock) {
        const { item, product } = insufficientStock;
        const stockValue = Number(product?.stock);
        const displayName = product?.name || `Sản phẩm #${item.productId}`;
        setError(
          `Sản phẩm "${displayName}" chỉ còn ${stockValue} sản phẩm trong kho. Vui lòng giảm số lượng.`
        );
        return;
      }
      let shippingInfoForSuccess = null;
      let shippingAddressId = null;

      if (showNewAddressForm) {
        shippingInfoForSuccess = { ...shippingInfo };

        if (saveAddress) {
          const createdAddress = await addressService.create({
            fullName: shippingInfo.fullName,
            phone: shippingInfo.phone,
            province: shippingInfo.province,
            district: shippingInfo.district,
            ward: shippingInfo.ward,
            address: shippingInfo.address,
            note: shippingInfo.note,
            type: shippingInfo.type,
            isDefault: setDefaultAddress || addresses.length === 0,
          });
          shippingAddressId = createdAddress?.id || null;
        }
      } else if (selectedAddress) {
        shippingAddressId = selectedAddress.id;
        shippingInfoForSuccess = {
          fullName: selectedAddress.fullName,
          phone: selectedAddress.phone,
          province: selectedAddress.province,
          district: selectedAddress.district,
          ward: selectedAddress.ward,
          address: selectedAddress.address,
          note: selectedAddress.note || '',
        };
      }

      const orderData = {
        items: items.map((item) => ({
          productId: item.productId,
          quantity: item.quantity,
        })),
        paymentMethod,
      };

      if (shippingAddressId) {
        orderData.shippingAddressId = shippingAddressId;
      } else {
        ((orderData.shippingInfo = {
          fullName: shippingInfo.fullName,
          phone: shippingInfo.phone,
          province: shippingInfo.province,
          district: shippingInfo.district,
          ward: shippingInfo.ward,
          address: shippingInfo.address,
          note: shippingInfo.note,
          type: shippingInfo.type,
        }),
          paymentMethod);
      }
      const result = await orderService.create(orderData, { skipLoading: true });

      // Nếu thanh toán VNPay, tạo URL thanh toán và redirect
      if (paymentMethod === PAYMENT_METHODS.VNPAY) {
        const vnpayResult = await vnpayService.createPaymentUrl(result.id);
        clearCart();
        // Redirect to VNPay
        if (vnpayResult.paymentUrl) {
          window.location.href = vnpayResult.paymentUrl;
        } else {
          setError('Không thể tạo URL thanh toán VNPay');
        }
        return;
      }

      clearCart();
      onSuccess?.(result, paymentMethod, shippingInfoForSuccess || shippingInfo);
    } catch (err) {
      setError(err.message || 'Đặt hàng thất bại. Vui lòng thử lại.');
    } finally {
      setLoading(false);
    }
  };

  const shippingFee = 30000; // Fixed shipping fee
  const grandTotal = total + shippingFee;

  return (
    <div className="checkout-page">
      <button className="back-button" onClick={onBack}>
        ← Quay lại giỏ hàng
      </button>

      <h1 className="checkout-title">Thanh Toán</h1>

      <div className="checkout-content">
        {/* Left Column - Form */}
        <div className="checkout-form-section">
          <form onSubmit={handleSubmit}>
            {/* Shipping Information */}
            <Card className="checkout-card">
              <h2 className="card-section-title">
                <span className="step-number">1</span>
                Thông Tin Giao Hàng
              </h2>

              {addresses.length > 0 && (
                <div className="address-picker-modern">
                  <div className="address-picker-header-modern">
                    <div className="picker-header-content">
                      <div className="picker-header-icon">📍</div>
                      <div>
                        <div className="picker-header-title">Chọn địa chỉ giao hàng</div>
                        <div className="picker-header-subtitle">
                          {addresses.length} địa chỉ đã lưu
                        </div>
                      </div>
                    </div>
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={() => navigate('/addresses')}
                      className="manage-address-btn"
                    >
                      📝 Quản lý
                    </Button>
                  </div>

                  {addressError && <p className="address-error">{addressError}</p>}

                  {addressLoading ? (
                    <div className="address-loading-modern">
                      <span className="loading-spinner-small"></span>
                      <span>Đang tải địa chỉ...</span>
                    </div>
                  ) : (
                    <div className="address-options-list">
                      {addresses.map((address) => (
                        <button
                          key={address.id}
                          type="button"
                          className={`address-option-card ${selectedAddressId === address.id ? 'selected' : ''}`}
                          onClick={() => {
                            setSelectedAddressId(address.id);
                            setAddressMode('saved');
                          }}
                        >
                          <div className="option-radio">
                            <span className="radio-dot"></span>
                          </div>
                          <div className="option-content">
                            <div className="option-header">
                              <span className="option-name">{address.fullName}</span>
                              {address.isDefault && <span className="option-badge">Mặc định</span>}
                            </div>
                            <div className="option-phone">{address.phone}</div>
                            <div className="option-address">
                              {address.address}, {address.ward}, {address.district},{' '}
                              {address.province}
                            </div>
                          </div>
                          <div className="option-check-icon">✓</div>
                        </button>
                      ))}
                    </div>
                  )}

                  <button
                    type="button"
                    className={`new-address-toggle ${showNewAddressForm ? 'active' : ''}`}
                    onClick={() => setAddressMode('new')}
                  >
                    <span className="toggle-icon">➕</span>
                    <span>Nhập địa chỉ mới</span>
                  </button>
                </div>
              )}

              {!showNewAddressForm && selectedAddress && (
                <div className="selected-address">
                  <div className="selected-address-title">Địa chỉ đã chọn</div>
                  <div className="selected-address-body">
                    <p className="selected-address-name">
                      {selectedAddress.fullName} · {selectedAddress.phone}
                    </p>
                    <p className="selected-address-detail">
                      {selectedAddress.address}, {selectedAddress.ward}, {selectedAddress.district},{' '}
                      {selectedAddress.province}
                    </p>
                    {selectedAddress.note && (
                      <p className="selected-address-note">Ghi chú: {selectedAddress.note}</p>
                    )}
                  </div>
                </div>
              )}

              {showNewAddressForm && (
                <>
                  <div className="form-grid">
                    <Input
                      label="Họ và tên người nhận"
                      name="fullName"
                      value={shippingInfo.fullName}
                      onChange={handleInputChange}
                      error={formErrors.fullName}
                      placeholder="Nhập họ và tên"
                      required
                      touched={submitted}
                    />
                    <Input
                      label="Số điện thoại"
                      name="phone"
                      value={shippingInfo.phone}
                      onChange={handleInputChange}
                      error={formErrors.phone}
                      placeholder="VD: 0912345678"
                      required
                      touched={submitted}
                    />
                    <Input
                      label="Tỉnh/Thành phố"
                      name="province"
                      value={shippingInfo.province}
                      onChange={handleInputChange}
                      error={formErrors.province}
                      placeholder="VD: Hà Nội"
                      required
                      touched={submitted}
                    />
                    <Input
                      label="Quận/Huyện"
                      name="district"
                      value={shippingInfo.district}
                      onChange={handleInputChange}
                      error={formErrors.district}
                      placeholder="VD: Cầu Giấy"
                      required
                      touched={submitted}
                    />
                    <Input
                      label="Phường/Xã"
                      name="ward"
                      value={shippingInfo.ward}
                      onChange={handleInputChange}
                      error={formErrors.ward}
                      placeholder="VD: Dịch Vọng"
                      required
                      touched={submitted}
                    />
                    <Input
                      label="Địa chỉ cụ thể"
                      name="address"
                      value={shippingInfo.address}
                      onChange={handleInputChange}
                      error={formErrors.address}
                      placeholder="Số nhà, tên đường..."
                      className="full-width"
                      required
                      touched={submitted}
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
                        value={shippingInfo.type}
                        onChange={handleInputChange}
                      >
                        <option value="home">Nhà riêng</option>
                        <option value="office">Cơ quan</option>
                        <option value="other">Khác</option>
                      </select>
                    </div>
                    <div className="form-group full-width">
                      <label className="form-label">Ghi chú (tùy chọn)</label>
                      <textarea
                        name="note"
                        value={shippingInfo.note}
                        onChange={handleInputChange}
                        placeholder="Ghi chú về đơn hàng, thời gian nhận hàng..."
                        className="form-textarea"
                        rows={3}
                      />
                    </div>
                  </div>

                  <label className="checkbox-field">
                    <input
                      type="checkbox"
                      checked={saveAddress}
                      onChange={(e) => setSaveAddress(e.target.checked)}
                    />
                    Lưu địa chỉ này để dùng lần sau
                  </label>

                  {saveAddress && (
                    <label className="checkbox-field">
                      <input
                        type="checkbox"
                        checked={setDefaultAddress}
                        onChange={(e) => setSetDefaultAddress(e.target.checked)}
                      />
                      Đặt làm địa chỉ mặc định
                    </label>
                  )}
                </>
              )}
            </Card>

            {/* Payment Method */}
            <Card className="checkout-card">
              <h2 className="card-section-title">
                <span className="step-number">2</span>
                Phương Thức Thanh Toán
              </h2>

              <div className="payment-methods">
                <label
                  className={`payment-option ${
                    paymentMethod === PAYMENT_METHODS.COD ? 'selected' : ''
                  }`}
                >
                  <input
                    type="radio"
                    name="paymentMethod"
                    value={PAYMENT_METHODS.COD}
                    checked={paymentMethod === PAYMENT_METHODS.COD}
                    onChange={(e) => setPaymentMethod(e.target.value)}
                  />
                  <div className="payment-content">
                    <span className="payment-icon">💵</span>
                    <div className="payment-info">
                      <span className="payment-name">Thanh toán khi nhận hàng (COD)</span>
                      <span className="payment-desc">Thanh toán bằng tiền mặt khi nhận hàng</span>
                    </div>
                  </div>
                </label>

                <label
                  className={`payment-option ${
                    paymentMethod === PAYMENT_METHODS.VNPAY ? 'selected' : ''
                  }`}
                >
                  <input
                    type="radio"
                    name="paymentMethod"
                    value={PAYMENT_METHODS.VNPAY}
                    checked={paymentMethod === PAYMENT_METHODS.VNPAY}
                    onChange={(e) => setPaymentMethod(e.target.value)}
                  />
                  <div className="payment-content">
                    <span className="payment-icon">💳</span>
                    <div className="payment-info">
                      <span className="payment-name">Thanh toán VNPay</span>
                      <span className="payment-desc">ATM/Visa/MasterCard/QR Code qua VNPay</span>
                    </div>
                  </div>
                </label>
              </div>

              {paymentMethod === PAYMENT_METHODS.VNPAY && (
                <div className="bank-info">
                  <p className="bank-note-simple">
                    💡 Bạn sẽ được chuyển đến cổng thanh toán VNPay để hoàn tất giao dịch
                  </p>
                </div>
              )}
            </Card>

            <ErrorAlert message={error} />
          </form>
        </div>

        {/* Right Column - Order Summary */}
        <div className="checkout-summary-section">
          <Card className="order-summary-card">
            <h2 className="card-section-title">Đơn Hàng Của Bạn</h2>

            <div className="order-items">
              {items.map((item, index) => (
                <div key={index} className="order-item">
                  {(() => {
                    const detail = itemDetails[item.productId] || {};
                    const displayName =
                      item.productName || item.name || detail.name || `Sản phẩm #${item.productId}`;
                    const imagePath = item.imageUrl || item.image_url || detail.image_url || '';
                    const imageSrc = uploadService.getImageUrl(imagePath);

                    return (
                      <>
                        <div className="item-image">
                          {imageSrc ? (
                            <img src={imageSrc} alt={displayName} />
                          ) : (
                            <span className="item-emoji">📦</span>
                          )}
                        </div>
                        <div className="item-details">
                          <span className="item-name">{displayName}</span>
                          <span className="item-quantity">x{item.quantity}</span>
                        </div>
                        <span className="item-price">
                          {formatPrice(item.price * item.quantity)}
                        </span>
                      </>
                    );
                  })()}
                </div>
              ))}
            </div>

            <div className="order-totals">
              <div className="total-row">
                <span>Tạm tính</span>
                <span>{formatPrice(total)}</span>
              </div>
              <div className="total-row">
                <span>Phí vận chuyển</span>
                <span>{formatPrice(shippingFee)}</span>
              </div>
              <div className="total-row grand-total">
                <span>Tổng cộng</span>
                <span className="grand-total-amount">{formatPrice(grandTotal)}</span>
              </div>
            </div>

            <Button
              type="submit"
              variant="primary"
              className="checkout-btn"
              loading={loading}
              onClick={handleSubmit}
            >
              {paymentMethod === PAYMENT_METHODS.COD ? 'Đặt Hàng' : 'Đặt Hàng & Thanh Toán VNPay'}
            </Button>

            <p className="checkout-note">
              Bằng việc đặt hàng, bạn đồng ý với điều khoản sử dụng của SmartShop
            </p>
          </Card>
        </div>
      </div>
    </div>
  );
}

export default CheckoutPage;
