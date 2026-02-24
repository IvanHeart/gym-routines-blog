'use server'

import { createClient } from '@/lib/supabase/server'

export async function incrementRoutineViews(routineId: string): Promise<void> {
  const supabase = await createClient()
  await supabase.rpc('increment_routine_views', { routine_id: routineId })
}
