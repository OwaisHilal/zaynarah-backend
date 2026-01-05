// src/features/payments/payments.routes.js
const express = require('express');
const router = express.Router();

const ctrl = require('./payments.controller');
const { requireLogin, requireAdmin } = require('../../middlewares/auth');
const validate = require('../../middlewares/validate');
const {
  createStripeSessionSchema,
  createRazorpayOrderSchema,
  refundPaymentSchema,
  paymentStatusParamsSchema,
} = require('./payments.validation');

router.post(
  '/stripe-session',
  requireLogin,
  validate({ body: createStripeSessionSchema }),
  ctrl.createStripeCheckoutSession
);

router.post('/stripe-verify', requireLogin, ctrl.verifyStripePayment);

router.post(
  '/razorpay-order',
  requireLogin,
  validate({ body: createRazorpayOrderSchema }),
  ctrl.createRazorpayOrder
);

router.post('/razorpay-verify', requireLogin, ctrl.verifyRazorpaySignature);

router.post(
  '/refund',
  requireLogin,
  requireAdmin,
  validate({ body: refundPaymentSchema }),
  ctrl.refundPayment
);

router.get(
  '/status/:paymentId',
  requireLogin,
  validate({ params: paymentStatusParamsSchema }),
  ctrl.getPaymentStatus
);

module.exports = router;
