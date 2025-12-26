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
