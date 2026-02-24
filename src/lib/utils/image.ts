import sharp from 'sharp'

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

export async function validateMimeFromBuffer(buffer: Buffer): Promise<boolean> {
  // Verificar magic bytes reales (no confiar solo en el Content-Type del cliente)
  const metadata = await sharp(buffer).metadata()
  const allowed = ['jpeg', 'png', 'webp']
  return allowed.includes(metadata.format ?? '')
}

export async function processRoutineImage(buffer: Buffer): Promise<Buffer> {
  return sharp(buffer)
    .resize(1200, 800, { fit: 'cover', withoutEnlargement: true })
    .webp({ quality: 85 })
    .toBuffer()
}
