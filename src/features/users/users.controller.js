// src/features/users/users.controller.js
const userService = require('./users.service');
const bcrypt = require('bcryptjs');

module.exports = {
  register: async (req, res, next) => {
    try {
      const user = await userService.createUser(req.body);
      res.status(201).json({
        message: 'Account created successfully',
        user: { ...user.toObject(), password: undefined },
      });
    } catch (err) {
      next(err);
    }
  },

  profile: async (req, res, next) => {
    try {
      const user = await userService.getUserById(req.user._id);
      res.json(user);
    } catch (err) {
      next(err);
    }
  },

  updateProfile: async (req, res, next) => {
    try {
      const updated = await userService.updateUser(req.user._id, req.body);
      res.json(updated);
    } catch (err) {
      next(err);
    }
  },

  changePassword: async (req, res, next) => {
    try {
      const { oldPassword, newPassword } = req.body;
      const user = req.user;

      const match = await user.matchPassword(oldPassword);
      if (!match) throw { status: 400, message: 'Incorrect old password' };

      await userService.changePassword(user, newPassword);

      res.json({ message: 'Password updated successfully' });
    } catch (err) {
      next(err);
    }
  },

  // --- Admin ---
  getAllUsers: async (req, res, next) => {
    try {
      const users = await userService.getAllUsers();
      res.json(users);
    } catch (err) {
      next(err);
    }
  },

  updateUserRole: async (req, res, next) => {
    try {
      const updated = await userService.updateRole(
        req.params.userId,
        req.body.role
      );
      res.json(updated);
    } catch (err) {
      next(err);
    }
  },

  deleteUser: async (req, res, next) => {
    try {
      await userService.deleteUser(req.params.userId);
      res.json({ message: 'User deleted' });
    } catch (err) {
      next(err);
    }
  },
};
