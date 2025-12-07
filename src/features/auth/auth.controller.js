const jwt = require('jsonwebtoken');
const User = require('../users/users.model');
const ApiError = require('../../core/errors/ApiError');

function signToken(id) {
  return jwt.sign({ id }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRES_IN || '7d',
  });
}

exports.register = async (req, res, next) => {
  try {
    const { name, email, password } = req.validatedBody;
    const exists = await User.findOne({ email });
    if (exists) throw new ApiError(400, 'Email already registered');

    const user = await User.create({ name, email, password });
    const token = signToken(user.id);

    res.status(201).json({ token, user });
  } catch (err) {
    next(err);
  }
};

exports.login = async (req, res, next) => {
  try {
    const { email, password } = req.validatedBody;
    const user = await User.findOne({ email }).select('+password');
    if (!user) throw new ApiError(400, 'Invalid credentials');

    const isMatch = await user.matchPassword(password);
    if (!isMatch) throw new ApiError(400, 'Invalid credentials');

    const token = signToken(user.id);
    res.json({ token, user });
  } catch (err) {
    next(err);
  }
};

exports.me = async (req, res, next) => {
  try {
    if (!req.user) throw new ApiError(401, 'Unauthorized');
    res.json(req.user);
  } catch (err) {
    next(err);
  }
};
