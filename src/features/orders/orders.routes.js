// src/features/orders/orders.routes.js
const express = require('express');
const ctrl = require('./orders.controller');
const { auth, admin } = require('../../middlewares/auth');
const router = express.Router();

router.post('/', auth, ctrl.create);
router.get('/:id', auth, ctrl.get);
router.get('/', auth, admin, ctrl.listAdmin);
router.put('/:id/status', auth, admin, ctrl.updateStatus);

module.exports = router;
