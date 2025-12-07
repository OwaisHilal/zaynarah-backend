// src/features/orders/orders.routes.js
const express = require('express');
const router = express.Router();

const ctrl = require('./orders.controller');
const { requireLogin, requireAdmin } = require('../../middlewares/auth');
const validate = require('../../middlewares/validate');

const {
  createOrderSchema,
  updateStatusSchema,
  idParamSchema,
} = require('./orders.validation');

router.post('/', requireLogin, validate(createOrderSchema), ctrl.create);

router.get('/:id', requireLogin, validate({ params: idParamSchema }), ctrl.get);

router.get('/', requireLogin, requireAdmin, ctrl.listAdmin);

router.put(
  '/:id/status',
  requireLogin,
  requireAdmin,
  validate({
    body: updateStatusSchema,
    params: idParamSchema,
  }),
  ctrl.updateStatus
);

module.exports = router;
