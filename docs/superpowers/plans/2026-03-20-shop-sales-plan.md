# Tienda / Shop Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add a complete shop module where admins manage gym products and users browse/purchase them with simulated payment.

**Architecture:** New module following existing DAL + Server Actions + Zod pattern. 8 new Supabase tables, a PL/pgSQL RPC for atomic checkout, hybrid localStorage/DB cart via React hook, and new routes under `/(public)/tienda`, `/admin/tienda`, `/admin/pedidos`, `/dashboard/mis-pedidos`, and `/(checkout)/checkout`.

**Tech Stack:** Next.js 16 App Router, Supabase (PostgreSQL + Storage + RLS), Zod 4, react-hook-form, shadcn/ui, nuqs, Sharp, Tailwind CSS 4

**Spec:** `docs/superpowers/specs/2026-03-20-shop-sales-design.md`

---

## File Map

### New files to create

```
src/lib/utils/currency.ts                          — formatPrice() helper
src/lib/validations/shop.ts                         — Zod schemas for all shop entities
src/types/entities/shop.ts                          — TypeScript interfaces for shop entities
src/dal/shop.dal.ts                                 — Product & product category queries
src/dal/cart.dal.ts                                 — Cart queries
src/dal/orders.dal.ts                               — Order queries
src/actions/shop.actions.ts                         — Admin CRUD: products + product categories
src/actions/cart.actions.ts                         — Cart server actions + sync
src/actions/order.actions.ts                        — Create order, update status, cancel
src/actions/address.actions.ts                      — CRUD shipping addresses
src/dal/addresses.dal.ts                            — Address queries
src/hooks/use-cart.ts                               — Hybrid cart hook (localStorage + DB)
src/components/shop/product-card.tsx                — Product card for catalog grid
src/components/shop/product-grid.tsx                — Responsive grid wrapper
src/components/shop/product-detail.tsx              — Full product detail view
src/components/shop/product-image-gallery.tsx       — Image gallery with thumbnails
src/components/shop/product-filters.tsx             — Category/search/sort filters
src/components/shop/product-form.tsx                — Admin form create/edit product
src/components/shop/product-category-form.tsx       — Admin form for product categories
src/components/cart/cart-provider.tsx                — Cart context provider
src/components/cart/cart-sheet.tsx                   — Slide-over cart panel
src/components/cart/cart-item-row.tsx                — Single cart item row
src/components/cart/cart-icon.tsx                    — Navbar cart icon with badge
src/components/cart/cart-summary.tsx                 — Totals summary
src/components/orders/order-list.tsx                 — Reusable order list (admin + user)
src/components/orders/order-detail.tsx               — Order detail view
src/components/orders/order-status-badge.tsx          — Status badge with color
src/components/orders/order-status-select.tsx         — Admin status changer
src/components/checkout/checkout-form.tsx             — Checkout page form
src/components/checkout/address-form.tsx              — Reusable address form
src/components/checkout/order-summary.tsx             — Pre-purchase summary
src/components/checkout/simulated-payment.tsx         — Simulated pay button
src/app/(public)/tienda/page.tsx                    — Public catalog page
src/app/(public)/tienda/[slug]/page.tsx             — Product detail page
src/app/admin/tienda/page.tsx                       — Admin product list
src/app/admin/tienda/nuevo/page.tsx                 — Admin create product
src/app/admin/tienda/[id]/editar/page.tsx           — Admin edit product
src/app/admin/tienda/categorias/page.tsx            — Admin product categories
src/app/admin/pedidos/page.tsx                      — Admin orders list
src/app/admin/pedidos/[id]/page.tsx                 — Admin order detail
src/app/dashboard/mis-pedidos/page.tsx              — User order history
src/app/dashboard/mis-pedidos/[id]/page.tsx         — User order detail
src/app/(checkout)/checkout/page.tsx                — Checkout page
src/app/(checkout)/checkout/layout.tsx              — Checkout layout (auth guard)
src/app/(checkout)/checkout/confirmacion/page.tsx   — Order confirmation
supabase/migrations/20260320_shop_tables.sql        — SQL migration (reference, run manually in Supabase dashboard)
```

### Existing files to modify

```
src/types/entities/index.ts                         — Re-export shop entities
src/config/site.ts                                  — Add currency config
src/components/layout/navbar.tsx                    — Add "Tienda" link + cart icon
src/app/admin/page.tsx                              — Add shop stats + quick actions
src/app/layout.tsx                                  — Wrap with CartProvider
```

---

## Task 1: Database Schema (SQL Migration)

**Files:**

- Create: `supabase/migrations/20260320_shop_tables.sql`

This SQL is a **reference file**. Run it in the Supabase SQL Editor (Dashboard → SQL Editor → New query → paste → Run). Then regenerate types with `npm run db:types`.

- [ ] **Step 1: Create the migration SQL file**

```sql
-- ============================================================
-- SHOP MODULE — Tables, RLS, RPC functions
-- Run in Supabase SQL Editor
-- ============================================================

-- 1. Product Categories
CREATE TABLE product_categories (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT UNIQUE NOT NULL,
  slug TEXT UNIQUE NOT NULL,
  color TEXT NOT NULL DEFAULT '#6366f1',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE product_categories ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Public read product_categories" ON product_categories FOR SELECT USING (true);
CREATE POLICY "Admin all product_categories" ON product_categories FOR ALL USING (
  EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
);

-- 2. Products
CREATE TABLE products (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  slug TEXT UNIQUE NOT NULL,
  description TEXT NOT NULL DEFAULT '',
  price NUMERIC(10,2) NOT NULL,
  stock INTEGER NOT NULL DEFAULT 0,
  brand TEXT,
  weight NUMERIC(8,2),
  dimensions TEXT,
  category_id UUID REFERENCES product_categories(id) ON DELETE SET NULL,
  published BOOLEAN NOT NULL DEFAULT false,
  deleted_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE products ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Public read published products" ON products FOR SELECT USING (published = true AND deleted_at IS NULL);
CREATE POLICY "Admin all products" ON products FOR ALL USING (
  EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
);

-- 3. Product Images
CREATE TABLE product_images (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id UUID NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  url TEXT NOT NULL,
  order_index INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE product_images ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Public read product_images" ON product_images FOR SELECT USING (
  EXISTS (SELECT 1 FROM products WHERE id = product_images.product_id AND published = true AND deleted_at IS NULL)
);
CREATE POLICY "Admin all product_images" ON product_images FOR ALL USING (
  EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
);

-- 4. Carts
CREATE TABLE carts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID UNIQUE NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE carts ENABLE ROW LEVEL SECURITY;
CREATE POLICY "User own cart" ON carts FOR ALL USING (user_id = auth.uid());

-- 5. Cart Items
CREATE TABLE cart_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  cart_id UUID NOT NULL REFERENCES carts(id) ON DELETE CASCADE,
  product_id UUID NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  quantity INTEGER NOT NULL DEFAULT 1 CHECK (quantity >= 1),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(cart_id, product_id)
);

ALTER TABLE cart_items ENABLE ROW LEVEL SECURITY;
CREATE POLICY "User own cart_items" ON cart_items FOR ALL USING (
  EXISTS (SELECT 1 FROM carts WHERE id = cart_items.cart_id AND user_id = auth.uid())
);

-- 6. Shipping Addresses
CREATE TABLE shipping_addresses (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  full_name TEXT NOT NULL,
  phone TEXT NOT NULL,
  address_line TEXT NOT NULL,
  city TEXT NOT NULL,
  state TEXT NOT NULL,
  postal_code TEXT NOT NULL,
  country TEXT NOT NULL DEFAULT 'México',
  notes TEXT,
  is_default BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE shipping_addresses ENABLE ROW LEVEL SECURITY;
CREATE POLICY "User own addresses" ON shipping_addresses FOR ALL USING (user_id = auth.uid());

-- 7. Orders
CREATE TABLE orders (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  order_number SERIAL UNIQUE,
  user_id UUID NOT NULL REFERENCES profiles(id),
  status TEXT NOT NULL DEFAULT 'confirmed' CHECK (status IN ('pending','confirmed','shipped','delivered','cancelled')),
  total NUMERIC(10,2) NOT NULL,
  shipping_address_id UUID NOT NULL REFERENCES shipping_addresses(id) ON DELETE RESTRICT,
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE orders ENABLE ROW LEVEL SECURITY;
CREATE POLICY "User read own orders" ON orders FOR SELECT USING (user_id = auth.uid());
CREATE POLICY "Admin all orders" ON orders FOR ALL USING (
  EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
);
-- Allow users to update their own orders (for cancellation)
CREATE POLICY "User update own orders" ON orders FOR UPDATE USING (user_id = auth.uid());

-- 8. Order Items
CREATE TABLE order_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id UUID NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
  product_id UUID REFERENCES products(id) ON DELETE SET NULL,
  product_name TEXT NOT NULL,
  quantity INTEGER NOT NULL,
  unit_price NUMERIC(10,2) NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE order_items ENABLE ROW LEVEL SECURITY;
CREATE POLICY "User read own order_items" ON order_items FOR SELECT USING (
  EXISTS (SELECT 1 FROM orders WHERE id = order_items.order_id AND user_id = auth.uid())
);
CREATE POLICY "Admin all order_items" ON order_items FOR ALL USING (
  EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
);

-- ============================================================
-- RPC: create_order — atomic checkout
-- ============================================================
CREATE OR REPLACE FUNCTION create_order(
  p_user_id UUID,
  p_shipping_address_id UUID,
  p_notes TEXT DEFAULT NULL
)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_cart_id UUID;
  v_order_id UUID;
  v_total NUMERIC(10,2) := 0;
  v_item RECORD;
BEGIN
  -- Get user's cart
  SELECT id INTO v_cart_id FROM carts WHERE user_id = p_user_id;
  IF v_cart_id IS NULL THEN
    RAISE EXCEPTION 'No tienes un carrito activo.';
  END IF;

  -- Lock cart items + products for update (prevent race conditions)
  FOR v_item IN
    SELECT ci.product_id, ci.quantity, p.name, p.price, p.stock, p.published, p.deleted_at
    FROM cart_items ci
    JOIN products p ON p.id = ci.product_id
    WHERE ci.cart_id = v_cart_id
    ORDER BY ci.created_at
    FOR UPDATE OF p
  LOOP
    -- Validate product is available
    IF v_item.published = false OR v_item.deleted_at IS NOT NULL THEN
      RAISE EXCEPTION 'El producto "%" ya no está disponible.', v_item.name;
    END IF;
    -- Validate stock
    IF v_item.stock < v_item.quantity THEN
      RAISE EXCEPTION 'Stock insuficiente para "%". Disponible: %, solicitado: %.',
        v_item.name, v_item.stock, v_item.quantity;
    END IF;
    v_total := v_total + (v_item.price * v_item.quantity);
  END LOOP;

  -- Check cart is not empty
  IF v_total = 0 THEN
    RAISE EXCEPTION 'Tu carrito está vacío.';
  END IF;

  -- Create order
  INSERT INTO orders (user_id, status, total, shipping_address_id, notes)
  VALUES (p_user_id, 'confirmed', v_total, p_shipping_address_id, p_notes)
  RETURNING id INTO v_order_id;

  -- Create order items + decrement stock
  INSERT INTO order_items (order_id, product_id, product_name, quantity, unit_price)
  SELECT v_order_id, ci.product_id, p.name, ci.quantity, p.price
  FROM cart_items ci
  JOIN products p ON p.id = ci.product_id
  WHERE ci.cart_id = v_cart_id;

  UPDATE products SET
    stock = stock - ci.quantity,
    updated_at = now()
  FROM cart_items ci
  WHERE products.id = ci.product_id AND ci.cart_id = v_cart_id;

  -- Clear cart
  DELETE FROM cart_items WHERE cart_id = v_cart_id;

  RETURN v_order_id;
END;
$$;

-- ============================================================
-- RPC: cancel_order — atomic cancellation with stock restore
-- ============================================================
CREATE OR REPLACE FUNCTION cancel_order(
  p_order_id UUID,
  p_user_id UUID
)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_order RECORD;
  v_item RECORD;
BEGIN
  -- Lock the order
  SELECT id, status, user_id INTO v_order
  FROM orders WHERE id = p_order_id FOR UPDATE;

  IF v_order IS NULL THEN
    RAISE EXCEPTION 'Pedido no encontrado.';
  END IF;

  -- Check user is the owner or admin
  IF v_order.user_id != p_user_id THEN
    -- Check if admin
    IF NOT EXISTS (SELECT 1 FROM profiles WHERE id = p_user_id AND role = 'admin') THEN
      RAISE EXCEPTION 'No autorizado.';
    END IF;
  END IF;

  -- Users can only cancel 'confirmed' orders; admins can cancel confirmed/shipped
  IF v_order.user_id = p_user_id AND v_order.status != 'confirmed' THEN
    RAISE EXCEPTION 'Solo puedes cancelar pedidos en estado "confirmado".';
  END IF;

  IF v_order.status IN ('delivered', 'cancelled') THEN
    RAISE EXCEPTION 'No se puede cancelar un pedido en estado "%".', v_order.status;
  END IF;

  -- Restore stock for items that still have a product_id
  FOR v_item IN
    SELECT product_id, quantity FROM order_items
    WHERE order_id = p_order_id AND product_id IS NOT NULL
  LOOP
    UPDATE products SET stock = stock + v_item.quantity, updated_at = now()
    WHERE id = v_item.product_id;
  END LOOP;

  -- Update order status
  UPDATE orders SET status = 'cancelled', updated_at = now() WHERE id = p_order_id;
END;
$$;

-- ============================================================
-- Storage bucket for product images
-- ============================================================
-- Run this in Supabase Dashboard → Storage → New bucket:
-- Name: product-images
-- Public: true
-- Allowed MIME types: image/webp, image/jpeg, image/png
```

