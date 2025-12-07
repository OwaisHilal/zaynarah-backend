// src/features/cart/cart.validation.js
const { z } = require('zod');

const objectIdString = z
  .string()
  .length(24, 'Invalid product ID')
  .regex(/^[0-9a-fA-F]{24}$/, 'Invalid product ID');

const addItemSchema = z.object({
  productId: objectIdString,
  quantity: z.number().int().min(1).optional().default(1),
});

const updateItemSchema = z.object({
  quantity: z.number().int().min(1, 'Quantity must be at least 1'),
});

const removeItemSchema = z.object({
  productId: objectIdString,
});

const adminGetCartsSchema = z.object({
  page: z.preprocess(
    (v) => (v ? Number(v) : 1),
    z.number().int().min(1).default(1)
  ),
  limit: z.preprocess(
    (v) => (v ? Number(v) : 20),
    z.number().int().min(1).max(100).default(20)
  ),
  search: z.string().nullable().optional(),
});

module.exports = {
  addItemSchema,
  updateItemSchema,
  removeItemSchema,
  adminGetCartsSchema,
};
