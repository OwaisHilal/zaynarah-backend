// src/features/users/users.validation.js
const { z } = require('zod');

const addressSchema = z.object({
  fullName: z.string().min(1, 'Full name required').max(120),
  phone: z
    .string()
    .min(6, 'Phone required')
    .max(20, 'Phone too long')
    .regex(/^[\d+\-\s()]+$/, 'Phone contains invalid characters'),
  email: z.string().email().optional().or(z.literal('')).optional(),
  addressLine1: z.string().min(1, 'Address line 1 required').max(500),
  addressLine2: z.string().max(500).optional().or(z.literal('')).optional(),
  city: z.string().min(1, 'City required').max(100),
  state: z.string().min(1, 'State required').max(100),
  postalCode: z.string().min(3, 'Postal code required').max(20),
  country: z.string().min(2).max(100).optional().default('India'),
  type: z.enum(['home', 'work', 'other']).optional().default('home'),
  isDefault: z.boolean().optional().default(false),
});

// Auth / profile schemas
const registerSchema = z.object({
  name: z.string().min(2, 'Name is required'),
  email: z.string().email('Valid email required'),
  password: z.string().min(6, 'Password must be at least 6 characters'),
});

const updateProfileSchema = z
  .object({
    name: z.string().min(2).max(50).optional(),
    email: z.string().email().optional(),
    // optional addresses array for bulk updates
    addresses: z.array(addressSchema).optional(),
  })
  .refine((obj) => Object.keys(obj).length > 0, {
    message: 'At least one field is required',
  });

const changePasswordSchema = z.object({
  oldPassword: z.string().min(1, 'Old password required'),
  newPassword: z.string().min(6, 'New password must be at least 6 characters'),
});

const updateRoleSchema = z.object({
  role: z.enum(['customer', 'admin']),
});

module.exports = {
  addressSchema,
  registerSchema,
  updateProfileSchema,
  changePasswordSchema,
  updateRoleSchema,
};
