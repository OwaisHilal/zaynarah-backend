// src/features/users/users.validation.js
const { z } = require('zod');

const addressSchema = z.object({
  fullName: z.string().min(1).max(120),
  phone: z.string().min(6).max(20),
  email: z.string().email().optional().or(z.literal('')).optional(),
  addressLine1: z.string().min(1).max(500),
  addressLine2: z.string().max(500).optional().or(z.literal('')).optional(),
  city: z.string().min(1).max(100),
  state: z.string().min(1).max(100),
  postalCode: z.string().min(3).max(20),
  country: z.string().default('India'),
  type: z.enum(['home', 'work', 'other']).default('home'),
  isDefault: z.boolean().default(false),
});

const registerSchema = z.object({
  name: z.string().min(2),
  email: z.string().email(),
  password: z.string().min(6),
});

const updateProfileSchema = z
  .object({
    name: z.string().min(2).max(50).optional(),
    email: z.string().email().optional(),
    addresses: z.array(addressSchema).optional(),
  })
  .refine((v) => Object.keys(v).length > 0);

const changePasswordSchema = z.object({
  oldPassword: z.string().min(1),
  newPassword: z.string().min(6),
});

const updateRoleSchema = z.object({
  role: z.enum(['customer', 'admin']),
});

const listUsersQuerySchema = z.object({
  page: z.preprocess((v) => Number(v ?? 1), z.number().int().min(1)),
  limit: z.preprocess((v) => Number(v ?? 10), z.number().int().min(1).max(100)),
  search: z.string().optional(),
});

module.exports = {
  addressSchema,
  registerSchema,
  updateProfileSchema,
  changePasswordSchema,
  updateRoleSchema,
  listUsersQuerySchema,
};
