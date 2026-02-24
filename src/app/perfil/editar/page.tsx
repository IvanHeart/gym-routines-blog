import type { Metadata } from 'next'
import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { ProfileEditForm } from '@/components/profile/profile-edit-form'

export const dynamic = 'force-dynamic'

export const metadata: Metadata = {
  title: 'Editar perfil',
}

export default async function EditarPerfilPage() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) redirect('/login?returnUrl=/perfil/editar')

  const { data: profile } = await supabase
    .from('profiles')
    .select('id, username, full_name, bio, avatar_url, role')
    .eq('id', user.id)
    .single()

  if (!profile) redirect('/login')

  return (
    <div className="container mx-auto max-w-lg px-4 py-10">
      <div className="mb-8">
        <h1 className="text-2xl font-bold">Editar perfil</h1>
        <p className="text-sm text-muted-foreground mt-1">@{profile.username}</p>
      </div>
      <ProfileEditForm profile={profile} />
    </div>
  )
}
