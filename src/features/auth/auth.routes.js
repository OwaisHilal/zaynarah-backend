// src/features/auth/auth.routes.js
const express = require('express');
const ctrl = require('./auth.controller');
const router = express.Router();

router.post('/register', ctrl.register);
router.post('/login', ctrl.login);
router.get('/me', ctrl.me);

module.exports = router;
