// src/features/users/users.validation.js
const { z } = require('zod');

// Register schema
const registerSchema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters').max(50),
  email: z.string().email('Invalid email'),
  password: z.string().min(6, 'Password must be at least 6 characters'),
});

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
  registerSchema,
  updateProfileSchema,
  changePasswordSchema,
  updateRoleSchema,
};
