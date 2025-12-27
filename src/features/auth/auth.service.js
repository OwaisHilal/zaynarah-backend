// backend/src/features/auth/auth.service.js
const jwt = require('jsonwebtoken');
const crypto = require('crypto');
const User = require('../users/users.model');
const ApiError = require('../../core/errors/ApiError');
const mailer = require('../../services/mailer.service');

function signToken(id) {
  return jwt.sign({ id }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRES_IN || '7d',
  });
}

exports.register = async ({ name, email, password }) => {
  const exists = await User.findOne({ email });
  if (exists) throw new ApiError(400, 'Email already registered');

  const emailVerifyToken = crypto.randomBytes(32).toString('hex');

  const user = await User.create({
    name,
    email,
    password,
    emailVerified: false,
    emailVerifyToken,
    emailVerifyTokenExpires: Date.now() + 24 * 60 * 60 * 1000,
  });

  await mailer.sendVerificationEmail({
    to: user.email,
    token: emailVerifyToken,
  });

  const token = signToken(user.id);
  return { user, token };
};

exports.login = async ({ email, password }) => {
  const user = await User.findOne({ email }).select('+password');
  if (!user) throw new ApiError(400, 'Invalid credentials');

  const match = await user.matchPassword(password);
  if (!match) throw new ApiError(400, 'Invalid credentials');

  if (!user.emailVerified) {
    throw new ApiError(403, 'Please verify your email first');
  }

  const token = signToken(user.id);
  return { user, token };
};

exports.verifyEmail = async (token) => {
  const user = await User.findOne({
    emailVerifyToken: token,
    emailVerifyTokenExpires: { $gt: Date.now() },
  });

  if (!user) throw new ApiError(400, 'Invalid or expired verification token');

  user.emailVerified = true;
  user.emailVerifyToken = undefined;
  user.emailVerifyTokenExpires = undefined;

  await user.save();
  return true;
};

exports.resendVerification = async (userId) => {
  const user = await User.findById(userId);
  if (!user) throw new ApiError(404, 'User not found');
  if (user.emailVerified) return true;

  user.emailVerifyToken = crypto.randomBytes(32).toString('hex');
  user.emailVerifyTokenExpires = Date.now() + 24 * 60 * 60 * 1000;

  await user.save();

  await mailer.sendVerificationEmail({
    to: user.email,
    token: user.emailVerifyToken,
  });

  return true;
};
