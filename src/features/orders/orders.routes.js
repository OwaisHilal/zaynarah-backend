// src/orders/orders.routes.js
const express = require('express');
const router = express.Router();
const ctrl = require('./orders.controller');
const { requireLogin, requireAdmin } = require('../../middlewares/auth');
const validate = require('../../middlewares/validate');
const {
  createOrderSchema,
  updateStatusSchema,
  idParamSchema,
  initSessionSchema,
  finalizePricingSchema,
  createDraftSchema,
} = require('./orders.validation');

// Checkout session
router.post(
  '/checkout/session/init',
  requireLogin,
  validate({ body: initSessionSchema }),
  ctrl.initSession
);
router.post(
  '/checkout/session/finalize-pricing',
  requireLogin,
  validate({ body: finalizePricingSchema }),
  ctrl.finalizePricing
);
router.post(
  '/create-draft',
  requireLogin,
  validate({ body: createDraftSchema }),
  ctrl.createDraft
);

// Manual order
router.post(
  '/',
  requireLogin,
  validate({ body: createOrderSchema }),
  ctrl.create
);
router.get('/:id', requireLogin, validate({ params: idParamSchema }), ctrl.get);

// Admin routes
router.get('/', requireLogin, requireAdmin, ctrl.listAdmin);
router.put(
  '/:id/status',
  requireLogin,
  requireAdmin,
  validate({ body: updateStatusSchema, params: idParamSchema }),
  ctrl.updateStatus
);

// User orders
router.get('/my-orders', requireLogin, ctrl.myOrders);

// Payment webhooks
router.post('/confirm-payment', requireLogin, ctrl.confirmPayment);
router.post('/payment-failed', requireLogin, ctrl.paymentFailed);

module.exports = router;
