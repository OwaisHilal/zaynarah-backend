// src/features/users/users.validation.js
const { z } = require('zod');

// Address schema
const addressSchema = z.object({
  name: z.string().min(1, 'Address name required').max(100),
  details: z.string().min(1, 'Address details required').max(500),
});

// Update profile schema
const updateProfileSchema = z
  .object({
    name: z.string().min(2).max(50).optional(),
    email: z.string().email().optional(),
    addresses: z.array(addressSchema).optional(),
  })
  .refine((obj) => Object.keys(obj).length > 0, {
    message: 'At least one field is required',
  });

const registerSchema = z.object({
  name: z.string().min(2, 'Name is required'),
  email: z.string().email('Valid email required'),
  password: z.string().min(6, 'Password must be at least 6 characters'),
});

// Change password
const changePasswordSchema = z.object({
  oldPassword: z.string().min(1, 'Old password required'),
  newPassword: z.string().min(6, 'New password must be at least 6 characters'),
});

// Update role
const updateRoleSchema = z.object({
  role: z.enum(['customer', 'admin']),
});

module.exports = {
  updateProfileSchema,
  changePasswordSchema,
  updateRoleSchema,
  addressSchema,
  registerSchema,
};
