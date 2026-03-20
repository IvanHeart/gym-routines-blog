# Tienda / Shop — Spec de Diseño

**Fecha:** 2026-03-20
**Estado:** Draft
**Módulo:** Tienda (ventas de productos de gimnasio)

---

## Resumen

Agregar un módulo de tienda al blog de rutinas de gimnasio. El admin puede dar de alta productos físicos (suplementos, ropa, accesorios) y los usuarios autenticados pueden comprarlos mediante un carrito de compras con pago simulado (sin integración con procesador de pagos).

### Requisitos clave

- La tienda es pública (cualquiera ve productos)
- Agregar al carrito y comprar requiere sesión iniciada
- Carrito híbrido: localStorage sin sesión, Supabase con sesión, sync al login
- Admin gestiona productos, categorías de tienda y pedidos con estados
- Pago simulado (preparado para integrar Stripe/MercadoPago en el futuro)
- Sigue los patrones existentes del proyecto (DAL, Server Actions, Zod, react-hook-form, shadcn)

---

## 1. Esquema de base de datos

### 1.1 `product_categories`

| Columna    | Tipo          | Notas                       |
| ---------- | ------------- | --------------------------- |
| id         | UUID (PK)     | gen_random_uuid()           |
| name       | TEXT (unique) | "Suplementos", "Ropa", etc. |
| slug       | TEXT (unique) | auto-generado               |
| color      | TEXT          | color hex                   |
| created_at | TIMESTAMPTZ   | default now()               |

### 1.2 `products`

| Columna     | Tipo                           | Notas                           |
| ----------- | ------------------------------ | ------------------------------- |
| id          | UUID (PK)                      | gen_random_uuid()               |
| name        | TEXT                           | 5-150 chars                     |
| slug        | TEXT (unique)                  | auto-generado                   |
| description | TEXT                           | descripción larga               |
| price       | NUMERIC(10,2)                  | precio en MXN (pesos mexicanos) |
| stock       | INTEGER                        | cantidad disponible             |
| brand       | TEXT nullable                  | marca                           |
| weight      | NUMERIC(8,2) nullable          | peso en gramos                  |
| dimensions  | TEXT nullable                  | ej: "30x20x10 cm"               |
| category_id | UUID (FK → product_categories) | nullable                        |
| published   | BOOLEAN                        | default false                   |
| deleted_at  | TIMESTAMPTZ nullable           | soft delete                     |
| created_at  | TIMESTAMPTZ                    |                                 |
| updated_at  | TIMESTAMPTZ                    |                                 |

### 1.3 `product_images`

| Columna     | Tipo                 | Notas               |
| ----------- | -------------------- | ------------------- |
| id          | UUID (PK)            |                     |
| product_id  | UUID (FK → products) | ON DELETE CASCADE   |
| url         | TEXT                 | URL pública Storage |
| order_index | INTEGER              | para ordenar        |
| created_at  | TIMESTAMPTZ          |                     |

### 1.4 `carts`

| Columna    | Tipo                         | Notas                  |
| ---------- | ---------------------------- | ---------------------- |
| id         | UUID (PK)                    |                        |
| user_id    | UUID (FK → profiles, unique) | un carrito por usuario |
| created_at | TIMESTAMPTZ                  |                        |
| updated_at | TIMESTAMPTZ                  |                        |

### 1.5 `cart_items`

| Columna    | Tipo                  | Notas             |
| ---------- | --------------------- | ----------------- |
| id         | UUID (PK)             |                   |
| cart_id    | UUID (FK → carts)     | ON DELETE CASCADE |
| product_id | UUID (FK → products)  | ON DELETE CASCADE |
| quantity   | INTEGER               | min 1             |
| created_at | TIMESTAMPTZ           |                   |
| UNIQUE     | (cart_id, product_id) | evita duplicados  |

### 1.6 `shipping_addresses`