- [ ] **Step 2: Run migration in Supabase SQL Editor**

1. Open Supabase Dashboard → SQL Editor → New query
2. Paste the full SQL content from `supabase/migrations/20260320_shop_tables.sql`
3. Click "Run"
4. Verify all tables appear in Table Editor

- [ ] **Step 3: Create storage bucket**

In Supabase Dashboard → Storage → New bucket:

- Name: `product-images`
- Public: checked
- Allowed MIME types: `image/webp, image/jpeg, image/png`
- File size limit: 5MB

Add a storage policy:

- Policy name: "Public read product-images"
- Allowed operation: SELECT
- Target roles: public (anon)
- Using expression: `true`

- Policy name: "Admin upload product-images"
- Allowed operation: INSERT
- Using expression: `EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')`

- Policy name: "Admin delete product-images"
- Allowed operation: DELETE
- Using expression: `EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')`

- [ ] **Step 4: Regenerate TypeScript types**

Run: `npm run db:types`

Expected: `src/types/database.types.ts` is updated with all new tables (`product_categories`, `products`, `product_images`, `carts`, `cart_items`, `shipping_addresses`, `orders`, `order_items`) and the two RPC functions.

- [ ] **Step 5: Commit**

```bash
git add supabase/migrations/20260320_shop_tables.sql src/types/database.types.ts
git commit -m "feat(shop): add database schema, RLS policies, RPC functions, and regenerate types"
```

---

## Task 2: Types, Currency Helper & Config

**Files:**

- Create: `src/types/entities/shop.ts`
- Create: `src/lib/utils/currency.ts`
- Modify: `src/types/entities/index.ts`
- Modify: `src/config/site.ts`
- Modify: `src/lib/utils/image.ts`

- [ ] **Step 1: Create shop entity types**

```typescript
// src/types/entities/shop.ts

export interface ProductCategory {
  id: string
  name: string
  slug: string
  color: string
  created_at: string
}

export type OrderStatus = 'pending' | 'confirmed' | 'shipped' | 'delivered' | 'cancelled'

export interface Product {
  id: string
  name: string
  slug: string
  description: string
  price: number
  stock: number
  brand: string | null
  weight: number | null
  dimensions: string | null
  category_id: string | null
  published: boolean
  deleted_at: string | null
  created_at: string
  updated_at: string
  // Relations (optional, depend on join)
  category?: Pick<ProductCategory, 'id' | 'name' | 'slug' | 'color'>
  images?: ProductImage[]
}

export interface ProductImage {
  id: string
  product_id: string
  url: string
  order_index: number
  created_at: string
}

export interface Cart {
  id: string
  user_id: string
  created_at: string
  updated_at: string
}

export interface CartItem {
  id: string
  cart_id: string
  product_id: string
  quantity: number
  created_at: string
  product?: Pick<
    Product,
    'id' | 'name' | 'slug' | 'price' | 'stock' | 'published' | 'deleted_at'
  > & {
    images?: Pick<ProductImage, 'url' | 'order_index'>[]
  }
}

export interface ShippingAddress {
  id: string
  user_id: string
  full_name: string
  phone: string
  address_line: string
  city: string
  state: string
  postal_code: string
  country: string
  notes: string | null
  is_default: boolean
  created_at: string
  updated_at: string
}

export interface Order {
  id: string
  order_number: number
  user_id: string
  status: OrderStatus
  total: number
  shipping_address_id: string
  notes: string | null
  created_at: string
  updated_at: string
  // Relations
  items?: OrderItem[]
  shipping_address?: ShippingAddress
  user?: { id: string; username: string; full_name: string | null }
}

export interface OrderItem {
  id: string
  order_id: string
  product_id: string | null
  product_name: string
  quantity: number
  unit_price: number
  created_at: string
}

/** Shape stored in localStorage for guest carts */
export interface LocalCartItem {
  productId: string
  quantity: number
}
```

- [ ] **Step 2: Re-export from entities/index.ts**

Add to the bottom of `src/types/entities/index.ts`:

```typescript
export type {
  ProductCategory,
  Product,
  ProductImage,
  Cart,
  CartItem,
  ShippingAddress,
  Order,
  OrderItem,
  OrderStatus,
  LocalCartItem,
} from './shop'
```

- [ ] **Step 3: Create currency helper**

```typescript
// src/lib/utils/currency.ts

const formatter = new Intl.NumberFormat('es-MX', {
  style: 'currency',
  currency: 'MXN',
  minimumFractionDigits: 2,
})

export function formatPrice(amount: number): string {
  return formatter.format(amount)
}
```

- [ ] **Step 4: Add currency to site config**

Add to `src/config/site.ts` inside the `siteConfig` object:

```typescript
currency: {
  code: 'MXN',
  locale: 'es-MX',
},
```

- [ ] **Step 5: Add processProductImage to image utils**

Add to `src/lib/utils/image.ts`:

```typescript
export async function processProductImage(buffer: Buffer): Promise<Buffer> {
  return sharp(buffer)
    .resize(800, 800, { fit: 'cover', withoutEnlargement: true })
    .webp({ quality: 85 })
    .toBuffer()
}
```

- [ ] **Step 6: Commit**

```bash
git add src/types/entities/shop.ts src/types/entities/index.ts src/lib/utils/currency.ts src/config/site.ts src/lib/utils/image.ts
git commit -m "feat(shop): add shop entity types, currency helper, image processor, and config"
```

---

## Task 3: Zod Validation Schemas

**Files:**

- Create: `src/lib/validations/shop.ts`

- [ ] **Step 1: Create all shop validation schemas**

```typescript
// src/lib/validations/shop.ts
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
```

- [ ] **Step 2: Commit**

```bash
git add src/lib/validations/shop.ts
git commit -m "feat(shop): add Zod validation schemas for all shop entities"
```

---

## Task 4: Data Access Layer (DAL)

**Files:**

- Create: `src/dal/shop.dal.ts`
- Create: `src/dal/cart.dal.ts`
- Create: `src/dal/orders.dal.ts`

- [ ] **Step 1: Create shop DAL (products + product categories)**

```typescript
// src/dal/shop.dal.ts
import { createAdminClient } from '@/lib/supabase/admin'
import { createClient } from '@/lib/supabase/server'
import type { Product, ProductCategory } from '@/types/entities'

// ─── Product Categories ───────────────────────────────────────

export async function getAllProductCategories(): Promise<ProductCategory[]> {
  const supabase = createAdminClient()
  const { data, error } = await supabase
    .from('product_categories')
    .select('id, name, slug, color, created_at')
    .order('name')

  if (error) {
    console.error('[DAL] getAllProductCategories:', error.message)
    return []
  }
  return data ?? []
}

// ─── Products ─────────────────────────────────────────────────

const PRODUCT_SELECT = `
  id, name, slug, description, price, stock, brand, weight, dimensions,
  category_id, published, deleted_at, created_at, updated_at,
  category:product_categories(id, name, slug, color),
  images:product_images(id, url, order_index)
