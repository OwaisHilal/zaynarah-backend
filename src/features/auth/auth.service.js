// backend/src/features/auth/auth.service.js
const jwt = require('jsonwebtoken');
const crypto = require('crypto');
const User = require('../users/users.model');
const UserSession = require('./userSession.model');
const ApiError = require('../../core/errors/ApiError');
const mailer = require('../../services/mailer.service');

function signToken({ userId, jti }) {
  return jwt.sign({ id: userId, jti }, process.env.JWT_SECRET, {
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
    emailVerifyTokenExpires: Date.now() + 86400000,
  });

  await mailer.sendVerificationEmail({
    to: user.email,
    token: emailVerifyToken,
  });

  const jti = crypto.randomUUID();
  await UserSession.create({ user: user.id, jti });

  return {
    user,
    token: signToken({ userId: user.id, jti }),
  };
};

exports.login = async ({ email, password }, meta) => {
  const user = await User.findOne({ email }).select('+password');
  if (!user) throw new ApiError(400, 'Invalid credentials');

  const match = await user.matchPassword(password);
  if (!match) throw new ApiError(400, 'Invalid credentials');

  if (!user.emailVerified) {
    throw new ApiError(403, 'Please verify your email first');
  }

  const jti = crypto.randomUUID();

  await UserSession.create({
    user: user.id,
    jti,
    userAgent: meta?.userAgent,
    ip: meta?.ip,
  });

  return {
    user,
    token: signToken({ userId: user.id, jti }),
  };
};

exports.logoutSession = async (jti) => {
  await UserSession.findOneAndUpdate(
    { jti, revokedAt: null },
    { revokedAt: new Date() }
  );
};

exports.listSessions = async (userId) => {
  return UserSession.find({ user: userId, revokedAt: null })
    .sort({ lastSeenAt: -1 })
    .lean();
};

exports.revokeSessionById = async (userId, sessionId, currentSessionId) => {
  if (sessionId === String(currentSessionId)) {
    throw new ApiError(400, 'Cannot revoke current session');
  }

  await UserSession.findOneAndUpdate(
    { _id: sessionId, user: userId, revokedAt: null },
    { revokedAt: new Date() }
  );
};

exports.revokeAllExceptCurrent = async (userId, currentSessionId) => {
  await UserSession.updateMany(
    {
      user: userId,
      revokedAt: null,
      _id: { $ne: currentSessionId },
    },
    { revokedAt: new Date() }
  );
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
};

exports.resendVerification = async (userId) => {
  const user = await User.findById(userId);
  if (!user || user.emailVerified) return;

  user.emailVerifyToken = crypto.randomBytes(32).toString('hex');
  user.emailVerifyTokenExpires = Date.now() + 86400000;

  await user.save();

  await mailer.sendVerificationEmail({
    to: user.email,
    token: user.emailVerifyToken,
  });
};

exports.forgotPassword = async (email) => {
  const user = await User.findOne({ email });
  if (!user) return;

  const resetToken = crypto.randomBytes(32).toString('hex');
  const hashedToken = crypto
    .createHash('sha256')
    .update(resetToken)
    .digest('hex');

  user.passwordResetToken = hashedToken;
  user.passwordResetTokenExpires = Date.now() + 1800000;

  await user.save({ validateBeforeSave: false });

  await mailer.sendPasswordResetEmail({
    to: user.email,
    token: resetToken,
  });
};

exports.resetPassword = async ({ token, newPassword }) => {
  const hashedToken = crypto.createHash('sha256').update(token).digest('hex');

  const user = await User.findOne({
    passwordResetToken: hashedToken,
    passwordResetTokenExpires: { $gt: Date.now() },
  });

  if (!user) throw new ApiError(400, 'Invalid or expired reset token');

  user.password = newPassword;
  user.passwordResetToken = undefined;
  user.passwordResetTokenExpires = undefined;

  await user.save();
};
