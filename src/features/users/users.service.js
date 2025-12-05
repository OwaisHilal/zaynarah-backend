// src/features/users/users.service.js
const User = require('./users.model');

module.exports = {
  createUser: async ({ name, email, password }) => {
    const exists = await User.findOne({ email });
    if (exists) throw { status: 400, message: 'Email already registered' };

    const user = await User.create({ name, email, password });
    return user;
  },

  getUserById: async (id) => {
    const user = await User.findById(id).select('-password');
    if (!user) throw { status: 404, message: 'User not found' };
    return user;
  },

  updateUser: async (id, data) => {
    const updated = await User.findByIdAndUpdate(id, data, {
      new: true,
    }).select('-password');

    if (!updated) throw { status: 404, message: 'User not found' };
    return updated;
  },

  changePassword: async (user, newPassword) => {
    user.password = newPassword;
    await user.save();
    return true;
  },

  // --- Admin Services ---
  getAllUsers: async () => {
    return User.find().select('-password');
  },

  updateRole: async (userId, role) => {
    const user = await User.findByIdAndUpdate(
      userId,
      { role },
      { new: true }
    ).select('-password');

    if (!user) throw { status: 404, message: 'User not found' };
    return user;
  },

  deleteUser: async (userId) => {
    const user = await User.findByIdAndDelete(userId);
    if (!user) throw { status: 404, message: 'User not found' };
    return true;
  },
};