` as const

export interface GetProductsOptions {
  page?: number
  limit?: number
  categorySlug?: string | null
  search?: string | null
  sort?: 'price_asc' | 'price_desc' | 'newest' | 'name' | null
}

export interface ProductsResult {
  products: Product[]
  total: number
}

export async function getPublishedProducts({
  page = 1,
  limit = 12,
  categorySlug,
  search,
  sort,
}: GetProductsOptions = {}): Promise<ProductsResult> {
  const supabase = await createClient()

  let query = supabase
    .from('products')
    .select(PRODUCT_SELECT, { count: 'exact' })
    .eq('published', true)
    .is('deleted_at', null)

  if (categorySlug) {
    const { data: cat } = await supabase
      .from('product_categories')
      .select('id')
      .eq('slug', categorySlug)
      .single()
    if (cat) query = query.eq('category_id', cat.id)
  }

  if (search) {
    query = query.ilike('name', `%${search}%`)
  }

  switch (sort) {
    case 'price_asc':
      query = query.order('price', { ascending: true })
      break
    case 'price_desc':
      query = query.order('price', { ascending: false })
      break
    case 'name':
      query = query.order('name', { ascending: true })
      break
    case 'newest':
    default:
      query = query.order('created_at', { ascending: false })
  }

  const from = (page - 1) * limit
  const to = from + limit - 1
  query = query.range(from, to)

  const { data, error, count } = await query

  if (error) {
    console.error('[DAL] getPublishedProducts:', error.message)
    return { products: [], total: 0 }
  }

  return {
    products: (data ?? []) as unknown as Product[],
    total: count ?? 0,
  }
}

export async function getProductBySlug(slug: string): Promise<Product | null> {
  const supabase = await createClient()
  const { data, error } = await supabase
    .from('products')
    .select(PRODUCT_SELECT)
    .eq('slug', slug)
    .eq('published', true)
    .is('deleted_at', null)
    .single()

  if (error) return null
  return data as unknown as Product
}

/** Admin: get product by ID (includes unpublished) */
export async function getProductById(id: string): Promise<Product | null> {
  const supabase = createAdminClient()
  const { data, error } = await supabase
    .from('products')
    .select(PRODUCT_SELECT)
    .eq('id', id)
    .is('deleted_at', null)
    .single()

  if (error) return null
  return data as unknown as Product
}

/** Admin: get all products for admin table */
export async function getAdminProducts({
  page = 1,
  limit = 20,
}: { page?: number; limit?: number } = {}): Promise<ProductsResult> {
  const supabase = createAdminClient()
  const from = (page - 1) * limit
  const to = from + limit - 1

  const { data, error, count } = await supabase
    .from('products')
    .select(PRODUCT_SELECT, { count: 'exact' })
    .is('deleted_at', null)
    .order('created_at', { ascending: false })
    .range(from, to)

  if (error) {
    console.error('[DAL] getAdminProducts:', error.message)
    return { products: [], total: 0 }
  }

  return {
    products: (data ?? []) as unknown as Product[],
    total: count ?? 0,
  }
}
```

- [ ] **Step 2: Create cart DAL**

```typescript
// src/dal/cart.dal.ts
import { createClient } from '@/lib/supabase/server'
import type { CartItem } from '@/types/entities'

const CART_ITEM_SELECT = `
  id, cart_id, product_id, quantity, created_at,
  product:products(id, name, slug, price, stock, published, deleted_at,
    images:product_images(url, order_index)
  )
` as const

export async function getCartItems(userId: string): Promise<CartItem[]> {
  const supabase = await createClient()

  // Get or create cart
  let { data: cart } = await supabase.from('carts').select('id').eq('user_id', userId).single()

  if (!cart) return []

  const { data, error } = await supabase
    .from('cart_items')
    .select(CART_ITEM_SELECT)
    .eq('cart_id', cart.id)
    .order('created_at', { ascending: true })

  if (error) {
    console.error('[DAL] getCartItems:', error.message)
    return []
  }

  return (data ?? []) as unknown as CartItem[]
}
```

- [ ] **Step 3: Create orders DAL**

```typescript
// src/dal/orders.dal.ts
import { createAdminClient } from '@/lib/supabase/admin'
import { createClient } from '@/lib/supabase/server'
import type { Order, OrderStatus } from '@/types/entities'

const ORDER_SELECT = `
  id, order_number, user_id, status, total, shipping_address_id, notes,
  created_at, updated_at,
  items:order_items(id, product_id, product_name, quantity, unit_price),
  shipping_address:shipping_addresses(id, full_name, phone, address_line, city, state, postal_code, country, notes)
` as const

/** User: get own orders */
export async function getMyOrders({
  userId,
  page = 1,
  limit = 10,
}: {
  userId: string
  page?: number
  limit?: number
}): Promise<{ orders: Order[]; total: number }> {
  const supabase = await createClient()
  const from = (page - 1) * limit
  const to = from + limit - 1

  const { data, error, count } = await supabase
    .from('orders')
    .select(ORDER_SELECT, { count: 'exact' })
    .eq('user_id', userId)
    .order('created_at', { ascending: false })
    .range(from, to)

  if (error) {
    console.error('[DAL] getMyOrders:', error.message)
    return { orders: [], total: 0 }
  }

  return { orders: (data ?? []) as unknown as Order[], total: count ?? 0 }
}

/** User: get single order */
export async function getOrderById(orderId: string): Promise<Order | null> {
  const supabase = await createClient()
  const { data, error } = await supabase
    .from('orders')
    .select(ORDER_SELECT)
    .eq('id', orderId)
    .single()

  if (error) return null
  return data as unknown as Order
}

/** Admin: get all orders with filters */
export async function getAdminOrders({
  page = 1,
  limit = 20,
  status,
  search,
}: {
  page?: number
  limit?: number
  status?: OrderStatus | null
  search?: string | null
} = {}): Promise<{ orders: Order[]; total: number }> {
  const supabase = createAdminClient()
  const from = (page - 1) * limit
  const to = from + limit - 1

  let query = supabase
    .from('orders')
    .select(`${ORDER_SELECT}, user:profiles!user_id(id, username, full_name)`, { count: 'exact' })
    .order('created_at', { ascending: false })
    .range(from, to)

  if (status) query = query.eq('status', status)
  if (search) {
    // Search by order number
    const num = parseInt(search, 10)
    if (!isNaN(num)) {
      query = query.eq('order_number', num)
    }
  }

  const { data, error, count } = await query

  if (error) {
    console.error('[DAL] getAdminOrders:', error.message)
    return { orders: [], total: 0 }
  }

  return { orders: (data ?? []) as unknown as Order[], total: count ?? 0 }
}

/** Admin: get single order with user info */
export async function getAdminOrderById(orderId: string): Promise<Order | null> {
  const supabase = createAdminClient()
  const { data, error } = await supabase
    .from('orders')
    .select(`${ORDER_SELECT}, user:profiles!user_id(id, username, full_name)`)
    .eq('id', orderId)
    .single()

  if (error) return null
  return data as unknown as Order
}
```

- [ ] **Step 4: Commit**

```bash
git add src/dal/shop.dal.ts src/dal/cart.dal.ts src/dal/orders.dal.ts
git commit -m "feat(shop): add data access layer for products, cart, and orders"
```

---

## Task 5: Server Actions — Admin Products & Categories

**Files:**

- Create: `src/actions/shop.actions.ts`

- [ ] **Step 1: Create shop admin actions**

```typescript
// src/actions/shop.actions.ts
'use server'

import { revalidatePath } from 'next/cache'
import { createClient } from '@/lib/supabase/server'
import { productSchema, productCategorySchema } from '@/lib/validations/shop'
import { validateMimeFromBuffer, processProductImage } from '@/lib/utils/image'
import type { ActionResult } from '@/types/api'

async function assertAdmin(): Promise<string | null> {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return null

  const { data: profile } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .single()

  return profile?.role === 'admin' ? user.id : null
}

function slugify(text: string): string {
  return text
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9\s-]/g, '')
    .trim()
    .replace(/\s+/g, '-')
    .slice(0, 60)
}

// ─── Product Categories ───────────────────────────────────────

export async function createProductCategoryAction(
  _prev: null,
  formData: FormData
): Promise<ActionResult<{ id: string }>> {
  const adminId = await assertAdmin()
  if (!adminId) return { success: false, error: 'No autorizado.' }

  const supabase = await createClient()
  const parsed = productCategorySchema.safeParse({
    name: formData.get('name'),
    slug: formData.get('slug'),
    color: formData.get('color'),
  })

  if (!parsed.success) {
    return { success: false, error: parsed.error.issues[0]?.message ?? 'Datos inválidos.' }
  }

  const { data, error } = await supabase
    .from('product_categories')
    .insert(parsed.data)
    .select('id')
    .single()

  if (error) {
    if (error.code === '23505')
      return { success: false, error: 'Ya existe una categoría con ese nombre o slug.' }
    return { success: false, error: 'Error al crear la categoría.' }
  }

  revalidatePath('/admin/tienda/categorias')
  revalidatePath('/tienda')
  return { success: true, data: { id: data.id } }
}

export async function deleteProductCategoryAction(categoryId: string): Promise<ActionResult> {
  const adminId = await assertAdmin()
  if (!adminId) return { success: false, error: 'No autorizado.' }

  const supabase = await createClient()
  const { error } = await supabase.from('product_categories').delete().eq('id', categoryId)

  if (error) return { success: false, error: 'Error al eliminar la categoría.' }

  revalidatePath('/admin/tienda/categorias')
  revalidatePath('/tienda')
  return { success: true, data: undefined }
}

// ─── Products ─────────────────────────────────────────────────

export async function createProductAction(
  _prev: null,
  formData: FormData
): Promise<ActionResult<{ id: string }>> {
  const adminId = await assertAdmin()
  if (!adminId) return { success: false, error: 'No autorizado.' }

  const supabase = await createClient()

  const raw = {
    name: formData.get('name'),
    description: formData.get('description'),
    price: formData.get('price'),
    stock: formData.get('stock'),
    brand: formData.get('brand') || null,
    weight: formData.get('weight') || null,
    dimensions: formData.get('dimensions') || null,
    category_id: formData.get('category_id') || null,
    published: formData.get('published') === 'true',
  }

  const parsed = productSchema.safeParse(raw)
  if (!parsed.success) {
    const errors: Record<string, string[]> = {}
    parsed.error.issues.forEach((issue) => {
      const key = issue.path.join('.')
      errors[key] = [...(errors[key] ?? []), issue.message]
    })
    return { success: false, error: 'Revisa los campos del formulario.', errors }
  }

  // Generate unique slug
  const baseSlug = slugify(parsed.data.name)
  const { data: existing } = await supabase
    .from('products')
    .select('slug')
    .like('slug', `${baseSlug}%`)
  const existingSlugs = new Set((existing ?? []).map((r) => r.slug))
  let slug = baseSlug
  if (existingSlugs.has(slug)) {
    let counter = 2
    while (existingSlugs.has(`${slug}-${counter}`)) counter++
    slug = `${baseSlug}-${counter}`
  }

  const { data: product, error } = await supabase
    .from('products')
    .insert({ ...parsed.data, slug })
    .select('id')
    .single()

  if (error) {
    return { success: false, error: 'Error al crear el producto.' }
  }

  // Upload images
  const imageFiles = formData.getAll('images') as File[]
  for (let i = 0; i < imageFiles.length; i++) {
    const file = imageFiles[i]
    if (!file || file.size === 0) continue

    const buffer = Buffer.from(await file.arrayBuffer())
    const isSafe = await validateMimeFromBuffer(buffer)
    if (!isSafe) continue

    const processed = await processProductImage(buffer)
    const fileName = `${product.id}/${Date.now()}-${i}.webp`

    const { error: uploadError } = await supabase.storage
      .from('product-images')
      .upload(fileName, processed, { contentType: 'image/webp', upsert: false })

    if (!uploadError) {
      const { data: urlData } = supabase.storage.from('product-images').getPublicUrl(fileName)
      await supabase.from('product_images').insert({
        product_id: product.id,
        url: urlData.publicUrl,
        order_index: i,
      })
    }
  }

  revalidatePath('/admin/tienda')
  revalidatePath('/tienda')
  return { success: true, data: { id: product.id } }
}

export async function updateProductAction(
  _prev: null,
  formData: FormData
): Promise<ActionResult<{ id: string }>> {
  const adminId = await assertAdmin()
  if (!adminId) return { success: false, error: 'No autorizado.' }

  const supabase = await createClient()
  const productId = formData.get('id') as string
  if (!productId) return { success: false, error: 'ID de producto faltante.' }

  const raw = {
    name: formData.get('name'),
    description: formData.get('description'),
    price: formData.get('price'),
    stock: formData.get('stock'),
    brand: formData.get('brand') || null,
    weight: formData.get('weight') || null,
    dimensions: formData.get('dimensions') || null,
    category_id: formData.get('category_id') || null,
    published: formData.get('published') === 'true',
  }

  const parsed = productSchema.safeParse(raw)
  if (!parsed.success) {
    const errors: Record<string, string[]> = {}
    parsed.error.issues.forEach((issue) => {
      const key = issue.path.join('.')
      errors[key] = [...(errors[key] ?? []), issue.message]
    })
    return { success: false, error: 'Revisa los campos del formulario.', errors }
  }

  const { error } = await supabase
    .from('products')
    .update({ ...parsed.data, updated_at: new Date().toISOString() })
    .eq('id', productId)

  if (error) return { success: false, error: 'Error al actualizar el producto.' }

  // Handle new images
  const imageFiles = formData.getAll('new_images') as File[]
  // Get current max order_index
  const { data: existingImages } = await supabase
    .from('product_images')
    .select('order_index')
    .eq('product_id', productId)
    .order('order_index', { ascending: false })
    .limit(1)
  let nextIndex = (existingImages?.[0]?.order_index ?? -1) + 1

  for (let i = 0; i < imageFiles.length; i++) {
    const file = imageFiles[i]
    if (!file || file.size === 0) continue

    const buffer = Buffer.from(await file.arrayBuffer())
    const isSafe = await validateMimeFromBuffer(buffer)
    if (!isSafe) continue

    const processed = await processProductImage(buffer)
    const fileName = `${productId}/${Date.now()}-${i}.webp`

    const { error: uploadError } = await supabase.storage
      .from('product-images')
      .upload(fileName, processed, { contentType: 'image/webp', upsert: false })

    if (!uploadError) {
      const { data: urlData } = supabase.storage.from('product-images').getPublicUrl(fileName)
      await supabase.from('product_images').insert({
        product_id: productId,
        url: urlData.publicUrl,
        order_index: nextIndex++,
      })
    }
  }

  // Handle deleted images
  const deletedImageIds = formData.get('deleted_image_ids') as string
  if (deletedImageIds) {
    const ids = JSON.parse(deletedImageIds) as string[]
    if (ids.length > 0) {
      await supabase.from('product_images').delete().in('id', ids)
    }
  }

  revalidatePath('/admin/tienda')
  revalidatePath('/tienda')
  return { success: true, data: { id: productId } }
}

export async function deleteProductAction(productId: string): Promise<ActionResult> {
  const adminId = await assertAdmin()
  if (!adminId) return { success: false, error: 'No autorizado.' }

  const supabase = await createClient()
  // Soft delete
  const { error } = await supabase
    .from('products')
    .update({ deleted_at: new Date().toISOString(), published: false })
    .eq('id', productId)

  if (error) return { success: false, error: 'Error al eliminar el producto.' }

  revalidatePath('/admin/tienda')
  revalidatePath('/tienda')
  return { success: true, data: undefined }
}
```

