// backend/src/features/orders/orders.validation.js
const { z } = require('zod');

const objectIdString = z
  .string()
  .length(24, 'Invalid id')
  .regex(/^[0-9a-fA-F]{24}$/, 'Invalid id');

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

const fullShippingMethodSchema = z.object({
  _id: z.string().min(1),
  label: z.string().min(1),
  cost: z.number().min(0),
  deliveryEstimate: z.string().optional(),
  carrier: z.string().optional(),
  metadata: z.record(z.any()).optional(),
});

const minimalShippingMethodSchema = z.object({
  _id: z.string().min(1),
  cost: z.number().min(0),
});

const shippingMethodSchema = z.union([
  fullShippingMethodSchema,
  minimalShippingMethodSchema,
]);

const orderItemSchema = z.object({
  productId: objectIdString,
  title: z.string().optional(),
  name: z.string().optional(),
  price: z.number().min(0),
  qty: z.number().int().min(1),
  image: z.string().optional(),
  sku: z.string().optional(),
});

const cartTotalObjectSchema = z.object({
  items: z.number().min(0),
  shipping: z.number().min(0),
  tax: z.number().min(0),
  grand: z.number().min(0),
  currency: z.string().optional().default('INR'),
});

const cartTotalSchema = z.union([cartTotalObjectSchema, z.number().min(0)]);

const createOrderSchema = z.object({
  items: z.array(orderItemSchema).min(1),
  cartTotal: cartTotalSchema,
  shippingAddress: addressSchema,
  billingAddress: addressSchema.optional(),
  shippingMethod: shippingMethodSchema,
  paymentMethod: z.enum(['stripe', 'razorpay']),
  paymentDetails: z.any().optional(),
  metadata: z.any().optional(),
});

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

const confirmPaymentSchema = z.object({
  orderId: objectIdString,
  paymentIntentId: z.string().min(1),
  gateway: z.enum(['stripe', 'razorpay']),
});

const paymentFailedSchema = z.object({
  orderId: objectIdString,
  reason: z.string().min(1),
});

const idParamSchema = z.object({
  id: objectIdString,
});

module.exports = {
  createOrderSchema,
  updateStatusSchema: z.object({
    status: z.enum(['draft', 'pending', 'paid', 'failed', 'cancelled']),
  }),
  idParamSchema,
  initSessionSchema,
  finalizePricingSchema,
  createDraftSchema,
  confirmPaymentSchema,
  paymentFailedSchema,
};
