'use client'

import { useRef, useState, useTransition } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { toast } from 'sonner'
import Image from 'next/image'
import { Camera } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { profileSchema, type ProfileFormValues } from '@/lib/validations/profile'
import { validateImageFile } from '@/lib/utils/image-client'
import { updateProfileAction } from '@/actions/profile.actions'

interface Profile {
  id: string
  username: string
  full_name: string | null
  bio: string | null
  avatar_url: string | null
}

export function ProfileEditForm({ profile }: { profile: Profile }) {
  const [isPending, startTransition] = useTransition()
  const [serverError, setServerError] = useState<string | null>(null)
  const [avatarFile, setAvatarFile] = useState<File | null>(null)
  const [avatarPreview, setAvatarPreview] = useState<string | null>(profile.avatar_url)
  const avatarInputRef = useRef<HTMLInputElement>(null)

  const form = useForm<ProfileFormValues>({
    resolver: zodResolver(profileSchema),
    defaultValues: {
      full_name: profile.full_name ?? '',
      bio: profile.bio ?? '',
    },
  })

  function handleAvatarChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return
    const validation = validateImageFile(file)
    if (!validation.valid) {
      toast.error(validation.error)
      return
    }
    setAvatarFile(file)
    setAvatarPreview(URL.createObjectURL(file))
  }

  async function handleSubmit(values: ProfileFormValues) {
    setServerError(null)
    const fd = new FormData()
    fd.append('full_name', values.full_name ?? '')
    fd.append('bio', values.bio ?? '')
    if (avatarFile) fd.append('avatar', avatarFile)

    startTransition(async () => {
      const result = await updateProfileAction(null, fd)
      if (result.success) {
        toast.success('Perfil actualizado')
      } else {
        setServerError(result.error)
      }
    })
  }

  const initial = profile.username[0]?.toUpperCase() ?? 'U'

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-6" noValidate>
        {serverError && (
          <Alert variant="destructive">
            <AlertDescription>{serverError}</AlertDescription>
          </Alert>
        )}

        {/* Avatar */}
        <div className="flex items-center gap-4">
          <div className="relative">
            <Avatar className="h-20 w-20">
              <AvatarImage src={avatarPreview ?? undefined} alt={profile.username} />
              <AvatarFallback className="bg-primary/20 text-primary text-2xl">
                {initial}
              </AvatarFallback>
            </Avatar>
            <button
              type="button"
              onClick={() => avatarInputRef.current?.click()}
              className="absolute bottom-0 right-0 rounded-full bg-primary p-1.5 text-primary-foreground transition-opacity hover:opacity-90"
              aria-label="Cambiar foto de perfil"
            >
              <Camera className="h-3.5 w-3.5" />
            </button>
          </div>
          <div>
            <p className="text-sm font-medium">@{profile.username}</p>
            <p className="text-xs text-muted-foreground">JPEG, PNG o WebP · máx. 2MB</p>
          </div>
          <input
            ref={avatarInputRef}
            type="file"
            accept="image/jpeg,image/png,image/webp"
            onChange={handleAvatarChange}
            className="hidden"
            aria-label="Subir foto de perfil"
          />
        </div>

        {/* Nombre completo */}
        <FormField
          control={form.control}
          name="full_name"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Nombre completo</FormLabel>
              <FormControl>
                <Input placeholder="Tu nombre" {...field} value={field.value ?? ''} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        {/* Bio */}
        <FormField
          control={form.control}
          name="bio"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Sobre ti</FormLabel>
              <FormControl>
                <Textarea
                  placeholder="Cuéntanos algo sobre ti y tu entrenamiento..."
                  rows={4}
                  {...field}
                  value={field.value ?? ''}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        {/* Preview avatar si se seleccionó */}
        {avatarFile && avatarPreview && (
          <div className="rounded-lg border border-border/50 p-3">
            <p className="text-xs text-muted-foreground mb-2">Vista previa del avatar:</p>
            <Image
              src={avatarPreview}
              alt="Vista previa"
              width={80}
              height={80}
              className="rounded-full object-cover"
            />
          </div>
        )}

        <Button type="submit" disabled={isPending} className="w-full">
          {isPending ? 'Guardando...' : 'Guardar cambios'}
        </Button>
      </form>
    </Form>
  )
}
