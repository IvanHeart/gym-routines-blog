import type { SupabaseClient } from '@supabase/supabase-js'

export function slugify(text: string): string {
  return text
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9\s-]/g, '')
    .trim()
    .replace(/\s+/g, '-')
    .slice(0, 60)
}

export async function generateUniqueSlug(title: string, supabase: SupabaseClient): Promise<string> {
  const base = slugify(title)
  const { data } = await supabase.from('routines').select('slug').like('slug', `${base}%`)

  const existing = new Set((data ?? []).map((r) => r.slug))
  if (!existing.has(base)) return base

  let counter = 2
  while (existing.has(`${base}-${counter}`)) counter++
  return `${base}-${counter}`
}
