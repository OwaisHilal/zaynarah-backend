// backend/src/features/payments/payments.validation.js
const { z } = require('zod');

const objectIdString = z
  .string()
  .length(24)
  .regex(/^[0-9a-fA-F]{24}$/);

const createStripeSessionSchema = z.object({
  orderId: objectIdString,
});

const createRazorpayOrderSchema = z.object({
  orderId: objectIdString,
});

const refundPaymentSchema = z.object({
  orderId: objectIdString,
  amount: z.number().positive(),
  reason: z.string().min(1).optional(),
});

const paymentStatusParamsSchema = z.object({
  paymentId: z.string().min(1),
});

module.exports = {
  createStripeSessionSchema,
  createRazorpayOrderSchema,
  refundPaymentSchema,
  paymentStatusParamsSchema,
};
