// src/features/orders/orders.validation.js
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

const updateStatusSchema = z.object({
  status: z.enum(['pending', 'paid', 'failed', 'cancelled']),
});

const idParamSchema = z.object({
  id: objectIdString,
});

module.exports = {
  createOrderSchema,
  updateStatusSchema,
  idParamSchema,
};
