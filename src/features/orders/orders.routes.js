// src/features/orders/orders.routes.js
const express = require('express');
const ctrl = require('./orders.controller');
const { requireLogin, requireAdmin } = require('../../middlewares/auth');
const router = express.Router();

router.post('/', requireLogin, ctrl.create);
router.get('/:id', requireLogin, ctrl.get);
router.get('/', requireLogin, requireAdmin, ctrl.listAdmin);
router.put('/:id/status', requireLogin, requireAdmin, ctrl.updateStatus);

module.exports = router;
