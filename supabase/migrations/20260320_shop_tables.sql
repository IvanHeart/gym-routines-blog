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
