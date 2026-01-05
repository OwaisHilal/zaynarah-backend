// backend/src/features/orders/orders.routes.js
const express = require('express');
const router = express.Router();
const ctrl = require('./orders.controller');
const { requireLogin, requireAdmin } = require('../../middlewares/auth');
const validate = require('../../middlewares/validate');
const {
  updateStatusSchema,
  updateFulfillmentSchema,
  idParamSchema,
  initSessionSchema,
  finalizePricingSchema,
  paymentFailedSchema,
} = require('./orders.validation');

router.get('/my-orders', requireLogin, ctrl.myOrders);

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

router.post('/create', requireLogin, (_req, res) => {
  return res.status(410).json({
    message:
      'Order creation via /orders/create is deprecated. Use checkout session flow instead.',
  });
});

router.get(
  '/:id/invoice',
  requireLogin,
  validate({ params: idParamSchema }),
  ctrl.invoice
);

router.get('/:id', requireLogin, validate({ params: idParamSchema }), ctrl.get);

router.get('/', requireLogin, requireAdmin, ctrl.listAdmin);

router.put(
  '/:id/status',
  requireLogin,
  requireAdmin,
  validate({ body: updateStatusSchema, params: idParamSchema }),
  ctrl.updateStatus
);

router.put(
  '/:id/fulfillment',
  requireLogin,
  requireAdmin,
  validate({ body: updateFulfillmentSchema, params: idParamSchema }),
  ctrl.updateFulfillment
);

router.post(
  '/payment-failed',
  requireLogin,
  validate({ body: paymentFailedSchema }),
  ctrl.paymentFailed
);

module.exports = router;
