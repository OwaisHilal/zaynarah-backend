// src/features/payments/payments.routes.js
const express = require('express');
const ctrl = require('./payments.controller');
const { auth } = require('../../middlewares/auth');
const router = express.Router();

router.post('/stripe-session', auth, ctrl.createStripeSession);
router.post('/razorpay-order', auth, ctrl.createRazorpayOrder);

module.exports = router;
