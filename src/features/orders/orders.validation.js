// src/orders/orders.validation.js
const { z } = require('zod');

const objectIdString = z
  .string()
  .length(24, 'Invalid id')
  .regex(/^[0-9a-fA-F]{24}$/, 'Invalid id');

const orderItemSchema = z.object({
  productId: objectIdString,
  name: z.string().min(1),
  price: z.number().positive(),
  qty: z.number().int().min(1, 'Quantity must be at least 1'),
  image: z.string().optional(),
});

// --- Legacy full order ---
const createOrderSchema = z.object({
  items: z.array(orderItemSchema).min(1, 'Order must have at least 1 item'),
  address: z.object({
    street: z.string().min(1),
    city: z.string().min(1),
    state: z.string().min(1),
    zip: z.string().min(1),
  }),
  totalAmount: z.number().positive(),
  currency: z.string().optional().default('INR'),
  paymentMethod: z.enum(['stripe', 'razorpay']),
});

// --- Admin update status ---
const updateStatusSchema = z.object({
  status: z.enum(['pending', 'paid', 'failed', 'cancelled', 'draft']),
});

const idParamSchema = z.object({
  id: objectIdString,
});

// --- New checkout endpoints ---
const initSessionSchema = z.object({}); // no payload needed

const finalizePricingSchema = z.object({
  checkoutSessionId: z.string().min(1),
  shippingAddress: z.object({
    street: z.string().min(1),
    city: z.string().min(1),
    state: z.string().min(1),
    zip: z.string().min(1),
  }),
  billingAddress: z
    .object({
      street: z.string().min(1),
      city: z.string().min(1),
      state: z.string().min(1),
      zip: z.string().min(1),
    })
    .optional(),
  shippingMethod: z
    .enum(['standard', 'express'])
    .optional()
    .default('standard'),
});

const createDraftSchema = z.object({
  checkoutSessionId: z.string().min(1),
  paymentGateway: z.enum(['stripe', 'razorpay']),
});

// --- Payment schemas ---
const confirmPaymentSchema = z.object({
  orderId: objectIdString,
  paymentIntentId: z.string().min(1),
  gateway: z.enum(['stripe', 'razorpay']),
});

const paymentFailedSchema = z.object({
  orderId: objectIdString,
  reason: z.string().min(1),
});

module.exports = {
  createOrderSchema,
  updateStatusSchema,
  idParamSchema,
  initSessionSchema,
  finalizePricingSchema,
  createDraftSchema,
  confirmPaymentSchema,
  paymentFailedSchema,
};
