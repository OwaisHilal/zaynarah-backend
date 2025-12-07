const userService = require('./users.service');
const ApiError = require('../../core/errors/ApiError');
const jwt = require('jsonwebtoken');

function signToken(id) {
  return jwt.sign({ id }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRES_IN || '7d',
  });
}

module.exports = {
  register: async (req, res, next) => {
    try {
      const body = req.validatedBody;
      const user = await userService.createUser(body);
      const token = signToken(user.id);

      res.status(201).json({
        message: 'Account created successfully',
        token,
        user,
      });
    } catch (err) {
      next(err);
    }
  },

  profile: async (req, res, next) => {
    try {
      const user = await userService.getUserById(req.user.id);
      res.json(user);
    } catch (err) {
      next(err);
    }
  },

  updateProfile: async (req, res, next) => {
    try {
      const body = req.validatedBody;
      const updated = await userService.updateUser(req.user.id, body);
      res.json(updated);
    } catch (err) {
      next(err);
    }
  },

  changePassword: async (req, res, next) => {
    try {
      const { oldPassword, newPassword } = req.validatedBody;
      const match = await req.user.matchPassword(oldPassword);
      if (!match) throw new ApiError(400, 'Incorrect old password');

      await userService.changePassword(req.user, newPassword);
      res.json({ message: 'Password updated successfully' });
    } catch (err) {
      next(err);
    }
  },

  getAllUsers: async (req, res, next) => {
    try {
      const { page, limit, search } = req.validatedQuery;
      const data = await userService.getAllUsers({
        page: Number(page),
        limit: Number(limit),
        search,
      });
      res.json(data);
    } catch (err) {
      next(err);
    }
  },

  updateUserRole: async (req, res, next) => {
    try {
      const { role } = req.validatedBody;
      const updated = await userService.updateRole(
        req.validatedParams.userId,
        role
      );
      res.json(updated);
    } catch (err) {
      next(err);
    }
  },

  deleteUser: async (req, res, next) => {
    try {
      await userService.deleteUser(req.validatedParams.userId);
      res.json({ message: 'User deleted successfully' });
    } catch (err) {
      next(err);
    }
  },
};