- [ ] **Step 2: Commit**

```bash
git add src/actions/shop.actions.ts
git commit -m "feat(shop): add server actions for admin product and category management"
```

---

## Task 6: Server Actions — Cart, Orders & Addresses

**Files:**

- Create: `src/actions/cart.actions.ts`
- Create: `src/actions/order.actions.ts`
- Create: `src/actions/address.actions.ts`

- [ ] **Step 1: Create cart actions**

```typescript
// src/actions/cart.actions.ts
'use server'

import { revalidatePath } from 'next/cache'
import { createClient } from '@/lib/supabase/server'
import { addToCartSchema } from '@/lib/validations/shop'
import type { ActionResult } from '@/types/api'
import type { LocalCartItem } from '@/types/entities'

async function getOrCreateCart(supabase: Awaited<ReturnType<typeof createClient>>, userId: string) {
  let { data: cart } = await supabase.from('carts').select('id').eq('user_id', userId).single()

  if (!cart) {
    const { data: newCart, error } = await supabase
      .from('carts')
      .insert({ user_id: userId })
      .select('id')
      .single()
    if (error) throw new Error('Error al crear carrito')
    cart = newCart
  }

  return cart!
}

export async function addToCartAction(_prev: null, formData: FormData): Promise<ActionResult> {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return { success: false, error: 'Debes iniciar sesión.' }

  const parsed = addToCartSchema.safeParse({
    productId: formData.get('productId'),
    quantity: formData.get('quantity'),
  })
  if (!parsed.success) {
    return { success: false, error: parsed.error.issues[0]?.message ?? 'Datos inválidos.' }
  }

  const { productId, quantity } = parsed.data

  // Validate stock
  const { data: product } = await supabase
    .from('products')
    .select('stock, published, deleted_at')
    .eq('id', productId)
    .single()

  if (!product || !product.published || product.deleted_at) {
    return { success: false, error: 'Producto no disponible.' }
  }

  const cart = await getOrCreateCart(supabase, user.id)

  // Check if item already in cart
  const { data: existing } = await supabase
    .from('cart_items')
    .select('id, quantity')
    .eq('cart_id', cart.id)
    .eq('product_id', productId)
    .single()

  const newQty = (existing?.quantity ?? 0) + quantity
  if (newQty > product.stock) {
    return { success: false, error: `Stock insuficiente. Disponible: ${product.stock}` }
  }

  if (existing) {
    await supabase.from('cart_items').update({ quantity: newQty }).eq('id', existing.id)
  } else {
    await supabase.from('cart_items').insert({
      cart_id: cart.id,
      product_id: productId,
      quantity,
    })
  }

  revalidatePath('/tienda')
  return { success: true, data: undefined }
}

export async function updateCartItemAction(
  productId: string,
  quantity: number
): Promise<ActionResult> {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return { success: false, error: 'Debes iniciar sesión.' }

  if (quantity < 1) return { success: false, error: 'Cantidad mínima es 1.' }

  const { data: product } = await supabase
    .from('products')
    .select('stock')
    .eq('id', productId)
    .single()

  if (product && quantity > product.stock) {
    return { success: false, error: `Stock insuficiente. Disponible: ${product.stock}` }
  }

  const { data: cart } = await supabase.from('carts').select('id').eq('user_id', user.id).single()
  if (!cart) return { success: false, error: 'Carrito no encontrado.' }

  await supabase
    .from('cart_items')
    .update({ quantity })
    .eq('cart_id', cart.id)
    .eq('product_id', productId)

  revalidatePath('/tienda')
  return { success: true, data: undefined }
}

export async function removeCartItemAction(productId: string): Promise<ActionResult> {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return { success: false, error: 'Debes iniciar sesión.' }

  const { data: cart } = await supabase.from('carts').select('id').eq('user_id', user.id).single()
  if (!cart) return { success: false, error: 'Carrito no encontrado.' }

  await supabase.from('cart_items').delete().eq('cart_id', cart.id).eq('product_id', productId)

  revalidatePath('/tienda')
  return { success: true, data: undefined }
}

export async function syncCartAction(localItems: LocalCartItem[]): Promise<ActionResult> {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return { success: false, error: 'Debes iniciar sesión.' }

  if (!localItems.length) return { success: true, data: undefined }

  const cart = await getOrCreateCart(supabase, user.id)

  // Get existing cart items
  const { data: dbItems } = await supabase
    .from('cart_items')
    .select('product_id, quantity')
    .eq('cart_id', cart.id)

  const dbMap = new Map((dbItems ?? []).map((i) => [i.product_id, i.quantity]))

  for (const local of localItems) {
    const dbQty = dbMap.get(local.productId) ?? 0
    const mergedQty = dbQty + local.quantity // additive merge

    if (dbQty > 0) {
      await supabase
        .from('cart_items')
        .update({ quantity: mergedQty })
        .eq('cart_id', cart.id)
        .eq('product_id', local.productId)
    } else {
      await supabase.from('cart_items').insert({
        cart_id: cart.id,
        product_id: local.productId,
        quantity: local.quantity,
      })
    }
  }

  revalidatePath('/tienda')
  return { success: true, data: undefined }
}
```

- [ ] **Step 2: Create order actions**

```typescript
// src/actions/order.actions.ts
'use server'

import { revalidatePath } from 'next/cache'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { checkoutSchema } from '@/lib/validations/shop'
import type { ActionResult } from '@/types/api'
import type { OrderStatus } from '@/types/entities'

export async function createOrderAction(
  _prev: null,
  formData: FormData
): Promise<ActionResult<{ orderId: string }>> {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return { success: false, error: 'Debes iniciar sesión.' }

  const parsed = checkoutSchema.safeParse({
    shipping_address_id: formData.get('shipping_address_id'),
    notes: formData.get('notes') || null,
  })

  if (!parsed.success) {
    return { success: false, error: parsed.error.issues[0]?.message ?? 'Datos inválidos.' }
  }

  // Call the atomic RPC function
  const adminClient = createAdminClient()
  const { data, error } = await adminClient.rpc('create_order', {
    p_user_id: user.id,
    p_shipping_address_id: parsed.data.shipping_address_id,
    p_notes: parsed.data.notes ?? null,
  })

  if (error) {
    // Extract PL/pgSQL error message
    const msg = error.message || 'Error al crear el pedido.'
    return { success: false, error: msg }
  }

  revalidatePath('/dashboard/mis-pedidos')
  revalidatePath('/tienda')
  return { success: true, data: { orderId: data as string } }
}

export async function cancelOrderAction(orderId: string): Promise<ActionResult> {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return { success: false, error: 'Debes iniciar sesión.' }

  const adminClient = createAdminClient()
  const { error } = await adminClient.rpc('cancel_order', {
    p_order_id: orderId,
    p_user_id: user.id,
  })

  if (error) {
    return { success: false, error: error.message || 'Error al cancelar el pedido.' }
  }

  revalidatePath('/dashboard/mis-pedidos')
  revalidatePath('/admin/pedidos')
  revalidatePath('/tienda')
  return { success: true, data: undefined }
}

/** Admin: update order status (advance only) */
export async function updateOrderStatusAction(
  orderId: string,
  newStatus: OrderStatus
): Promise<ActionResult> {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return { success: false, error: 'No autorizado.' }

  // Verify admin
  const { data: profile } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .single()
  if (profile?.role !== 'admin') return { success: false, error: 'No autorizado.' }

  // If cancelling, use the RPC
  if (newStatus === 'cancelled') {
    return cancelOrderAction(orderId)
  }

  // Validate state transition
  const validTransitions: Record<string, string[]> = {
    confirmed: ['shipped'],
    shipped: ['delivered'],
  }

  const adminClient = createAdminClient()
  const { data: order } = await adminClient
    .from('orders')
    .select('status')
    .eq('id', orderId)
    .single()

  if (!order) return { success: false, error: 'Pedido no encontrado.' }

  const allowed = validTransitions[order.status] ?? []
  if (!allowed.includes(newStatus)) {
    return { success: false, error: `No se puede cambiar de "${order.status}" a "${newStatus}".` }
  }

  const { error } = await adminClient
    .from('orders')
    .update({ status: newStatus, updated_at: new Date().toISOString() })
    .eq('id', orderId)

  if (error) return { success: false, error: 'Error al actualizar el estado.' }

  revalidatePath('/admin/pedidos')
  revalidatePath(`/admin/pedidos/${orderId}`)
  return { success: true, data: undefined }
}
```

