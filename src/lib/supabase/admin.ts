import { createClient } from '@supabase/supabase-js'
import type { Database } from '@/types/database.types'

// Cliente admin con service_role — SOLO para Server Actions y scripts
// Nunca exponer en Client Components
export function createAdminClient() {
  return createClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
    }
  )
}
