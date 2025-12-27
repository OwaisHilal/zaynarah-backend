// src/features/payments/payments.routes.js
const express = require('express');
const router = express.Router();

const ctrl = require('./payments.controller');
const { requireLogin } = require('../../middlewares/auth');

router.post('/stripe-session', requireLogin, ctrl.createStripeCheckoutSession);
router.post('/stripe-verify', requireLogin, ctrl.verifyStripePayment);

router.post('/razorpay-order', requireLogin, ctrl.createRazorpayOrder);
router.post('/razorpay-verify', requireLogin, ctrl.verifyRazorpaySignature);

router.get('/status/:paymentId', requireLogin, ctrl.getPaymentStatus);

module.exports = router;
