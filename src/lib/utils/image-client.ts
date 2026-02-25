// Client-safe image validation — does NOT import sharp
const ALLOWED_MIME_TYPES = ['image/jpeg', 'image/png', 'image/webp']
const MAX_SIZE_BYTES = 5 * 1024 * 1024 // 5MB

export function validateImageFile(file: File): { valid: boolean; error?: string } {
  if (!ALLOWED_MIME_TYPES.includes(file.type)) {
    return { valid: false, error: 'Solo se permiten imágenes JPEG, PNG o WebP.' }
  }
  if (file.size > MAX_SIZE_BYTES) {
    return { valid: false, error: 'La imagen no puede superar 5MB.' }
  }
  return { valid: true }
}
