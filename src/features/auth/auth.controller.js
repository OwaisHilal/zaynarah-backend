//src/features/auth/auth.controller.js
const authService = require('./auth.service');

exports.register = async (req, res, next) => {
  try {
    const result = await authService.register(req.validatedBody);
    res.status(201).json(result);
  } catch (err) {
    next(err);
  }
};

exports.login = async (req, res, next) => {
  try {
    const result = await authService.login(req.validatedBody);
    res.json(result);
  } catch (err) {
    next(err);
  }
};

exports.me = async (req, res, next) => {
  try {
    res.json(req.user);
  } catch (err) {
    next(err);
  }
};

exports.verifyEmail = async (req, res, next) => {
  try {
    const { token } = req.query;
    if (!token) return res.status(400).json({ message: 'Token required' });

    await authService.verifyEmail(token);
    res.json({ success: true });
  } catch (err) {
    next(err);
  }
};

exports.resendVerification = async (req, res, next) => {
  try {
    await authService.resendVerification(req.user._id);
    res.json({ success: true });
  } catch (err) {
    next(err);
  }
};
