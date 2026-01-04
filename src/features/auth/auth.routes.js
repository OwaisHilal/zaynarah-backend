// backend/src/features/auth/auth.routes.js
const router = require('express').Router();
const authCtrl = require('./auth.controller');
const validate = require('../../middlewares/validate');
const { requireLogin } = require('../../middlewares/auth');
const { registerSchema } = require('../users/users.validation');
const { loginSchema } = require('./auth.validation');

router.post('/register', validate(registerSchema), authCtrl.register);
router.post('/login', validate(loginSchema), authCtrl.login);
router.post('/logout', requireLogin, authCtrl.logout);
router.get('/me', requireLogin, authCtrl.me);

router.get('/sessions', requireLogin, authCtrl.listSessions);
router.delete('/sessions/:sessionId', requireLogin, authCtrl.revokeSession);
router.delete('/sessions', requireLogin, authCtrl.revokeAllSessions);

router.get('/email/verify', authCtrl.verifyEmail);
router.post('/email/resend', requireLogin, authCtrl.resendVerification);

router.post('/password/forgot', authCtrl.forgotPassword);
router.post('/password/reset', authCtrl.resetPassword);

module.exports = router;
