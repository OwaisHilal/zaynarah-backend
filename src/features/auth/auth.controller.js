// backend/src/features/auth/auth.controller.js
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

exports.me = async (req, res) => {
  res.json(req.user);
};

exports.verifyEmail = async (req, res, next) => {
  try {
    await authService.verifyEmail(req.query.token);
    res.json({ success: true });
  } catch (err) {
    next(err);
  }
};

exports.resendVerification = async (req, res, next) => {
  try {
    await authService.resendVerification(req.user.id);
    res.json({ success: true });
  } catch (err) {
    next(err);
  }
};
