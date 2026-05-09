// ============================================================
// NIKATO — lib/validations.ts
// Zod schemas for all frontend forms and API inputs
// ============================================================

import { z } from 'zod';

// ── Auth ─────────────────────────────────────────────────────

export const phoneSchema = z
  .string()
  .regex(/^\+91[6-9]\d{9}$/, 'Enter a valid Indian mobile number (+91XXXXXXXXXX)');

export const otpSchema = z
  .string()
  .length(6, 'OTP must be exactly 6 digits')
  .regex(/^\d+$/, 'OTP must contain only digits');

export const loginSchema = z.object({
  phone: phoneSchema,
});

export const otpVerifySchema = z.object({
  phone: phoneSchema,
  token: otpSchema,
});

// ── Address ──────────────────────────────────────────────────

export const addressSchema = z.object({
  label: z.string().min(1, 'Label is required').max(50),
  address_line: z.string().min(5, 'Address is too short').max(255),
  city: z.string().min(2, 'City is required').max(100),
  pincode: z.string().regex(/^\d{6}$/, 'Enter a valid 6-digit pincode'),
  lat: z.number().min(-90).max(90),
  lng: z.number().min(-180).max(180),
  is_default: z.boolean().optional().default(false),
});

export type AddressFormData = z.infer<typeof addressSchema>;

// ── Order ────────────────────────────────────────────────────

export const createOrderSchema = z.object({
  address_id: z.string().uuid('Invalid address'),
  payment_method: z.enum(['COD', 'ONLINE']),
  special_instructions: z.string().max(500).optional(),
});

export type CreateOrderFormData = z.infer<typeof createOrderSchema>;

// ── Profile ──────────────────────────────────────────────────

export const profileUpdateSchema = z.object({
  full_name: z.string().min(2, 'Name must be at least 2 characters').max(100),
  email: z.string().email('Enter a valid email').optional().or(z.literal('')),
});

export type ProfileUpdateFormData = z.infer<typeof profileUpdateSchema>;

// ── Search ───────────────────────────────────────────────────

export const searchSchema = z.object({
  query: z.string().min(1).max(100).trim(),
});
