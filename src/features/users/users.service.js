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
  // ADDRESS FUNCTIONS
  // ============================
  getAddresses: async (userId) => {
    const user = await User.findById(userId).select('addresses');
    if (!user) throw new ApiError(404, 'User not found');
    return user.addresses;
  },

  addAddress: async (userId, addressData) => {
    const user = await User.findById(userId);
    if (!user) throw new ApiError(404, 'User not found');

    user.addresses.push(addressData);
    await user.save();
    return user.addresses[user.addresses.length - 1];
  },

  updateAddress: async (userId, addressId, addressData) => {
    const user = await User.findById(userId);
    if (!user) throw new ApiError(404, 'User not found');

    const address = user.addresses.id(addressId);
    if (!address) throw new ApiError(404, 'Address not found');

    Object.assign(address, addressData);
    await user.save();
    return address;
  },

  deleteAddress: async (userId, addressId) => {
    const user = await User.findById(userId);
    if (!user) throw new ApiError(404, 'User not found');

    const address = user.addresses.id(addressId);
    if (!address) throw new ApiError(404, 'Address not found');

    address.remove();
    await user.save();
    return true;
  },
};
