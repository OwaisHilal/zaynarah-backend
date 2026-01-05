// backend/src/features/orders/orders.validation.js
const { z } = require('zod');

const objectIdString = z
  .string()
  .length(24)
  .regex(/^[0-9a-fA-F]{24}$/);

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

const shippingMethodSchema = z.object({
  _id: z.string().min(1),
  label: z.string().min(1),
  cost: z.number().min(0),
  deliveryEstimate: z.string().optional(),
  carrier: z.string().optional(),
  metadata: z.record(z.any()).optional(),
});

const fulfillmentSchema = z.object({
  carrier: z.string().min(1).optional(),
  trackingId: z.string().min(1).optional(),
  trackingUrl: z.string().url().optional(),
  shippedAt: z.coerce.date().optional(),
  deliveredAt: z.coerce.date().optional(),
});

const initSessionSchema = z.object({});

const finalizePricingSchema = z.object({
  checkoutSessionId: z.string().min(1),
  shippingAddress: addressSchema,
  billingAddress: addressSchema.optional(),
  shippingMethod: shippingMethodSchema,
});

const paymentFailedSchema = z.object({
  orderId: objectIdString,
  reason: z.string().min(1).optional(),
});

const idParamSchema = z.object({
  id: objectIdString,
});

const updateStatusSchema = z.object({
  status: z.enum([
    'draft',
    'priced',
    'payment_pending',
    'confirmed',
    'shipped',
    'delivered',
    'failed',
    'cancelled',
  ]),
  note: z.string().optional(),
});

const updateFulfillmentSchema = z.object({
  fulfillment: fulfillmentSchema,
});

module.exports = {
  initSessionSchema,
  finalizePricingSchema,
  paymentFailedSchema,
  idParamSchema,
  updateStatusSchema,
  updateFulfillmentSchema,
};
