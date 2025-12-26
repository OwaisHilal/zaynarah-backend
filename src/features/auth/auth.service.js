const jwt = require('jsonwebtoken');
const crypto = require('crypto');
const User = require('../users/users.model');
const ApiError = require('../../core/errors/ApiError');

function signToken(id) {
  return jwt.sign({ id }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRES_IN || '7d',
  });
}

/* =========================
   REGISTER
========================= */
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
  });

  const token = signToken(user.id);

  // NOTE: Email sending can be added later
  return {
    user,
    token,
    emailVerifyToken, // useful for now (manual testing / frontend)
  };
};

/* =========================
   LOGIN
========================= */
exports.login = async ({ email, password }) => {
  const user = await User.findOne({ email }).select('+password');
  if (!user) throw new ApiError(400, 'Invalid credentials');

  const match = await user.matchPassword(password);
  if (!match) throw new ApiError(400, 'Invalid credentials');

  const token = signToken(user.id);
  return { user, token };
};

/* =========================
   VERIFY EMAIL (MANUAL)
========================= */
exports.verifyEmail = async (token) => {
  if (!token) throw new ApiError(400, 'Verification token required');

  const user = await User.findOne({ emailVerifyToken: token });
  if (!user) throw new ApiError(400, 'Invalid or expired verification token');

  user.emailVerified = true;
  user.emailVerifyToken = undefined;
  await user.save();

  return true;
};

/* =========================
   RESEND VERIFICATION
========================= */
exports.resendVerification = async (userId) => {
  const user = await User.findById(userId);
  if (!user) throw new ApiError(404, 'User not found');

  if (user.emailVerified) return true;

  user.emailVerifyToken = crypto.randomBytes(32).toString('hex');
  await user.save();

  // NOTE: Email sending hook goes here later
  return true;
};
