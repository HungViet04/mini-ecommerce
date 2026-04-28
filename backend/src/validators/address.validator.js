/**
 * Address Validators
 * Validation functions for user address operations
 */
const { ValidationError } = require('../errors');
const {
  sanitizeString,
  isPositiveInteger,
  isValidPhone,
  hasMaxLength,
} = require('./common.validator');

const ADDRESS_TYPES = ['home', 'office', 'other'];

const normalizeType = (type) => {
  const value = sanitizeString(type).toLowerCase();
  return ADDRESS_TYPES.includes(value) ? value : null;
};

const validateBaseFields = (data, { required = true } = {}) => {
  const errors = [];

  const fullName = sanitizeString(data.fullName || data.full_name);
  const phone = sanitizeString(data.phone);
  const province = sanitizeString(data.province);
  const district = sanitizeString(data.district);
  const ward = sanitizeString(data.ward);
  const address = sanitizeString(data.address);
  const note = sanitizeString(data.note);
  const type = normalizeType(data.type) || 'home';

  if (required || fullName) {
    if (!fullName) {
      errors.push({ field: 'fullName', message: 'Vui lòng nhập họ tên người nhận' });
    } else if (!hasMaxLength(fullName, 100)) {
      errors.push({ field: 'fullName', message: 'Họ tên không được vượt quá 100 ký tự' });
    }
  }

  if (required || phone) {
    if (!phone) {
      errors.push({ field: 'phone', message: 'Vui lòng nhập số điện thoại' });
    } else if (!isValidPhone(phone)) {
      errors.push({ field: 'phone', message: 'Số điện thoại không hợp lệ' });
    }
  }

  if (required || province) {
    if (!province) {
      errors.push({ field: 'province', message: 'Vui lòng nhập Tỉnh/Thành phố' });
    }
  }

  if (required || district) {
    if (!district) {
      errors.push({ field: 'district', message: 'Vui lòng nhập Quận/Huyện' });
    }
  }

  if (required || ward) {
    if (!ward) {
      errors.push({ field: 'ward', message: 'Vui lòng nhập Phường/Xã' });
    }
  }

  if (required || address) {
    if (!address) {
      errors.push({ field: 'address', message: 'Vui lòng nhập địa chỉ cụ thể' });
    } else if (!hasMaxLength(address, 255)) {
      errors.push({ field: 'address', message: 'Địa chỉ không được vượt quá 255 ký tự' });
    }
  }

  if (note && !hasMaxLength(note, 255)) {
    errors.push({ field: 'note', message: 'Ghi chú không được vượt quá 255 ký tự' });
  }

  if (data.type !== undefined && !normalizeType(data.type)) {
    errors.push({ field: 'type', message: 'Loại địa chỉ không hợp lệ' });
  }

  return {
    errors,
    values: {
      fullName,
      phone,
      province,
      district,
      ward,
      address,
      note: note || null,
      type,
    },
  };
};

const validateCreateAddress = (data) => {
  const { errors, values } = validateBaseFields(data, { required: true });
  const isDefault = Boolean(data.isDefault || data.is_default);

  if (errors.length > 0) {
    throw new ValidationError('Dữ liệu địa chỉ không hợp lệ', errors);
  }

  return { ...values, isDefault };
};

const validateUpdateAddress = (data) => {
  const { errors, values } = validateBaseFields(data, { required: false });

  const updates = {};
  if (data.fullName !== undefined || data.full_name !== undefined)
    updates.fullName = values.fullName;
  if (data.phone !== undefined) updates.phone = values.phone;
  if (data.province !== undefined) updates.province = values.province;
  if (data.district !== undefined) updates.district = values.district;
  if (data.ward !== undefined) updates.ward = values.ward;
  if (data.address !== undefined) updates.address = values.address;
  if (data.note !== undefined) updates.note = values.note;
  if (data.type !== undefined) updates.type = values.type;
  if (data.isDefault !== undefined || data.is_default !== undefined) {
    updates.isDefault = Boolean(data.isDefault || data.is_default);
  }

  if (errors.length > 0) {
    throw new ValidationError('Dữ liệu địa chỉ không hợp lệ', errors);
  }

  return updates;
};

const validateAddressId = (id) => {
  if (!isPositiveInteger(id)) {
    throw new ValidationError('ID địa chỉ không hợp lệ');
  }
  return Number(id);
};

module.exports = {
  validateCreateAddress,
  validateUpdateAddress,
  validateAddressId,
  ADDRESS_TYPES,
};
