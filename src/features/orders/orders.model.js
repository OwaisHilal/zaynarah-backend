// src/orders/orders.model.js
const mongoose = require('mongoose');

const orderSchema = new mongoose.Schema(
  {
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },

    // Multi-step checkout
    checkoutSessionId: { type: String, unique: true, sparse: true },

    items: [
      {
        productId: {
          type: mongoose.Schema.Types.ObjectId,
          ref: 'Product',
          required: true,
        },
        name: { type: String, required: true },
        price: { type: Number, required: true },
        qty: { type: Number, required: true },
        image: String,
      },
    ],

    // Shipping & billing
    address: {
      street: { type: String },
      city: { type: String },
      state: { type: String },
      zip: { type: String },
    },
    shippingAddress: {
      street: { type: String },
      city: { type: String },
      state: { type: String },
      zip: { type: String },
    },
    billingAddress: {
      street: { type: String },
      city: { type: String },
      state: { type: String },
      zip: { type: String },
    },
    shippingMethod: {
      type: String,
      enum: ['standard', 'express'],
      default: 'standard',
    },

    // Payment
    paymentMethod: {
      type: String,
      enum: ['stripe', 'razorpay'],
    },
    paymentProvider: {
      type: String,
      enum: ['stripe', 'razorpay'],
      default: null,
    },
    paymentIntentId: { type: String, default: null },
    paymentStatus: {
      type: String,
      enum: ['pending', 'paid', 'failed'],
      default: 'pending',
    },
    transactionId: { type: String },

    // Total & status
    totalAmount: { type: Number, required: true },
    status: {
      type: String,
      enum: ['pending', 'paid', 'failed', 'cancelled', 'draft'],
      default: 'pending',
    },

    // Metadata for calculations and payment failures
    metadata: {
      type: Object,
      default: {},
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model('Order', orderSchema);
