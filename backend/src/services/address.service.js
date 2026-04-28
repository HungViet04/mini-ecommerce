/**
 * Address Service
 * Business logic for user address management
 */
const database = require('../config/database');
const { addressRepository } = require('../repositories');
const { NotFoundError } = require('../errors');
const {
  validateCreateAddress,
  validateUpdateAddress,
  validateAddressId,
} = require('../validators/address.validator');

const mapAddress = (row) => {
  if (!row) return null;
  return {
    id: row.id,
    userId: row.user_id,
    fullName: row.full_name,
    phone: row.phone,
    province: row.province,
    district: row.district,
    ward: row.ward,
    address: row.address,
    note: row.note,
    type: row.type,
    isDefault: Boolean(row.is_default),
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
};

class AddressService {
  async findByUser(userId) {
    const rows = await addressRepository.findByUser(userId);
    return rows.map(mapAddress);
  }

  async create(userId, data) {
    const validated = validateCreateAddress(data);

    return database.transaction(async (connection) => {
      const existingDefault = await addressRepository.findDefaultByUser(userId);
      const shouldDefault = validated.isDefault || !existingDefault;

      if (shouldDefault) {
        await addressRepository.clearDefaultByUser(userId, connection);
      }

      const created = await addressRepository.create(
        {
          user_id: userId,
          full_name: validated.fullName,
          phone: validated.phone,
          province: validated.province,
          district: validated.district,
          ward: validated.ward,
          address: validated.address,
          note: validated.note,
          type: validated.type,
          is_default: shouldDefault ? 1 : 0,
        },
        connection
      );

      const row = await addressRepository.findById(created.id);
      return mapAddress(row);
    });
  }

  async update(id, userId, data) {
    const addressId = validateAddressId(id);
    const updates = validateUpdateAddress(data);

    const existing = await addressRepository.findByIdForUser(addressId, userId);
    if (!existing) {
      throw new NotFoundError('Address', 'Địa chỉ không tồn tại');
    }

    const updateData = {};
    if (updates.fullName !== undefined) updateData.full_name = updates.fullName;
    if (updates.phone !== undefined) updateData.phone = updates.phone;
    if (updates.province !== undefined) updateData.province = updates.province;
    if (updates.district !== undefined) updateData.district = updates.district;
    if (updates.ward !== undefined) updateData.ward = updates.ward;
    if (updates.address !== undefined) updateData.address = updates.address;
    if (updates.note !== undefined) updateData.note = updates.note;
    if (updates.type !== undefined) updateData.type = updates.type;

    return database.transaction(async (connection) => {
      if (updates.isDefault) {
        await addressRepository.clearDefaultByUser(userId, connection);
        updateData.is_default = 1;
      } else if (updates.isDefault === false) {
        updateData.is_default = 0;
      }

      await addressRepository.update(addressId, updateData, connection);

      if (updates.isDefault === false) {
        const remainingDefault = await addressRepository.findDefaultByUser(userId);
        if (!remainingDefault) {
          const latest = await addressRepository.findLatestByUser(userId);
          if (latest) {
            await addressRepository.setDefaultForUser(latest.id, userId, connection);
          }
        }
      }

      const updated = await addressRepository.findById(addressId);
      return mapAddress(updated);
    });
  }

  async delete(id, userId) {
    const addressId = validateAddressId(id);
    const existing = await addressRepository.findByIdForUser(addressId, userId);
    if (!existing) {
      throw new NotFoundError('Address', 'Địa chỉ không tồn tại');
    }

    await database.transaction(async (connection) => {
      await addressRepository.delete(addressId, connection);

      if (existing.is_default) {
        const latest = await addressRepository.findLatestByUser(userId);
        if (latest) {
          await addressRepository.setDefaultForUser(latest.id, userId, connection);
        }
      }
    });

    return { message: 'Xóa địa chỉ thành công', addressId };
  }

  async setDefault(id, userId) {
    const addressId = validateAddressId(id);
    const existing = await addressRepository.findByIdForUser(addressId, userId);
    if (!existing) {
      throw new NotFoundError('Address', 'Địa chỉ không tồn tại');
    }

    await database.transaction(async (connection) => {
      await addressRepository.clearDefaultByUser(userId, connection);
      await addressRepository.setDefaultForUser(addressId, userId, connection);
    });

    const updated = await addressRepository.findById(addressId);
    return mapAddress(updated);
  }

  async getByIdForUser(id, userId) {
    const addressId = validateAddressId(id);
    const row = await addressRepository.findByIdForUser(addressId, userId);
    if (!row) {
      throw new NotFoundError('Address', 'Địa chỉ không tồn tại');
    }
    return mapAddress(row);
  }

  async buildShippingInfoFromAddress(addressId, userId) {
    const address = await this.getByIdForUser(addressId, userId);
    const fullAddress = [address.address, address.ward, address.district]
      .filter(Boolean)
      .join(', ');

    return {
      name: address.fullName,
      phone: address.phone,
      address: fullAddress,
      city: address.province,
      notes: address.note || '',
    };
  }
}

module.exports = new AddressService();
