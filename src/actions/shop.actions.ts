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
    while (existingSlugs.has(`${baseSlug}-${counter}`)) counter++
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