| Columna      | Tipo                 | Notas                   |
| ------------ | -------------------- | ----------------------- |
| id           | UUID (PK)            |                         |
| user_id      | UUID (FK → profiles) |                         |
| full_name    | TEXT                 | nombre del destinatario |
| phone        | TEXT                 | teléfono                |
| address_line | TEXT                 | calle y número          |
| city         | TEXT                 |                         |
| state        | TEXT                 | provincia/estado        |
| postal_code  | TEXT                 |                         |
| country      | TEXT                 | default 'México'        |
| notes        | TEXT nullable        | notas opcionales        |
| is_default   | BOOLEAN              | default false           |
| created_at   | TIMESTAMPTZ          |                         |
| updated_at   | TIMESTAMPTZ          |                         |

### 1.7 `orders`

| Columna             | Tipo                           | Notas                                                           |
| ------------------- | ------------------------------ | --------------------------------------------------------------- |
| id                  | UUID (PK)                      |                                                                 |
| order_number        | SERIAL UNIQUE                  | número legible auto-incremental (ej: #001)                      |
| user_id             | UUID (FK → profiles)           |                                                                 |
| status              | TEXT                           | 'pending' / 'confirmed' / 'shipped' / 'delivered' / 'cancelled' |
| total               | NUMERIC(10,2)                  | total en MXN                                                    |
| shipping_address_id | UUID (FK → shipping_addresses) | ON DELETE RESTRICT                                              |
| notes               | TEXT nullable                  | notas del comprador                                             |
| created_at          | TIMESTAMPTZ                    |                                                                 |
| updated_at          | TIMESTAMPTZ                    |                                                                 |

### 1.8 `order_items`

| Columna      | Tipo                          | Notas                                   |
| ------------ | ----------------------------- | --------------------------------------- |
| id           | UUID (PK)                     |                                         |
| order_id     | UUID (FK → orders)            | ON DELETE CASCADE                       |
| product_id   | UUID (FK → products) nullable | SET NULL on delete (preserva historial) |
| product_name | TEXT                          | nombre congelado al momento compra      |
| quantity     | INTEGER                       |                                         |
| unit_price   | NUMERIC(10,2)                 | precio congelado al momento compra      |
| created_at   | TIMESTAMPTZ                   |                                         |

### 1.9 RLS (Row Level Security)

- `products`, `product_categories`, `product_images`: lectura pública (published=true), escritura solo admin
- `carts`, `cart_items`: solo el propietario (user_id = auth.uid())
- `shipping_addresses`: solo el propietario
- `orders`, `order_items`: propietario puede leer, admin puede leer/actualizar estado
- Admin bypass vía service_role_key en DAL (patrón existente)

---

## 2. Arquitectura de archivos

### 2.1 Lógica y datos

```
src/
  lib/validations/
    shop.ts                    — Zod schemas (product, cart, order, address, product_category)

  dal/
    shop.dal.ts                — Queries: productos publicados, categorías tienda, pedidos
    cart.dal.ts                — Queries: carrito del usuario

  actions/
    shop.actions.ts            — CRUD productos y categorías (admin)
    cart.actions.ts            — Agregar/quitar items, sync localStorage → DB
    order.actions.ts           — Crear orden, actualizar estado (admin)
    address.actions.ts         — CRUD direcciones de envío

  types/entities/
    index.ts                   — Agregar: Product, ProductCategory, ProductImage,
                                  Cart, CartItem, Order, OrderItem, ShippingAddress

  hooks/                           — (directorio nuevo, se crea para este módulo)
    use-cart.ts                — Hook híbrido localStorage + Supabase sync
```

### 2.2 Rutas (App Router)

```
src/app/
  (public)/
    tienda/
      page.tsx                 — Catálogo público
      [slug]/
        page.tsx               — Detalle de producto

  admin/
    tienda/
      page.tsx                 — Lista productos (admin)
      nuevo/
        page.tsx               — Crear producto
      [id]/editar/
        page.tsx               — Editar producto
      categorias/
        page.tsx               — CRUD categorías de tienda
    pedidos/
      page.tsx                 — Lista pedidos con filtros
      [id]/
        page.tsx               — Detalle pedido + cambiar estado

  dashboard/
    mis-pedidos/
      page.tsx                 — Historial pedidos usuario
      [id]/
        page.tsx               — Detalle pedido usuario

  (checkout)/
    checkout/
      page.tsx                 — Formulario checkout
      confirmacion/
        page.tsx               — Confirmación post-compra
```

### 2.3 Componentes

```
src/components/
  shop/
    product-card.tsx           — Card de producto para catálogo
    product-grid.tsx           — Grid responsive
    product-detail.tsx         — Vista detallada
    product-image-gallery.tsx  — Galería con thumbnails
    product-filters.tsx        — Filtros (categoría, precio, búsqueda)
    product-form.tsx           — Form admin crear/editar
    product-category-form.tsx  — Form admin categorías

  cart/
    cart-sheet.tsx             — Panel lateral del carrito
    cart-item-row.tsx          — Fila de item
    cart-icon.tsx              — Icono con badge en navbar
    cart-summary.tsx           — Resumen de totales

  orders/
    order-list.tsx             — Lista pedidos (admin/user)
    order-detail.tsx           — Detalle pedido
    order-status-badge.tsx     — Badge con color por estado
    order-status-select.tsx    — Select cambiar estado (admin)

  checkout/
    checkout-form.tsx          — Form dirección + notas
    address-form.tsx           — Form reutilizable dirección
    order-summary.tsx          — Resumen antes de confirmar
    simulated-payment.tsx      — Botón pago simulado
```

---

## 3. Flujo del carrito híbrido

### 3.1 Sin sesión (localStorage)

- Items se guardan como `[{ productId: string, quantity: number }]`
- El hook `useCart` lee/escribe de localStorage
- Al intentar checkout → redirect a `/login?returnUrl=/checkout`

### 3.2 Con sesión (Supabase)

- Todas las operaciones van contra DB vía server actions
- Tabla `carts` (1 por usuario) + `cart_items`

### 3.3 Sync al login

1. Lee items de localStorage
2. Lee carrito de DB
3. Merge: por cada item en localStorage, si existe en DB **suma las cantidades** (comportamiento aditivo), si no existe lo agrega
4. Limpia localStorage
5. A partir de aquí opera solo contra DB

### 3.4 Hook `useCart` — interfaz pública

```typescript
{
  items: CartItemWithProduct[]
  count: number
  total: number
  addItem(productId: string, qty: number): void
  updateQuantity(productId: string, qty: number): void
  removeItem(productId: string): void
  clearCart(): void
  isLoading: boolean
}
```

---

## 4. Flujo de checkout

1. Click "Ir al checkout" → valida sesión y carrito no vacío
2. Página `/checkout`:
   - Selector de direcciones guardadas o crear nueva
   - Resumen del pedido (items, cantidades, precios)
   - Campo de notas (opcional)
   - Botón "Confirmar compra" (pago simulado)
3. Server action `createOrder` — ejecuta todo dentro de una **Supabase RPC (función PL/pgSQL)** para garantizar atomicidad:
   a. Verifica stock con `SELECT ... FOR UPDATE` (lock de fila, evita race conditions)
   b. Si alguno sin stock → RAISE EXCEPTION con detalle
   c. Crea `orders` con status `confirmed` (pago simulado = éxito inmediato)
   d. Crea `order_items` con precio y nombre congelados
   e. Decrementa stock atómicamente: `UPDATE products SET stock = stock - qty WHERE stock >= qty`
   f. Vacía carrito del usuario
   g. Retorna order_id
   - Si cualquier paso falla, la transacción hace rollback completo
   - El estado `pending` queda reservado para cuando se integre un procesador de pago real
4. Redirect a `/checkout/confirmacion?order=<id>`

### 4.1 Pago simulado

- Componente `simulated-payment.tsx` con botón de confirmar
- Sin integración con procesador de pagos
- Diseñado para ser reemplazable por Stripe/MercadoPago

---

## 5. Panel de administración

### 5.1 Gestión de productos (`/admin/tienda`)

- Tabla con nombre, precio, stock, categoría, publicado/borrador
- Acciones: editar, eliminar
- Formulario: datos básicos + categoría + imágenes (upload múltiple, drag para reordenar) + toggle publicado

### 5.2 Categorías de tienda (`/admin/tienda/categorias`)

- Mismo patrón que `/admin/categorias` existente
- Lista con nombre, color, slug + crear/eliminar

### 5.3 Gestión de pedidos (`/admin/pedidos`)

- Lista con filtro por estado y búsqueda
- Columnas: #, cliente, total, estado, fecha
- Detalle: info del cliente, dirección, items, total + selector de estado

### 5.4 Estados del pedido

```
pending → confirmed → shipped → delivered
    ↓         ↓          ↓
 cancelled  cancelled  cancelled
```

- Solo avanzar o cancelar (no retroceder)
- Al cancelar → restaurar stock vía RPC atómica (mismo patrón que createOrder)
- Si el producto fue eliminado (soft-delete o product_id = NULL en order_items), el stock no se restaura

### 5.5 Paginación

- Catálogo público: paginación offset con 12 productos por página (usando `nuqs` para page param)
- Admin productos: paginación offset con 20 por página
- Admin pedidos: paginación offset con 20 por página, filtrable por estado
- Dashboard mis-pedidos: paginación offset con 10 por página

### 5.6 Soft delete de productos

- Los productos no se eliminan físicamente; se usa `published = false` + `deleted_at TIMESTAMPTZ nullable`
- `order_items.product_id` usa ON DELETE SET NULL para preservar historial
- `order_items.product_name` y `order_items.unit_price` mantienen los datos congelados
- Las imágenes en Storage se conservan mientras el producto está soft-deleted (para posible restauración); se limpian solo en purga definitiva (fuera de alcance)

### 5.7 Productos no disponibles en el carrito

- Si un producto en el carrito es soft-deleted o despublicado, el carrito lo muestra con un badge "No disponible" y deshabilita su cantidad
- El `createOrder` RPC rechaza la orden si algún item del carrito referencia un producto no publicado o soft-deleted
- El usuario debe eliminar manualmente los items no disponibles antes de proceder al checkout

### 5.8 Validación de stock en el carrito

- Al agregar un producto al carrito (con sesión / server action): se valida que `quantity <= stock`
- Al agregar sin sesión (localStorage): validación client-side contra el stock mostrado en UI
- El checkout hace la validación definitiva dentro de la RPC con lock de fila

### 5.9 Cancelación por el usuario

- El usuario puede cancelar sus propios pedidos **solo** en estado `confirmed` (antes del envío)
- Desde `/dashboard/mis-pedidos/[id]` se muestra un botón "Cancelar pedido" si el estado es `confirmed`
- La cancelación restaura stock vía la misma RPC atómica
- En estados `shipped` o `delivered`, el usuario no puede cancelar (debe contactar al admin)

### 5.10 Nota sobre estado `pending`

- El estado `pending` existe en el esquema pero no se usa actualmente
- Queda reservado para cuando se integre un procesador de pago real (la orden se crea como `pending` y pasa a `confirmed` cuando el pago es exitoso)
- La transición `pending → cancelled` solo se ejercerá cuando exista integración de pagos

---

## 6. Navegación

- **Navbar**: enlace "Tienda" visible para todos
- **Navbar**: icono carrito con badge de cantidad (siempre visible; lee de localStorage sin sesión, de DB con sesión)
- **Dashboard**: enlace "Mis pedidos"
- **Admin**: enlace "Tienda" (productos + categorías) + "Pedidos"

---

## 7. Storage

- Nuevo bucket Supabase Storage: `product-images`
- Path: `{product_id}/{timestamp}.webp`
- Reutiliza utilidades de procesamiento de imagen existentes (adaptar para productos)

---

## 8. Moneda y formato

- Moneda: MXN (peso mexicano)
- Formato de display: `$1,500.00` usando `Intl.NumberFormat('es-MX', { style: 'currency', currency: 'MXN' })`
- Constante de configuración en `src/config/` para facilitar cambio futuro

---

## 9. Consideraciones para Vercel

- Todas las mutaciones son Server Actions (compatible con Vercel serverless)
- No hay API routes custom
- Imágenes procesadas con Sharp (ya incluido en dependencias)
- Variables de entorno de Supabase ya configuradas
- No se requieren cambios en `vercel.json` ni configuración de build

---

## 10. Fuera de alcance (futuro)

- Integración con procesador de pagos real (Stripe, MercadoPago)
- Emails de confirmación/notificación
- Variantes de producto (tallas, colores)
- Cupones de descuento
- Reseñas de productos
- Wishlist / lista de deseos
