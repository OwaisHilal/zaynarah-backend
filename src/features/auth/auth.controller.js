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
    const meta = {
      userAgent: req.headers['user-agent'],
      ip: req.ip,
    };

    const body = {
      ...req.validatedBody,
      rememberMe: !!req.validatedBody?.rememberMe,
    };

    const result = await authService.login(body, meta);
    res.json(result);
  } catch (err) {
    next(err);
  }
};

exports.logout = async (req, res, next) => {
  try {
    await authService.logoutSession(req.session.jti);
    res.json({ success: true });
  } catch (err) {
    next(err);
  }
};

exports.me = async (req, res) => {
  res.json({
    user: req.user,
    currentSessionId: req.session._id,
  });
};

exports.listSessions = async (req, res, next) => {
  try {
    const sessions = await authService.listSessions(req.user.id);
    res.json({
      currentSessionId: req.session._id,
      sessions,
    });
  } catch (err) {
    next(err);
  }
};

exports.revokeSession = async (req, res, next) => {
  try {
    await authService.revokeSessionById(
      req.user.id,
      req.params.sessionId,
      req.session._id
    );
    res.json({ success: true });
  } catch (err) {
    next(err);
  }
};

exports.revokeAllSessions = async (req, res, next) => {
  try {
    await authService.revokeAllExceptCurrent(req.user.id, req.session._id);
    res.json({ success: true });
  } catch (err) {
    next(err);
  }
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

exports.forgotPassword = async (req, res, next) => {
  try {
    await authService.forgotPassword(req.body.email);
    res.json({ success: true });
  } catch (err) {
    next(err);
  }
};

exports.resetPassword = async (req, res, next) => {
  try {
    await authService.resetPassword(req.body);
    res.json({ success: true });
  } catch (err) {
    next(err);
  }
};
