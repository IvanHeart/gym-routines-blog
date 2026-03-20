import { z } from 'zod'

// ─── Product Category ─────────────────────────────────────────
export const productCategorySchema = z.object({
  name: z.string().min(2, 'Mínimo 2 caracteres').max(50, 'Máximo 50 caracteres'),
  slug: z
    .string()
    .min(2)
    .max(50)
    .regex(/^[a-z0-9-]+$/, 'Solo letras minúsculas, números y guiones'),
  color: z.string().regex(/^#[0-9a-fA-F]{6}$/, 'Formato hex inválido (ej: #FF5733)'),
})

export type ProductCategoryFormValues = z.infer<typeof productCategorySchema>

// ─── Product ──────────────────────────────────────────────────
export const productSchema = z.object({
  name: z
    .string()
    .min(5, 'El nombre debe tener al menos 5 caracteres')
    .max(150, 'El nombre no puede superar 150 caracteres'),
  description: z
    .string()
    .min(10, 'La descripción debe tener al menos 10 caracteres')
    .max(5000, 'La descripción no puede superar 5000 caracteres'),
  price: z.coerce
    .number()
    .min(0.01, 'El precio debe ser mayor a 0')
    .max(999999.99, 'Precio demasiado alto'),
  stock: z.coerce
    .number()
    .int('El stock debe ser un número entero')
    .min(0, 'El stock no puede ser negativo')
    .max(99999, 'Stock demasiado alto'),
  brand: z.string().max(100).optional().nullable(),
  weight: z.coerce.number().min(0).max(99999.99).optional().nullable(),
  dimensions: z.string().max(50).optional().nullable(),
  category_id: z.string().uuid().optional().nullable(),
  published: z.boolean().default(false),
})

export type ProductFormValues = z.infer<typeof productSchema>

// ─── Shipping Address ─────────────────────────────────────────
export const shippingAddressSchema = z.object({
  full_name: z
    .string()
    .min(2, 'El nombre debe tener al menos 2 caracteres')
    .max(100, 'Máximo 100 caracteres'),
  phone: z
    .string()
    .min(7, 'El teléfono debe tener al menos 7 dígitos')
    .max(20, 'Máximo 20 caracteres'),
  address_line: z
    .string()
    .min(5, 'La dirección debe tener al menos 5 caracteres')
    .max(200, 'Máximo 200 caracteres'),
  city: z.string().min(2, 'Mínimo 2 caracteres').max(100),
  state: z.string().min(2, 'Mínimo 2 caracteres').max(100),
  postal_code: z.string().min(3, 'Mínimo 3 caracteres').max(10),
  country: z.string().default('México'),
  notes: z.string().max(500).optional().nullable(),
  is_default: z.boolean().default(false),
})

export type ShippingAddressFormValues = z.infer<typeof shippingAddressSchema>

// ─── Cart ─────────────────────────────────────────────────────
export const addToCartSchema = z.object({
  productId: z.string().uuid('ID de producto inválido'),
  quantity: z.coerce.number().int().min(1, 'Mínimo 1 unidad').max(99, 'Máximo 99 unidades'),
})

export type AddToCartFormValues = z.infer<typeof addToCartSchema>

// ─── Checkout ─────────────────────────────────────────────────
export const checkoutSchema = z.object({
  shipping_address_id: z.string().uuid('Selecciona una dirección de envío'),
  notes: z.string().max(500).optional().nullable(),
})

export type CheckoutFormValues = z.infer<typeof checkoutSchema>
