// src/features/products/products.validation.js
const { z } = require('zod');

const objectIdString = z
  .string()
  .length(24, 'Invalid id length')
  .regex(/^[0-9a-fA-F]{24}$/, 'Invalid id format');

const variantSchema = z.object({
  sku: z.string().optional(),
  options: z.record(z.any()).optional(),
  price: z.number().positive().optional(),
  stock: z.number().int().nonnegative().optional(),
});

const createProductSchema = z
  .object({
    title: z.string().min(1, 'Title is required'),
    description: z.string().optional().nullable(),
    price: z.number().nonnegative().optional(),
    images: z.array(z.string().url().optional()).optional().default([]),
    variants: z.array(variantSchema).optional().default([]),
    metadata: z.record(z.any()).optional().default({}),
    stock: z.number().int().nonnegative().optional().default(0),
    category: z.string().optional().nullable(),
  })
  .strict();

const updateProductSchema = createProductSchema.partial();

const listProductsQuery = z.object({
  q: z.string().optional().nullable(),
  category: z.string().optional().nullable(),
  priceMax: z.preprocess(
    (v) => (v ? Number(v) : undefined),
    z.number().nonnegative().optional()
  ),
  page: z.preprocess(
    (v) => (v ? Number(v) : 1),
    z.number().int().min(1).default(1)
  ),
  limit: z.preprocess(
    (v) => (v ? Number(v) : 20),
    z.number().int().min(1).max(200).default(20)
  ),
  sort: z // <-- FIX IS HERE: Use colon-separated strings
    .enum(['price:asc', 'price:desc', 'createdAt:desc', 'createdAt:asc'])
    .optional()
    .nullable(),
});

const idParamSchema = z.object({
  id: objectIdString,
});

module.exports = {
  createProductSchema,
  updateProductSchema,
  listProductsQuery,
  idParamSchema,
};
