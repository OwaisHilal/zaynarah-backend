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
  initSessionSchema,
  finalizePricingSchema,
  createDraftSchema,
  confirmPaymentSchema,
  paymentFailedSchema,
} = require('./orders.validation');

/* ======================
   USER ROUTES (FIRST)
====================== */

router.get('/my-orders', requireLogin, ctrl.myOrders);

/* ======================
   CHECKOUT LIFECYCLE
====================== */

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

// Manual create (fallback)
router.post(
  '/create',
  requireLogin,
  validate({ body: createOrderSchema }),
  ctrl.create
);

/* ======================
   ORDER ACCESS
====================== */

router.get('/:id', requireLogin, validate({ params: idParamSchema }), ctrl.get);

/* ======================
   ADMIN
====================== */

router.get('/', requireLogin, requireAdmin, ctrl.listAdmin);

router.put(
  '/:id/status',
  requireLogin,
  requireAdmin,
  validate({ body: updateStatusSchema, params: idParamSchema }),
  ctrl.updateStatus
);

/* ======================
   PAYMENT CALLBACKS
====================== */

router.post(
  '/confirm-payment',
  requireLogin,
  validate({ body: confirmPaymentSchema }),
  ctrl.confirmPayment
);

router.post(
  '/payment-failed',
  requireLogin,
  validate({ body: paymentFailedSchema }),
  ctrl.paymentFailed
);

module.exports = router;
