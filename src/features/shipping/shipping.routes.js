// src/features/shipping/shipping.routes.js
const express = require('express');
const router = express.Router();
const ctrl = require('./shipping.controller');
const { requireLogin } = require('../../middlewares/auth');

// Note: frontend expects POST /shipping/methods with { address, weight, itemsCount }
router.post('/methods', requireLogin, ctrl.getMethods);
router.post('/calculate', requireLogin, ctrl.calculate);

module.exports = router;