- [ ] **Step 3: Create address actions**

```typescript
// src/actions/address.actions.ts
'use server'

import { revalidatePath } from 'next/cache'
import { createClient } from '@/lib/supabase/server'
import { shippingAddressSchema } from '@/lib/validations/shop'
import type { ActionResult } from '@/types/api'

export async function createAddressAction(
  _prev: null,
  formData: FormData
): Promise<ActionResult<{ id: string }>> {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return { success: false, error: 'Debes iniciar sesión.' }

  const raw = {
    full_name: formData.get('full_name'),
    phone: formData.get('phone'),
    address_line: formData.get('address_line'),
    city: formData.get('city'),
    state: formData.get('state'),
    postal_code: formData.get('postal_code'),
    country: formData.get('country') || 'México',
    notes: formData.get('notes') || null,
    is_default: formData.get('is_default') === 'true',
  }

  const parsed = shippingAddressSchema.safeParse(raw)
  if (!parsed.success) {
    const errors: Record<string, string[]> = {}
    parsed.error.issues.forEach((issue) => {
      const key = issue.path.join('.')
      errors[key] = [...(errors[key] ?? []), issue.message]
    })
    return { success: false, error: 'Revisa los campos.', errors }
  }

  // If setting as default, unset others
  if (parsed.data.is_default) {
    await supabase.from('shipping_addresses').update({ is_default: false }).eq('user_id', user.id)
  }

  const { data, error } = await supabase
    .from('shipping_addresses')
    .insert({ ...parsed.data, user_id: user.id })
    .select('id')
    .single()

  if (error) return { success: false, error: 'Error al guardar la dirección.' }

  revalidatePath('/checkout')
  return { success: true, data: { id: data.id } }
}

export async function deleteAddressAction(addressId: string): Promise<ActionResult> {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return { success: false, error: 'Debes iniciar sesión.' }

  const { error } = await supabase
    .from('shipping_addresses')
    .delete()
    .eq('id', addressId)
    .eq('user_id', user.id)

  if (error) {
    if (error.code === '23503') {
      return { success: false, error: 'No se puede eliminar una dirección asociada a pedidos.' }
    }
    return { success: false, error: 'Error al eliminar la dirección.' }
  }

  revalidatePath('/checkout')
  return { success: true, data: undefined }
}

// Note: getUserAddresses() is in src/dal/addresses.dal.ts (see Task 6 Step 4)
```

- [ ] **Step 4: Create addresses DAL**

```typescript
// src/dal/addresses.dal.ts
import { createClient } from '@/lib/supabase/server'
import type { ShippingAddress } from '@/types/entities'

export async function getUserAddresses(userId: string): Promise<ShippingAddress[]> {
  const supabase = await createClient()
  const { data } = await supabase
    .from('shipping_addresses')
    .select('*')
    .eq('user_id', userId)
    .order('is_default', { ascending: false })
    .order('created_at', { ascending: false })

  return (data ?? []) as ShippingAddress[]
}
```

- [ ] **Step 5: Commit**

```bash
git add src/actions/cart.actions.ts src/actions/order.actions.ts src/actions/address.actions.ts src/dal/addresses.dal.ts
git commit -m "feat(shop): add server actions for cart, orders, addresses, and address DAL"
```

---

## Task 7: Cart Hook & Provider

**Files:**

- Create: `src/hooks/use-cart.ts`
- Create: `src/components/cart/cart-provider.tsx`
- Modify: `src/app/layout.tsx`

- [ ] **Step 1: Create the hybrid cart hook**

```typescript
// src/hooks/use-cart.ts
'use client'

import { useState, useEffect, useCallback, useRef } from 'react'
import { useSession } from '@/components/providers/session-provider'
import {
  addToCartAction,
  updateCartItemAction,
  removeCartItemAction,
  syncCartAction,
  getCartItemsAction,
} from '@/actions/cart.actions'
import type { CartItem, LocalCartItem } from '@/types/entities'

const CART_KEY = 'gym-shop-cart'

function getLocalCart(): LocalCartItem[] {
  if (typeof window === 'undefined') return []
  try {
    return JSON.parse(localStorage.getItem(CART_KEY) || '[]')
  } catch {
    return []
  }
}

function setLocalCart(items: LocalCartItem[]) {
  localStorage.setItem(CART_KEY, JSON.stringify(items))
}

function clearLocalCart() {
  localStorage.removeItem(CART_KEY)
}

export interface CartItemWithProduct {
  productId: string
  name: string
  slug: string
  price: number
  stock: number
  quantity: number
  imageUrl: string | null
  available: boolean
}

export interface UseCartReturn {
  items: CartItemWithProduct[]
  count: number
  total: number
  addItem: (
    productId: string,
    qty: number,
    productInfo?: {
      name: string
      slug: string
      price: number
      stock: number
      imageUrl: string | null
    }
  ) => Promise<void>
  updateQuantity: (productId: string, qty: number) => Promise<void>
  removeItem: (productId: string) => Promise<void>
  clearCart: () => void
  isLoading: boolean
  refresh: () => void
}

export function useCart(): UseCartReturn {
  const { user } = useSession()
  const [items, setItems] = useState<CartItemWithProduct[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [refreshKey, setRefreshKey] = useState(0)
  const hasSynced = useRef(false)

  const refresh = useCallback(() => setRefreshKey((k) => k + 1), [])

  // Load cart
  useEffect(() => {
    let cancelled = false

    async function load() {
      setIsLoading(true)

      if (user) {
        // Sync localStorage items on first load with session
        if (!hasSynced.current) {
          const local = getLocalCart()
          if (local.length > 0) {
            await syncCartAction(local)
            clearLocalCart()
          }
          hasSynced.current = true
        }

        // Fetch from server via server action
        const data = await getCartItemsAction()
        if (!cancelled) setItems(data)
      } else {
        // Read localStorage
        const local = getLocalCart()
        // We need product info — for localStorage, we store minimal info
        // Product info will be enriched when products are displayed
        const localItems: CartItemWithProduct[] = local.map((l) => ({
          productId: l.productId,
          name: '',
          slug: '',
          price: 0,
          stock: 999,
          quantity: l.quantity,
          imageUrl: null,
          available: true,
        }))
        if (!cancelled) setItems(localItems)
      }

      if (!cancelled) setIsLoading(false)
    }

    load()
    return () => {
      cancelled = true
    }
  }, [user, refreshKey])

  const addItem = useCallback(
    async (
      productId: string,
      qty: number,
      productInfo?: {
        name: string
        slug: string
        price: number
        stock: number
        imageUrl: string | null
      }
    ) => {
      if (user) {
        const fd = new FormData()
        fd.set('productId', productId)
        fd.set('quantity', String(qty))
        await addToCartAction(null, fd)
        refresh()
      } else {
        const local = getLocalCart()
        const existing = local.find((i) => i.productId === productId)
        if (existing) {
          existing.quantity += qty
        } else {
          local.push({ productId, quantity: qty })
        }
        setLocalCart(local)
        // Update local state
        if (productInfo) {
          setItems((prev) => {
            const idx = prev.findIndex((i) => i.productId === productId)
            if (idx >= 0) {
              const updated = [...prev]
              updated[idx] = { ...updated[idx], quantity: updated[idx].quantity + qty }
              return updated
            }
            return [...prev, { ...productInfo, productId, quantity: qty, available: true }]
          })
        }
      }
    },
    [user, refresh]
  )

  const updateQuantity = useCallback(
    async (productId: string, qty: number) => {
      if (user) {
        await updateCartItemAction(productId, qty)
        refresh()
      } else {
        const local = getLocalCart()
        const item = local.find((i) => i.productId === productId)
        if (item) {
          item.quantity = qty
          setLocalCart(local)
          setItems((prev) =>
            prev.map((i) => (i.productId === productId ? { ...i, quantity: qty } : i))
          )
        }
      }
    },
    [user, refresh]
  )

  const removeItem = useCallback(
    async (productId: string) => {
      if (user) {
        await removeCartItemAction(productId)
        refresh()
      } else {
        const local = getLocalCart().filter((i) => i.productId !== productId)
        setLocalCart(local)
        setItems((prev) => prev.filter((i) => i.productId !== productId))
      }
    },
    [user, refresh]
  )

  const clearCart = useCallback(() => {
    if (!user) {
      clearLocalCart()
      setItems([])
    }
  }, [user])

  const count = items.reduce((sum, i) => sum + i.quantity, 0)
  const total = items.reduce((sum, i) => sum + i.price * i.quantity, 0)

  return { items, count, total, addItem, updateQuantity, removeItem, clearCart, isLoading, refresh }
}
```

- [ ] **Step 2: Add getCartItemsAction to cart.actions.ts**

