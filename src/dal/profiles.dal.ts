import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import type { Profile } from '@/types/entities'

export async function getProfileByUsername(username: string): Promise<Profile | null> {
  const supabase = await createClient()
  const { data } = await supabase
    .from('profiles')
    .select('id, username, full_name, avatar_url, bio, role, created_at')
    .eq('username', username)
    .single()

  return data
}

export async function getAllUsernames(): Promise<string[]> {
  // Uses admin client so it works in generateStaticParams (no request context)
  const supabase = createAdminClient()
  const { data } = await supabase.from('profiles').select('username').not('username', 'is', null)
  return (data ?? []).map((p) => p.username).filter(Boolean)
}
