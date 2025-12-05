const express = require('express');
const ctrl = require('./payments.controller');
const { requireLogin } = require('../../middlewares/auth');

const router = express.Router();

router.post('/stripe-session', requireLogin, ctrl.createStripeSession);
router.post('/razorpay-order', requireLogin, ctrl.createRazorpayOrder);

module.exports = router;
