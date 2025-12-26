// src/features/users/users.service.js
const User = require('./users.model');
const ApiError = require('../../core/errors/ApiError');

module.exports = {
  createUser: async ({ name, email, password }) => {
    const exists = await User.findOne({ email });
    if (exists) throw new ApiError(400, 'Email already registered');

    const user = await User.create({ name, email, password });
    return user;
  },

  getUserById: async (id) => {
    const user = await User.findById(id).select('-password');
    if (!user) throw new ApiError(404, 'User not found');
    return user;
  },

  updateUser: async (id, data) => {
    const updated = await User.findByIdAndUpdate(id, data, {
      new: true,
    }).select('-password');
    if (!updated) throw new ApiError(404, 'User not found');
    return updated;
  },

  changePassword: async (user, newPassword) => {
    user.password = newPassword;
    await user.save();
    return true;
  },

  // Admin functions
  getAllUsers: async ({ page = 1, limit = 20, search }) => {
    const query = {};
    if (search) {
      query.$or = [
        { name: { $regex: search, $options: 'i' } },
        { email: { $regex: search, $options: 'i' } },
      ];
    }
    const users = await User.find(query)
      .select('-password')
      .skip((page - 1) * limit)
      .limit(limit);
    const total = await User.countDocuments(query);
    return { users, total, page, limit };
  },

  updateRole: async (userId, role) => {
    if (!['customer', 'admin'].includes(role))
      throw new ApiError(400, 'Invalid role');

    const user = await User.findByIdAndUpdate(
      userId,
      { role },
      { new: true }
    ).select('-password');
    if (!user) throw new ApiError(404, 'User not found');
    return user;
  },

  deleteUser: async (userId) => {
    const user = await User.findByIdAndDelete(userId);
    if (!user) throw new ApiError(404, 'User not found');
    return true;
  },

  // ============================
  // ADDRESS FUNCTIONS (upgraded)
  // ============================
  getAddresses: async (userId) => {
    const user = await User.findById(userId).select('addresses');
    if (!user) throw new ApiError(404, 'User not found');
    return user.addresses;
  },

  addAddress: async (userId, addressData) => {
    const user = await User.findById(userId);
    if (!user) throw new ApiError(404, 'User not found');

    // If no address existed, make this the default
    const shouldDefault = user.addresses.length === 0 || addressData.isDefault;

    // If caller marked isDefault true, unset existing defaults
    if (addressData.isDefault) {
      user.addresses.forEach((a) => (a.isDefault = false));
    }

    user.addresses.push({
      ...addressData,
      isDefault: !!shouldDefault,
    });

    await user.save();

    // Return the newly added address (last element)
    const added = user.addresses[user.addresses.length - 1];
    return added;
  },

  updateAddress: async (userId, addressId, addressData) => {
    const user = await User.findById(userId);
    if (!user) throw new ApiError(404, 'User not found');

    const address = user.addresses.id(addressId);
    if (!address) throw new ApiError(404, 'Address not found');

    // If setting isDefault true, clear others
    if (addressData.isDefault) {
      user.addresses.forEach((a) => (a.isDefault = false));
      address.isDefault = true;
    }

    // Merge fields
    Object.assign(address, addressData);
    await user.save();
    return address;
  },

  deleteAddress: async (userId, addressId) => {
    const user = await User.findById(userId);
    if (!user) throw new ApiError(404, 'User not found');

    const address = user.addresses.id(addressId);
    if (!address) throw new ApiError(404, 'Address not found');

    const wasDefault = !!address.isDefault;
    address.remove();
    // If deleted address was default and there are remaining addresses,
    // promote the first one to default
    if (wasDefault && user.addresses.length > 0) {
      user.addresses[0].isDefault = true;
    }

    await user.save();
    return true;
  },

  setDefaultAddress: async (userId, addressId) => {
    const user = await User.findById(userId);
    if (!user) throw new ApiError(404, 'User not found');

    const address = user.addresses.id(addressId);
    if (!address) throw new ApiError(404, 'Address not found');

    user.addresses.forEach((a) => (a.isDefault = false));
    address.isDefault = true;
    await user.save();
    return address;
  },
};
