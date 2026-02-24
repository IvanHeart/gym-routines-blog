// Tipos de dominio — se completarán en Sprint 2 con los tipos generados de Supabase

export type Difficulty = 'beginner' | 'intermediate' | 'advanced'

export type UserRole = 'user' | 'admin'

export interface Profile {
  id: string
  username: string
  full_name: string | null
  avatar_url: string | null
  bio: string | null
  role: UserRole
  created_at: string
}

export interface Category {
  id: string
  name: string
  slug: string
  color: string
  created_at: string
}

export interface Routine {
  id: string
  title: string
  slug: string
  excerpt: string | null
  content: string
  cover_image_url: string | null
  difficulty: Difficulty
  duration_minutes: number | null
  published: boolean
  views: number
  author_id: string
  category_id: string | null
  deleted_at: string | null
  created_at: string
  updated_at: string
  // Relaciones (opcionales, dependen del join)
  author?: Pick<Profile, 'id' | 'username' | 'avatar_url'>
  category?: Pick<Category, 'id' | 'name' | 'slug' | 'color'>
  exercises?: Exercise[]
  favorites_count?: number
  is_favorited?: boolean
}

export interface Exercise {
  id: string
  routine_id: string
  name: string
  sets: number | null
  reps: string | null
  rest_seconds: number | null
  notes: string | null
  order_index: number
}

export interface Comment {
  id: string
  routine_id: string
  author_id: string
  content: string
  deleted_at: string | null
  created_at: string
  author?: Pick<Profile, 'id' | 'username' | 'avatar_url'>
}

export interface Favorite {
  id: string
  user_id: string
  routine_id: string
  created_at: string
}
