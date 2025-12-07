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

// Create a new order
router.post(
  '/',
  requireLogin,
  validate({ body: createOrderSchema }),
  ctrl.create
);

// Get a single order by ID
router.get('/:id', requireLogin, validate({ params: idParamSchema }), ctrl.get);

// List all orders (admin only)
router.get('/', requireLogin, requireAdmin, ctrl.listAdmin);

// Update order status (admin only)
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
