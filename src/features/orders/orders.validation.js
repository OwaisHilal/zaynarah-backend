// backend/src/features/orders/orders.validation.js
const { z } = require('zod');

const objectIdString = z
  .string()
  .length(24, 'Invalid id')
  .regex(/^[0-9a-fA-F]{24}$/, 'Invalid id');

/* ======================
   ADDRESS
====================== */

const addressSchema = z.object({
  fullName: z.string().min(1),
  phone: z.string().min(5),
  email: z.string().email().optional(),
  addressLine1: z.string().min(1),
  addressLine2: z.string().optional().default(''),
  city: z.string().min(1),
  state: z.string().min(1),
  postalCode: z.string().min(1),
  country: z.string().min(1),
});

/* ======================
   SHIPPING METHOD
   (Normalized – backend authority)
====================== */

const shippingMethodSchema = z.object({
  _id: z.string().min(1),
  label: z.string().min(1),
  cost: z.number().min(0),
  deliveryEstimate: z.string().optional(),
  carrier: z.string().optional(),
  metadata: z.record(z.any()).optional(),
});

/* ======================
   SESSION CHECKOUT
====================== */

const initSessionSchema = z.object({});

const finalizePricingSchema = z.object({
  checkoutSessionId: z.string().min(1),
  shippingAddress: addressSchema,
  billingAddress: addressSchema.optional(),
  shippingMethod: shippingMethodSchema,
  weight: z.number().min(0).optional().default(0),
  itemsCount: z.number().int().min(0).optional().default(0),
});

const createDraftSchema = z.object({
  checkoutSessionId: z.string().min(1),
  paymentGateway: z.enum(['stripe', 'razorpay']),
});

/* ======================
   PAYMENT
====================== */

const confirmPaymentSchema = z.object({
  orderId: objectIdString,
  paymentIntentId: z.string().min(1),
  gateway: z.enum(['stripe', 'razorpay']),
});

const paymentFailedSchema = z.object({
  orderId: objectIdString,
  reason: z.string().min(1),
});

/* ======================
   PARAMS / ADMIN
====================== */

const idParamSchema = z.object({
  id: objectIdString,
});

const updateStatusSchema = z.object({
  status: z.enum(['draft', 'pending', 'paid', 'failed', 'cancelled']),
});

module.exports = {
  initSessionSchema,
  finalizePricingSchema,
  createDraftSchema,

  // payments
  confirmPaymentSchema,
  paymentFailedSchema,

  // admin / access
  idParamSchema,
  updateStatusSchema,
};
