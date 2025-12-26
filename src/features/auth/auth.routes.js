// src/feature/auth/auth.routes.js
const router = require('express').Router();
const authCtrl = require('./auth.controller');
const validate = require('../../middlewares/validate');
const { requireLogin } = require('../../middlewares/auth');
const { registerSchema } = require('../users/users.validation');
const { loginSchema } = require('./auth.validation');

router.post('/register', validate(registerSchema), authCtrl.register);
router.post('/login', validate(loginSchema), authCtrl.login);
router.get('/me', requireLogin, authCtrl.me);

module.exports = router;