Add this function to `src/actions/cart.actions.ts` (it's a read action, kept in actions since it needs to be callable from client components):

```typescript
export async function getCartItemsAction(): Promise<CartItemWithProduct[]> {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return []

  const { data: cart } = await supabase.from('carts').select('id').eq('user_id', user.id).single()
  if (!cart) return []

  const { data } = await supabase
    .from('cart_items')
    .select(
      `
      product_id, quantity,
      product:products(id, name, slug, price, stock, published, deleted_at,
        images:product_images(url, order_index)
      )
    `
    )
    .eq('cart_id', cart.id)
    .order('created_at', { ascending: true })

  return (data ?? []).map((item: any) => ({
    productId: item.product_id,
    name: item.product?.name ?? '',
    slug: item.product?.slug ?? '',
    price: item.product?.price ?? 0,
    stock: item.product?.stock ?? 0,
    quantity: item.quantity,
    imageUrl:
      item.product?.images?.sort((a: any, b: any) => a.order_index - b.order_index)?.[0]?.url ??
      null,
    available: item.product?.published === true && item.product?.deleted_at === null,
  }))
}
```

Also add the import at the top of cart.actions.ts:

```typescript
import type { CartItemWithProduct } from '@/hooks/use-cart'
```

- [ ] **Step 3: Create CartProvider**

```typescript
// src/components/cart/cart-provider.tsx
'use client'

import { createContext, useContext } from 'react'
import { useCart, type UseCartReturn } from '@/hooks/use-cart'

const CartContext = createContext<UseCartReturn | null>(null)

export function CartProvider({ children }: { children: React.ReactNode }) {
  const cart = useCart()
  return <CartContext.Provider value={cart}>{children}</CartContext.Provider>
}

export function useCartContext(): UseCartReturn {
  const ctx = useContext(CartContext)
  if (!ctx) throw new Error('useCartContext must be used within CartProvider')
  return ctx
}
```

- [ ] **Step 4: Add CartProvider to root layout**

In `src/app/layout.tsx`, wrap children with `<CartProvider>` inside the existing providers. Import `CartProvider` from `@/components/cart/cart-provider`.

Add the import and wrap like:

```typescript
import { CartProvider } from '@/components/cart/cart-provider'

// Inside the JSX, wrap around children:
<CartProvider>
  {children}
</CartProvider>
```

- [ ] **Step 5: Commit**

```bash
git add src/hooks/use-cart.ts src/components/cart/cart-provider.tsx src/app/layout.tsx src/actions/cart.actions.ts
git commit -m "feat(shop): add hybrid cart hook and provider"
```

---

## Task 8: Cart UI Components

**Files:**

- Create: `src/components/cart/cart-icon.tsx`
- Create: `src/components/cart/cart-item-row.tsx`
- Create: `src/components/cart/cart-summary.tsx`
- Create: `src/components/cart/cart-sheet.tsx`
- Modify: `src/components/layout/navbar.tsx`

- [ ] **Step 1: Create cart icon with badge**

```typescript
// src/components/cart/cart-icon.tsx
'use client'

import { ShoppingCart } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { useCartContext } from '@/components/cart/cart-provider'

interface CartIconProps {
  onClick: () => void
}

export function CartIcon({ onClick }: CartIconProps) {
  const { count } = useCartContext()

  return (
    <Button variant="ghost" size="icon" className="relative" onClick={onClick} aria-label="Ver carrito">
      <ShoppingCart className="h-5 w-5" />
      {count > 0 && (
        <span className="absolute -top-1 -right-1 flex h-5 w-5 items-center justify-center rounded-full bg-primary text-[10px] font-bold text-primary-foreground">
          {count > 99 ? '99+' : count}
        </span>
      )}
    </Button>
  )
}
```

- [ ] **Step 2: Create cart item row**

```typescript
// src/components/cart/cart-item-row.tsx
'use client'

import Image from 'next/image'
import Link from 'next/link'
import { Minus, Plus, Trash2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { formatPrice } from '@/lib/utils/currency'
import { useCartContext } from '@/components/cart/cart-provider'
import type { CartItemWithProduct } from '@/hooks/use-cart'

export function CartItemRow({ item }: { item: CartItemWithProduct }) {
  const { updateQuantity, removeItem } = useCartContext()

  return (
    <div className="flex gap-3 py-3 border-b border-border/50 last:border-0">
      {/* Image */}
      <div className="h-16 w-16 flex-shrink-0 overflow-hidden rounded-md bg-muted">
        {item.imageUrl ? (
          <Image src={item.imageUrl} alt={item.name} width={64} height={64} className="h-full w-full object-cover" />
        ) : (
          <div className="flex h-full w-full items-center justify-center text-muted-foreground text-xs">Sin img</div>
        )}
      </div>

      {/* Info */}
      <div className="flex flex-1 flex-col min-w-0">
        <Link href={`/tienda/${item.slug}`} className="text-sm font-medium truncate hover:text-primary">
          {item.name}
        </Link>
        <span className="text-sm text-muted-foreground">{formatPrice(item.price)}</span>
        {!item.available && <Badge variant="destructive" className="mt-1 w-fit text-[10px]">No disponible</Badge>}

        {/* Quantity controls */}
        {item.available && (
          <div className="mt-1 flex items-center gap-1">
            <Button
              variant="outline"
              size="icon"
              className="h-6 w-6"
              onClick={() => updateQuantity(item.productId, item.quantity - 1)}
              disabled={item.quantity <= 1}
            >
              <Minus className="h-3 w-3" />
            </Button>
            <span className="w-8 text-center text-sm">{item.quantity}</span>
            <Button
              variant="outline"
              size="icon"
              className="h-6 w-6"
              onClick={() => updateQuantity(item.productId, item.quantity + 1)}
              disabled={item.quantity >= item.stock}
            >
              <Plus className="h-3 w-3" />
            </Button>
          </div>
        )}
      </div>

      {/* Subtotal + remove */}
      <div className="flex flex-col items-end justify-between">
        <span className="text-sm font-medium">{formatPrice(item.price * item.quantity)}</span>
        <Button
          variant="ghost"
          size="icon"
          className="h-6 w-6 text-muted-foreground hover:text-destructive"
          onClick={() => removeItem(item.productId)}
        >
          <Trash2 className="h-3 w-3" />
        </Button>
      </div>
    </div>
  )
}
```

- [ ] **Step 3: Create cart summary**

```typescript
// src/components/cart/cart-summary.tsx
'use client'

import { formatPrice } from '@/lib/utils/currency'
import { useCartContext } from '@/components/cart/cart-provider'

export function CartSummary() {
  const { total, count } = useCartContext()

  return (
    <div className="border-t border-border pt-4">
      <div className="flex justify-between text-sm">
        <span className="text-muted-foreground">{count} producto{count !== 1 ? 's' : ''}</span>
        <span className="font-bold text-lg">{formatPrice(total)}</span>
      </div>
    </div>
  )
}
```

- [ ] **Step 4: Create cart sheet**

```typescript
// src/components/cart/cart-sheet.tsx
'use client'

import { useState } from 'react'
import Link from 'next/link'
import { ShoppingCart } from 'lucide-react'
import { Sheet, SheetContent, SheetTitle } from '@/components/ui/sheet'
import { Button } from '@/components/ui/button'
import { ScrollArea } from '@/components/ui/scroll-area'
import { useCartContext } from '@/components/cart/cart-provider'
import { useSession } from '@/components/providers/session-provider'
import { CartIcon } from './cart-icon'
import { CartItemRow } from './cart-item-row'
import { CartSummary } from './cart-summary'

export function CartSheet() {
  const [open, setOpen] = useState(false)
  const { items, count } = useCartContext()
  const { user } = useSession()
  const hasUnavailable = items.some((i) => !i.available)

  return (
    <>
      <CartIcon onClick={() => setOpen(true)} />
      <Sheet open={open} onOpenChange={setOpen}>
        <SheetContent side="right" className="flex w-full flex-col sm:max-w-md">
          <SheetTitle className="flex items-center gap-2">
            <ShoppingCart className="h-5 w-5" />
            Carrito ({count})
          </SheetTitle>

          {items.length === 0 ? (
            <div className="flex flex-1 flex-col items-center justify-center gap-4">
              <ShoppingCart className="h-12 w-12 text-muted-foreground" />
              <p className="text-sm text-muted-foreground">Tu carrito está vacío</p>
              <Button asChild variant="outline" onClick={() => setOpen(false)}>
                <Link href="/tienda">Ir a la tienda</Link>
              </Button>
            </div>
          ) : (
            <>
              <ScrollArea className="flex-1 -mx-6 px-6">
                {items.map((item) => (
                  <CartItemRow key={item.productId} item={item} />
                ))}
              </ScrollArea>

              <div className="mt-auto space-y-3">
                <CartSummary />
                {user ? (
                  <Button
                    asChild
                    className="w-full"
                    disabled={hasUnavailable}
                    onClick={() => setOpen(false)}
                  >
                    <Link href="/checkout">Ir al checkout</Link>
                  </Button>
                ) : (
                  <Button asChild className="w-full" onClick={() => setOpen(false)}>
                    <Link href="/login?returnUrl=/checkout">Iniciar sesión para comprar</Link>
                  </Button>
                )}
                {hasUnavailable && (
                  <p className="text-xs text-destructive text-center">
                    Elimina los productos no disponibles para continuar.
                  </p>
                )}
              </div>
            </>
          )}
        </SheetContent>
      </Sheet>
    </>
  )
}
```

- [ ] **Step 5: Add cart and Tienda link to navbar**

Modify `src/components/layout/navbar.tsx`:

1. Add import: `import { CartSheet } from '@/components/cart/cart-sheet'`
2. Add `{ href: '/tienda', label: 'Tienda' }` to `NAV_LINKS` array
3. Add `<CartSheet />` next to the user actions in desktop and mobile sections

In the desktop actions section (before `{user ? (`), add `<CartSheet />`:

```tsx
<div className="hidden items-center gap-3 md:flex">
  <CartSheet />
  {user ? (
```

In the mobile menu (after the nav links, before `<hr>`), add:

```tsx
<Link href="/tienda" onClick={() => setMobileOpen(false)} className="text-sm font-medium">
  Tienda
</Link>
```

- [ ] **Step 6: Commit**

```bash
git add src/components/cart/ src/components/layout/navbar.tsx
git commit -m "feat(shop): add cart UI components and integrate into navbar"
```

---

## Task 9: Product UI Components

**Files:**

- Create: `src/components/shop/product-card.tsx`
- Create: `src/components/shop/product-grid.tsx`
- Create: `src/components/shop/product-image-gallery.tsx`
- Create: `src/components/shop/product-detail.tsx`
- Create: `src/components/shop/product-filters.tsx`

- [ ] **Step 1: Create product card**

```typescript
// src/components/shop/product-card.tsx
'use client'

import Image from 'next/image'
import Link from 'next/link'
import { ShoppingCart } from 'lucide-react'
import { toast } from 'sonner'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { formatPrice } from '@/lib/utils/currency'
import { useCartContext } from '@/components/cart/cart-provider'
import type { Product } from '@/types/entities'

export function ProductCard({ product }: { product: Product }) {
  const { addItem } = useCartContext()
  const mainImage = product.images?.sort((a, b) => a.order_index - b.order_index)?.[0]
  const outOfStock = product.stock <= 0

  async function handleAdd() {
    await addItem(product.id, 1, {
      name: product.name,
      slug: product.slug,
      price: product.price,
      stock: product.stock,
      imageUrl: mainImage?.url ?? null,
    })
    toast.success('Agregado al carrito')
  }

  return (
    <Card className="group overflow-hidden border-border/50 hover:border-primary/40 transition-colors">
      <Link href={`/tienda/${product.slug}`}>
        <div className="aspect-square overflow-hidden bg-muted">
          {mainImage ? (
            <Image
              src={mainImage.url}
              alt={product.name}
              width={400}
              height={400}
              className="h-full w-full object-cover transition-transform group-hover:scale-105"
            />
          ) : (
            <div className="flex h-full w-full items-center justify-center text-muted-foreground">
              Sin imagen
            </div>
          )}
        </div>
      </Link>
      <CardContent className="p-4">
        {product.category && (
          <Badge
            variant="outline"
            className="mb-2 text-[10px]"
            style={{ borderColor: product.category.color, color: product.category.color }}
          >
            {product.category.name}
          </Badge>
        )}
        <Link href={`/tienda/${product.slug}`}>
          <h3 className="text-sm font-medium line-clamp-2 hover:text-primary transition-colors">
            {product.name}
          </h3>
        </Link>
        {product.brand && (
          <p className="text-xs text-muted-foreground mt-0.5">{product.brand}</p>
        )}
        <div className="mt-3 flex items-center justify-between">
          <span className="text-lg font-bold">{formatPrice(product.price)}</span>
          {outOfStock ? (
            <Badge variant="secondary">Agotado</Badge>
          ) : (
            <Button size="sm" variant="default" onClick={handleAdd}>
              <ShoppingCart className="mr-1 h-4 w-4" />
              Agregar
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  )
}
```

- [ ] **Step 2: Create product grid**

```typescript
// src/components/shop/product-grid.tsx
import type { Product } from '@/types/entities'
import { ProductCard } from './product-card'

export function ProductGrid({ products }: { products: Product[] }) {
  if (products.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-20">
        <p className="text-muted-foreground">No se encontraron productos.</p>
      </div>
    )
  }

  return (
    <div className="grid gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
      {products.map((product) => (
        <ProductCard key={product.id} product={product} />
      ))}
    </div>
  )
}
```

- [ ] **Step 3: Create product image gallery**

```typescript
// src/components/shop/product-image-gallery.tsx
'use client'

import { useState } from 'react'
import Image from 'next/image'
import { cn } from '@/lib/utils'
import type { ProductImage } from '@/types/entities'

export function ProductImageGallery({ images }: { images: ProductImage[] }) {
  const sorted = [...images].sort((a, b) => a.order_index - b.order_index)
  const [selectedIndex, setSelectedIndex] = useState(0)
  const selected = sorted[selectedIndex]

  if (sorted.length === 0) {
    return (
      <div className="aspect-square rounded-lg bg-muted flex items-center justify-center">
        <span className="text-muted-foreground">Sin imagen</span>
      </div>
    )
  }

  return (
    <div className="space-y-3">
      {/* Main image */}
      <div className="aspect-square overflow-hidden rounded-lg bg-muted">
        {selected && (
          <Image
            src={selected.url}
            alt="Producto"
            width={600}
            height={600}
            className="h-full w-full object-cover"
            priority
          />
        )}
      </div>

      {/* Thumbnails */}
      {sorted.length > 1 && (
        <div className="flex gap-2 overflow-x-auto">
          {sorted.map((img, i) => (
            <button
              key={img.id}
              onClick={() => setSelectedIndex(i)}
              className={cn(
                'h-16 w-16 flex-shrink-0 overflow-hidden rounded-md border-2 transition-colors',
                i === selectedIndex ? 'border-primary' : 'border-transparent hover:border-border'
              )}
            >
              <Image src={img.url} alt="" width={64} height={64} className="h-full w-full object-cover" />
            </button>
          ))}
        </div>
      )}
    </div>
  )
}
```

- [ ] **Step 4: Create product detail**

```typescript
// src/components/shop/product-detail.tsx
'use client'

import { useState } from 'react'
import { ShoppingCart, Minus, Plus } from 'lucide-react'
import { toast } from 'sonner'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { formatPrice } from '@/lib/utils/currency'
import { useCartContext } from '@/components/cart/cart-provider'
import { ProductImageGallery } from './product-image-gallery'
import type { Product } from '@/types/entities'

export function ProductDetail({ product }: { product: Product }) {
  const [quantity, setQuantity] = useState(1)
  const { addItem } = useCartContext()
  const router = useRouter()
  const outOfStock = product.stock <= 0
  const mainImage = product.images?.sort((a, b) => a.order_index - b.order_index)?.[0]

  async function handleAddToCart() {
    await addItem(product.id, quantity, {
      name: product.name,
      slug: product.slug,
      price: product.price,
      stock: product.stock,
      imageUrl: mainImage?.url ?? null,
    })
    toast.success('Agregado al carrito')
  }

  async function handleBuyNow() {
    await handleAddToCart()
    router.push('/checkout')
  }

  return (
    <div className="grid gap-8 md:grid-cols-2">
      {/* Images */}
      <ProductImageGallery images={product.images ?? []} />

      {/* Info */}
      <div className="space-y-4">
        {product.category && (
          <Badge variant="outline" style={{ borderColor: product.category.color, color: product.category.color }}>
            {product.category.name}
          </Badge>
        )}

        <h1 className="text-2xl font-bold">{product.name}</h1>

        {product.brand && (
          <p className="text-sm text-muted-foreground">Marca: {product.brand}</p>
        )}

        <p className="text-3xl font-bold text-primary">{formatPrice(product.price)}</p>

        <p className="text-sm text-muted-foreground">
          {outOfStock ? 'Sin stock' : `${product.stock} disponibles`}
        </p>

        {product.weight && (
          <p className="text-sm text-muted-foreground">Peso: {product.weight}g</p>
        )}
        {product.dimensions && (
          <p className="text-sm text-muted-foreground">Dimensiones: {product.dimensions}</p>
        )}

        {/* Quantity selector */}
        {!outOfStock && (
          <div className="flex items-center gap-3">
            <span className="text-sm">Cantidad:</span>
            <div className="flex items-center gap-1">
              <Button
                variant="outline"
                size="icon"
                className="h-8 w-8"
                onClick={() => setQuantity((q) => Math.max(1, q - 1))}
                disabled={quantity <= 1}
              >
                <Minus className="h-4 w-4" />
              </Button>
              <span className="w-10 text-center font-medium">{quantity}</span>
              <Button
                variant="outline"
                size="icon"
                className="h-8 w-8"
                onClick={() => setQuantity((q) => Math.min(product.stock, q + 1))}
                disabled={quantity >= product.stock}
              >
                <Plus className="h-4 w-4" />
              </Button>
            </div>
          </div>
        )}

        {/* Action buttons */}
        <div className="flex flex-col gap-2 pt-2">
          <Button onClick={handleAddToCart} disabled={outOfStock} className="w-full">
            <ShoppingCart className="mr-2 h-4 w-4" />
            Agregar al carrito
          </Button>
          <Button onClick={handleBuyNow} disabled={outOfStock} variant="outline" className="w-full">
            Comprar ahora
          </Button>
        </div>

        {/* Description */}
        <div className="pt-4 border-t border-border">
          <h2 className="text-sm font-semibold mb-2">Descripción</h2>
          <p className="text-sm text-muted-foreground whitespace-pre-wrap">{product.description}</p>
        </div>
      </div>
    </div>
  )
}
```

- [ ] **Step 5: Create product filters**

```typescript
// src/components/shop/product-filters.tsx
'use client'

import { useQueryState } from 'nuqs'
import { Search } from 'lucide-react'
import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import type { ProductCategory } from '@/types/entities'

interface ProductFiltersProps {
  categories: ProductCategory[]
}

export function ProductFilters({ categories }: ProductFiltersProps) {
  const [search, setSearch] = useQueryState('q', { defaultValue: '' })
  const [category, setCategory] = useQueryState('categoria', { defaultValue: '' })
  const [sort, setSort] = useQueryState('orden', { defaultValue: 'newest' })

  return (
    <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
      {/* Search */}
      <div className="relative flex-1">
        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          placeholder="Buscar producto..."
          value={search}
          onChange={(e) => setSearch(e.target.value || null)}
          className="pl-9"
        />
      </div>

      {/* Category filter */}
      <Select value={category} onValueChange={(v) => setCategory(v === 'all' ? null : v)}>
        <SelectTrigger className="w-full sm:w-48">
          <SelectValue placeholder="Categoría" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">Todas</SelectItem>
          {categories.map((cat) => (
            <SelectItem key={cat.slug} value={cat.slug}>
              {cat.name}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>

      {/* Sort */}
      <Select value={sort} onValueChange={(v) => setSort(v)}>
        <SelectTrigger className="w-full sm:w-48">
          <SelectValue placeholder="Ordenar por" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="newest">Más recientes</SelectItem>
          <SelectItem value="price_asc">Precio: menor a mayor</SelectItem>
          <SelectItem value="price_desc">Precio: mayor a menor</SelectItem>
          <SelectItem value="name">Nombre A-Z</SelectItem>
        </SelectContent>
      </Select>
    </div>
  )
}
```

- [ ] **Step 6: Commit**

```bash
git add src/components/shop/
git commit -m "feat(shop): add product UI components (card, grid, detail, gallery, filters)"
```

---

## Task 10: Public Store Pages

**Files:**

- Create: `src/app/(public)/tienda/page.tsx`
- Create: `src/app/(public)/tienda/[slug]/page.tsx`

- [ ] **Step 1: Create catalog page**

```typescript
// src/app/(public)/tienda/page.tsx
import type { Metadata } from 'next'
import { getPublishedProducts } from '@/dal/shop.dal'
import { getAllProductCategories } from '@/dal/shop.dal'
import { ProductGrid } from '@/components/shop/product-grid'
import { ProductFilters } from '@/components/shop/product-filters'
import { Pagination, PaginationContent, PaginationItem, PaginationLink, PaginationNext, PaginationPrevious } from '@/components/ui/pagination'

export const metadata: Metadata = {
  title: 'Tienda — GymRoutines',
  description: 'Encuentra suplementos, ropa y accesorios para tu entrenamiento.',
}

interface Props {
  searchParams: Promise<{
    q?: string
    categoria?: string
    orden?: string
    page?: string
  }>
}

export default async function TiendaPage({ searchParams }: Props) {
  const params = await searchParams
  const page = Math.max(1, parseInt(params.page ?? '1', 10))

  const [{ products, total }, categories] = await Promise.all([
    getPublishedProducts({
      page,
      limit: 12,
      categorySlug: params.categoria || null,
      search: params.q || null,
      sort: (params.orden as any) || null,
    }),
    getAllProductCategories(),
  ])

  const totalPages = Math.ceil(total / 12)

  // Build pagination URLs preserving current filters
  function buildPageUrl(p: number) {
    const url = new URLSearchParams()
    if (params.q) url.set('q', params.q)
    if (params.categoria) url.set('categoria', params.categoria)
    if (params.orden) url.set('orden', params.orden)
    url.set('page', String(p))
    return `/tienda?${url.toString()}`
  }

  return (
    <div className="container mx-auto max-w-6xl px-4 py-10">
      <div className="mb-8">
        <h1 className="text-2xl font-bold">Tienda</h1>
        <p className="text-sm text-muted-foreground mt-1">
          {total} producto{total !== 1 ? 's' : ''}
        </p>
      </div>

      <div className="mb-6">
        <ProductFilters categories={categories} />
      </div>

      <ProductGrid products={products} />

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="mt-8 flex justify-center">
          <Pagination>
            <PaginationContent>
              {page > 1 && (
                <PaginationItem>
                  <PaginationPrevious href={buildPageUrl(page - 1)} />
                </PaginationItem>
              )}
              {Array.from({ length: totalPages }, (_, i) => i + 1).map((p) => (
                <PaginationItem key={p}>
                  <PaginationLink href={buildPageUrl(p)} isActive={p === page}>
                    {p}
                  </PaginationLink>
                </PaginationItem>
              ))}
              {page < totalPages && (
                <PaginationItem>
                  <PaginationNext href={buildPageUrl(page + 1)} />
                </PaginationItem>
              )}
            </PaginationContent>
          </Pagination>
        </div>
      )}
    </div>
  )
}
```

- [ ] **Step 2: Create product detail page**

```typescript
// src/app/(public)/tienda/[slug]/page.tsx
import type { Metadata } from 'next'
import Link from 'next/link'
import { notFound } from 'next/navigation'
import { ArrowLeft } from 'lucide-react'
import { getProductBySlug } from '@/dal/shop.dal'
import { ProductDetail } from '@/components/shop/product-detail'

interface Props {
  params: Promise<{ slug: string }>
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params
  const product = await getProductBySlug(slug)
  if (!product) return { title: 'Producto no encontrado' }
  return {
    title: `${product.name} — Tienda GymRoutines`,
    description: product.description.slice(0, 160),
  }
}

export default async function ProductPage({ params }: Props) {
  const { slug } = await params
  const product = await getProductBySlug(slug)
  if (!product) notFound()

  return (
    <div className="container mx-auto max-w-5xl px-4 py-10">
      <Link
        href="/tienda"
        className="mb-6 inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-primary transition-colors"
      >
        <ArrowLeft className="h-4 w-4" />
        Volver a tienda
      </Link>

      <ProductDetail product={product} />
    </div>
  )
}
```

- [ ] **Step 3: Verify build**

Run: `npm run type-check`

Expected: No TypeScript errors.

- [ ] **Step 4: Commit**

```bash
git add src/app/\(public\)/tienda/
git commit -m "feat(shop): add public store catalog and product detail pages"
```

---

## Task 11: Admin Product & Category Management Pages

**Files:**

- Create: `src/components/shop/product-form.tsx`
- Create: `src/components/shop/product-category-form.tsx`
- Create: `src/app/admin/tienda/page.tsx`
- Create: `src/app/admin/tienda/nuevo/page.tsx`
- Create: `src/app/admin/tienda/[id]/editar/page.tsx`
- Create: `src/app/admin/tienda/categorias/page.tsx`
- Modify: `src/app/admin/page.tsx`

This task creates the admin-side product management. The components follow the exact same pattern as the existing `CategoryAdminPanel` and admin pages. Due to size, implement these one at a time.

- [ ] **Step 1: Create product category admin form** — Follow the exact pattern of `src/components/admin/category-admin-panel.tsx` but for `product_categories` table, using `createProductCategoryAction` and `deleteProductCategoryAction`.

- [ ] **Step 2: Create admin product categories page** — Follow the pattern of `src/app/admin/categorias/page.tsx`.

- [ ] **Step 3: Create product form** — Create `src/components/shop/product-form.tsx` with fields: name, description (textarea), price, stock, brand, weight, dimensions, category_id (select), published (switch), images (file upload with multiple). Use `react-hook-form` + `zodResolver(productSchema)`. Handle both create and edit modes via a `product?: Product` prop.

- [ ] **Step 4: Create admin product list page** — Create `src/app/admin/tienda/page.tsx` showing a table of products (name, price, stock, category, published status) with edit/delete actions. Use `getAdminProducts()` from DAL.

- [ ] **Step 5: Create admin new product page** — Simple wrapper around `ProductForm` in create mode.

- [ ] **Step 6: Create admin edit product page** — Fetches product by ID via `getProductById()`, passes to `ProductForm` in edit mode.

- [ ] **Step 7: Add shop stats to admin dashboard** — Add product count and order count cards to `src/app/admin/page.tsx`, plus quick action buttons for "Gestionar tienda" and "Ver pedidos".

- [ ] **Step 8: Commit**

```bash
git add src/components/shop/product-form.tsx src/components/shop/product-category-form.tsx src/app/admin/tienda/ src/app/admin/page.tsx
git commit -m "feat(shop): add admin product and category management pages"
```

---

## Task 12: Order & Checkout Components

**Files:**

- Create: `src/components/orders/order-status-badge.tsx`
- Create: `src/components/orders/order-status-select.tsx`
- Create: `src/components/orders/order-list.tsx`
- Create: `src/components/orders/order-detail.tsx`
- Create: `src/components/checkout/address-form.tsx`
- Create: `src/components/checkout/order-summary.tsx`
- Create: `src/components/checkout/simulated-payment.tsx`
- Create: `src/components/checkout/checkout-form.tsx`

- [ ] **Step 1: Create order status badge**

```typescript
// src/components/orders/order-status-badge.tsx
import { Badge } from '@/components/ui/badge'
import type { OrderStatus } from '@/types/entities'

const STATUS_CONFIG: Record<OrderStatus, { label: string; variant: 'default' | 'secondary' | 'destructive' | 'outline' }> = {
  pending: { label: 'Pendiente', variant: 'outline' },
  confirmed: { label: 'Confirmado', variant: 'default' },
  shipped: { label: 'Enviado', variant: 'secondary' },
  delivered: { label: 'Entregado', variant: 'default' },
  cancelled: { label: 'Cancelado', variant: 'destructive' },
}

export function OrderStatusBadge({ status }: { status: OrderStatus }) {
  const config = STATUS_CONFIG[status] ?? STATUS_CONFIG.pending
  return <Badge variant={config.variant}>{config.label}</Badge>
}
```

- [ ] **Step 2: Create order status select** — Admin-only select to advance order status. Uses `updateOrderStatusAction`. Shows only valid next states.

- [ ] **Step 3: Create order list component** — Reusable list showing order cards with order_number, date, item count, total, status badge. Used by both admin and user pages.

- [ ] **Step 4: Create order detail component** — Shows full order info: items, address, status, total. Accepts an `isAdmin` prop to show status changer.

- [ ] **Step 5: Create address form** — Reusable form using `shippingAddressSchema` + `react-hook-form`. Used in checkout and potentially in a future address management page.

- [ ] **Step 6: Create checkout order summary** — Shows cart items, quantities, prices, and total. Read-only summary for the checkout page.

- [ ] **Step 7: Create simulated payment button** — Simple button that calls `createOrderAction`. Shows loading state. On success, redirects to confirmation page.

- [ ] **Step 8: Create checkout form** — Combines address selector/form + order summary + simulated payment into the checkout page layout.

- [ ] **Step 9: Commit**

```bash
git add src/components/orders/ src/components/checkout/
git commit -m "feat(shop): add order and checkout UI components"
```

---

## Task 13: Checkout & Confirmation Pages

**Files:**

- Create: `src/app/(checkout)/checkout/layout.tsx`
- Create: `src/app/(checkout)/checkout/page.tsx`
- Create: `src/app/(checkout)/checkout/confirmacion/page.tsx`

- [ ] **Step 1: Create checkout layout** — Auth guard: redirect to `/login?returnUrl=/checkout` if not authenticated. Include Navbar + Footer.

- [ ] **Step 2: Create checkout page** — Fetches user's addresses via `getUserAddresses()`, cart items, and renders `CheckoutForm`.

- [ ] **Step 3: Create confirmation page** — Reads `order` query param, fetches order details with `getOrderById()`, shows success message with order summary.

- [ ] **Step 4: Commit**

```bash
git add src/app/\(checkout\)/
git commit -m "feat(shop): add checkout and order confirmation pages"
```

---

## Task 14: Admin Orders Pages

**Files:**

- Create: `src/app/admin/pedidos/page.tsx`
- Create: `src/app/admin/pedidos/[id]/page.tsx`

- [ ] **Step 1: Create admin orders list page** — Uses `getAdminOrders()` with status filter and search. Displays table with order_number, client, total, status, date columns. Pagination with 20 per page.

- [ ] **Step 2: Create admin order detail page** — Uses `getAdminOrderById()`. Shows full order details with `OrderDetail` component in admin mode (shows status changer).

- [ ] **Step 3: Commit**

```bash
git add src/app/admin/pedidos/
git commit -m "feat(shop): add admin order management pages"
```

---

## Task 15: User Order History Pages

**Files:**

- Create: `src/app/dashboard/mis-pedidos/page.tsx`
- Create: `src/app/dashboard/mis-pedidos/[id]/page.tsx`

- [ ] **Step 1: Create user orders page** — Auth guard, uses `getMyOrders()` with pagination (10 per page). Shows order list with cancel button for `confirmed` orders.

- [ ] **Step 2: Create user order detail page** — Uses `getOrderById()`, shows order details. Shows cancel button if status is `confirmed`.

- [ ] **Step 3: Add "Mis pedidos" link to navbar user menu**

In `src/components/layout/navbar.tsx`, add a `DropdownMenuItem` linking to `/dashboard/mis-pedidos` in the `UserMenu` component (after "Favoritos"):

```tsx
<DropdownMenuItem asChild>
  <Link href="/dashboard/mis-pedidos">Mis pedidos</Link>
</DropdownMenuItem>
```

Also add in mobile menu section.

- [ ] **Step 4: Commit**

```bash
git add src/app/dashboard/mis-pedidos/ src/components/layout/navbar.tsx
git commit -m "feat(shop): add user order history pages and nav link"
```

---

## Task 16: Final Integration & Type Check

- [ ] **Step 1: Run type check**

Run: `npm run type-check`

Fix any TypeScript errors.

- [ ] **Step 2: Run linter**

Run: `npm run lint`

Fix any lint errors.

- [ ] **Step 3: Run build**

Run: `npm run build`

Fix any build errors. This is critical since the project deploys on Vercel.

- [ ] **Step 4: Manual smoke test**

1. Start dev server: `npm run dev`
2. Visit `/tienda` — verify product grid loads (empty is OK if no products yet)
3. Visit `/admin/tienda/categorias` — create a product category
4. Visit `/admin/tienda/nuevo` — create a product with images
5. Visit `/tienda` — verify product appears
6. Click product — verify detail page
7. Add to cart — verify cart sheet works
8. Go to checkout — verify address form and order creation
9. Check `/dashboard/mis-pedidos` — verify order appears
10. Check `/admin/pedidos` — verify order appears with status controls

- [ ] **Step 5: Final commit**

```bash
git add -A
git commit -m "feat(shop): finalize shop module integration and fix build issues"
```
