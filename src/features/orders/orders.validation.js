// src/features/orders/orders.validation.js
const { z } = require('zod');

const objectIdString = z
  .string()
  .length(24, 'Invalid id')
  .regex(/^[0-9a-fA-F]{24}$/, 'Invalid id');

const orderItemSchema = z.object({
  productId: objectIdString,
  quantity: z.number().int().min(1, 'Quantity must be at least 1'),
});

const createOrderSchema = z.object({
  items: z.array(orderItemSchema).min(1, 'Order must have at least 1 item'),
  address: z.object({
    name: z.string().min(1),
    details: z.string().min(1),
  }),
  totalAmount: z.number().positive(),
  currency: z.string().optional().default('INR'),
});

const updateStatusSchema = z.object({
  status: z.enum(['pending', 'processing', 'completed', 'cancelled']),
});

const idParamSchema = z.object({
  id: objectIdString,
});

module.exports = {
  createOrderSchema,
  updateStatusSchema,
  idParamSchema,
};
