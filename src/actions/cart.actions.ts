'use server'

import { revalidatePath } from 'next/cache'
import { createClient } from '@/lib/supabase/server'
import { addToCartSchema } from '@/lib/validations/shop'
import type { ActionResult } from '@/types/api'
import type { LocalCartItem } from '@/types/entities'

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

  return (data ?? []).map((item: Record<string, unknown>) => {
    const product = item.product as Record<string, unknown> | null
    const images = (product?.images as Array<{ url: string; order_index: number }>) ?? []
    const sorted = [...images].sort((a, b) => a.order_index - b.order_index)
    return {
      productId: item.product_id as string,
      name: (product?.name as string) ?? '',
      slug: (product?.slug as string) ?? '',
      price: (product?.price as number) ?? 0,
      stock: (product?.stock as number) ?? 0,
      quantity: item.quantity as number,
      imageUrl: sorted[0]?.url ?? null,
      available: product?.published === true && product?.deleted_at === null,
    }
  })
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
