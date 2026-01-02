const mongoose = require('mongoose');

const addressSchema = new mongoose.Schema(
  {
    fullName: String,
    phone: String,
    email: String,
    addressLine1: String,
    addressLine2: String,
    city: String,
    state: String,
    postalCode: String,
    country: String,
  },
  { _id: false }
);

const shippingMethodSchema = new mongoose.Schema(
  {
    _id: String,
    label: String,
    cost: { type: Number, default: 0 },
    deliveryEstimate: String,
    carrier: String,
    metadata: { type: Object, default: {} },
  },
  { _id: false }
);

const itemSchema = new mongoose.Schema(
  {
    productId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Product',
      required: true,
    },
    title: String,
    price: { type: Number, required: true },
    qty: { type: Number, required: true },
    image: String,
    sku: String,
  },
  { _id: false }
);

const cartTotalSchema = new mongoose.Schema(
  {
    items: { type: Number, default: 0 },
    shipping: { type: Number, default: 0 },
    tax: { type: Number, default: 0 },
    grand: { type: Number, default: 0 },
    currency: { type: String, default: 'INR' },
  },
  { _id: false }
);

const statusHistorySchema = new mongoose.Schema(
  {
    from: String,
    to: String,
    at: { type: Date, default: Date.now },
    actor: {
      id: mongoose.Schema.Types.ObjectId,
      role: String,
    },
    note: String,
  },
  { _id: false }
);

const fulfillmentSchema = new mongoose.Schema(
  {
    carrier: String,
    trackingId: String,
    trackingUrl: String,
    shippedAt: Date,
    deliveredAt: Date,
  },
  { _id: false }
);

const orderSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },

    checkoutSessionId: {
      type: String,
      unique: true,
      sparse: true,
      index: true,
    },

    items: {
      type: [itemSchema],
      required: true,
    },

    cartTotal: {
      type: cartTotalSchema,
      required: true,
    },

    shippingAddress: addressSchema,
    billingAddress: addressSchema,

    shippingMethod: shippingMethodSchema,

    fulfillment: {
      type: fulfillmentSchema,
      default: {},
    },

    paymentMethod: {
      type: String,
      enum: ['stripe', 'razorpay'],
      required: true,
    },

    paymentDetails: {
      type: Object,
      default: {},
    },

    paymentProvider: {
      type: String,
      enum: ['stripe', 'razorpay'],
    },

    paymentIntentId: {
      type: String,
      index: true,
    },

    paymentStatus: {
      type: String,
      enum: ['pending', 'paid', 'failed'],
      default: 'pending',
      index: true,
    },

    failureReason: {
      type: String,
    },

    failedAt: {
      type: Date,
    },

    refunds: {
      type: [
        {
          amount: Number,
          gateway: String,
          refundId: String,
          reason: String,
          createdAt: { type: Date, default: Date.now },
        },
      ],
      default: [],
    },

    status: {
      type: String,
      enum: [
        'draft',
        'pending',
        'paid',
        'shipped',
        'delivered',
        'failed',
        'cancelled',
      ],
      default: 'pending',
      index: true,
    },

    statusHistory: {
      type: [statusHistorySchema],
      default: [],
    },

    metadata: {
      type: Object,
      default: {},
    },

    paidAt: Date,
  },
  { timestamps: true }
);

module.exports = mongoose.model('Order', orderSchema);
