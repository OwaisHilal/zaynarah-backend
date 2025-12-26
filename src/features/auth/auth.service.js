const jwt = require('jsonwebtoken');
const User = require('../users/users.model');
const ApiError = require('../../core/errors/ApiError');

function signToken(id) {
  return jwt.sign({ id }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRES_IN || '7d',
  });
}

exports.register = async ({ name, email, password }) => {
  const exists = await User.findOne({ email });
  if (exists) throw new ApiError(400, 'Email already registered');

  const user = await User.create({ name, email, password });
  const token = signToken(user.id);
  return { user, token };
};

exports.login = async ({ email, password }) => {
  const user = await User.findOne({ email }).select('+password');
  if (!user) throw new ApiError(400, 'Invalid credentials');

  const match = await user.matchPassword(password);
  if (!match) throw new ApiError(400, 'Invalid credentials');

  const token = signToken(user.id);
  return { user, token };
};
