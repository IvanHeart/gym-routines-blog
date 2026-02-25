import 'server-only'
import sharp from 'sharp'

const ALLOWED_MIME_TYPES = ['jpeg', 'png', 'webp']

export async function validateMimeFromBuffer(buffer: Buffer): Promise<boolean> {
  // Verificar magic bytes reales (no confiar solo en el Content-Type del cliente)
  const metadata = await sharp(buffer).metadata()
  return ALLOWED_MIME_TYPES.includes(metadata.format ?? '')
}

export async function processRoutineImage(buffer: Buffer): Promise<Buffer> {
  return sharp(buffer)
    .resize(1200, 800, { fit: 'cover', withoutEnlargement: true })
    .webp({ quality: 85 })
    .toBuffer()
}

export async function processAvatarImage(buffer: Buffer): Promise<Buffer> {
  return sharp(buffer).resize(200, 200, { fit: 'cover' }).webp({ quality: 85 }).toBuffer()
}
