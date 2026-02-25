'use client'

import {
  forwardRef,
  useCallback,
  useEffect,
  useImperativeHandle,
  useLayoutEffect,
  useRef,
  useState,
} from 'react'
import { ImagePlus, Move, X } from 'lucide-react'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { validateImageFile } from '@/lib/utils/image-client'

export interface ImageCropPickerHandle {
  getCroppedFile: () => Promise<File | null>
  hasImage: () => boolean
}

interface ImageCropPickerProps {
  className?: string
}

export const ImageCropPicker = forwardRef<ImageCropPickerHandle, ImageCropPickerProps>(
  function ImageCropPicker(_props, ref) {
    const [src, setSrc] = useState<string | null>(null)
    const [isDragging, setIsDragging] = useState(false)

    // All values read during render are stored as state (react-hooks/refs v7)
    const [pos, setPos] = useState({ x: 0, y: 0 })
    const [nat, setNat] = useState({ w: 0, h: 0 })
    const [cSize, setCSize] = useState({ w: 0, h: 0 })

    const containerRef = useRef<HTMLDivElement>(null)
    const inputRef = useRef<HTMLInputElement>(null)
    const dragRef = useRef({ active: false, mx: 0, my: 0, ox: 0, oy: 0 })

    // Computed render values — derived from state, not refs
    const scale = cSize.w && nat.w ? Math.max(cSize.w / nat.w, cSize.h / nat.h) : 0
    const rendW = scale ? nat.w * scale : 0
    const rendH = scale ? nat.h * scale : 0

    // Crop the visible area via Canvas and return a JPEG File
    const cropAndExport = useCallback(async (): Promise<File | null> => {
      if (!src || !nat.w || !cSize.w) return null
      const sc = Math.max(cSize.w / nat.w, cSize.h / nat.h)
      const cropX = -pos.x / sc
      const cropY = -pos.y / sc
      const cropW = cSize.w / sc
      const cropH = cSize.h / sc
      const OUT_W = 1200
      const OUT_H = 675
      const canvas = document.createElement('canvas')
      canvas.width = OUT_W
      canvas.height = OUT_H
      const ctx = canvas.getContext('2d')
      if (!ctx) return null
      await new Promise<void>((resolve, reject) => {
        const htmlImg = new window.Image()
        htmlImg.onload = () => {
          ctx.drawImage(htmlImg, cropX, cropY, cropW, cropH, 0, 0, OUT_W, OUT_H)
          resolve()
        }
        htmlImg.onerror = () => reject(new Error('Error al cargar imagen'))
        htmlImg.src = src
      })
      return new Promise((resolve) => {
        canvas.toBlob(
          (blob) => resolve(blob ? new File([blob], 'cover.jpg', { type: 'image/jpeg' }) : null),
          'image/jpeg',
          0.92
        )
      })
    }, [src, nat, cSize, pos])

    useImperativeHandle(
      ref,
      () => ({
        getCroppedFile: cropAndExport,
        hasImage: () => src !== null,
      }),
      [cropAndExport, src]
    )

    // Apply drag movement — reads only dragRef (mutable ref, fine in callback)
    const applyDrag = useCallback(
      (clientX: number, clientY: number) => {
        if (!dragRef.current.active) return
        const newX = dragRef.current.ox + clientX - dragRef.current.mx
        const newY = dragRef.current.oy + clientY - dragRef.current.my
        setPos({
          x: Math.max(cSize.w - rendW, Math.min(0, newX)),
          y: Math.max(cSize.h - rendH, Math.min(0, newY)),
        })
      },
      [cSize.w, cSize.h, rendW, rendH]
    )

    // Keep applyDrag always current for the non-passive touch listener
    const applyDragRef = useRef(applyDrag)
    useLayoutEffect(() => {
      applyDragRef.current = applyDrag
    })

    // Non-passive touchmove: needed so e.preventDefault() prevents page scroll
    useEffect(() => {
      const el = containerRef.current
      if (!el || !src) return
      const handler = (e: TouchEvent) => {
        if (!dragRef.current.active) return
        e.preventDefault()
        const t = e.touches[0]
        if (!t) return
        applyDragRef.current(t.clientX, t.clientY)
      }
      el.addEventListener('touchmove', handler, { passive: false })
      return () => el.removeEventListener('touchmove', handler)
    }, [src])

    function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
      const file = e.target.files?.[0]
      if (!file) return
      const v = validateImageFile(file)
      if (!v.valid) {
        toast.error(v.error)
        return
      }
      if (src) URL.revokeObjectURL(src)
      setNat({ w: 0, h: 0 })
      setPos({ x: 0, y: 0 })
      setSrc(URL.createObjectURL(file))
    }

    function handleImgLoad(e: React.SyntheticEvent<HTMLImageElement>) {
      const img = e.currentTarget
      const natW = img.naturalWidth
      const natH = img.naturalHeight
      // Reading containerRef.current is fine in an event handler
      const el = containerRef.current
      if (!el) return
      const cW = el.clientWidth
      const cH = el.clientHeight
      const sc = Math.max(cW / natW, cH / natH)
      setNat({ w: natW, h: natH })
      setCSize({ w: cW, h: cH })
      // Center the image inside the container
      setPos({ x: (cW - natW * sc) / 2, y: (cH - natH * sc) / 2 })
    }

    function handleRemove() {
      if (src) URL.revokeObjectURL(src)
      setSrc(null)
      setNat({ w: 0, h: 0 })
      setPos({ x: 0, y: 0 })
      setCSize({ w: 0, h: 0 })
      // Reading inputRef.current is fine in an event handler
      if (inputRef.current) inputRef.current.value = ''
    }

    return (
      <>
        <input
          ref={inputRef}
          type="file"
          accept="image/jpeg,image/png,image/webp"
          onChange={handleFileChange}
          className="hidden"
          aria-label="Subir imagen de portada"
        />

        {!src ? (
          // Drop zone
          <button
            type="button"
            onClick={() => inputRef.current?.click()}
            className="flex w-full flex-col items-center justify-center gap-2 rounded-lg border-2 border-dashed border-border text-muted-foreground transition-colors hover:border-primary/50 hover:text-foreground"
            style={{ aspectRatio: '16/9', maxHeight: '280px' }}
          >
            <ImagePlus className="h-8 w-8" />
            <span className="text-sm">Subir imagen (JPEG, PNG, WebP · máx. 5MB)</span>
          </button>
        ) : (
          // Drag-to-reposition container
          <div
            ref={containerRef}
            className={`relative w-full overflow-hidden rounded-lg border border-border select-none ${
              isDragging ? 'cursor-grabbing' : 'cursor-grab'
            }`}
            style={{ aspectRatio: '16/9', maxHeight: '280px' }}
            onMouseDown={(e) => {
              e.preventDefault()
              dragRef.current = {
                active: true,
                mx: e.clientX,
                my: e.clientY,
                ox: pos.x,
                oy: pos.y,
              }
              setIsDragging(true)
            }}
            onMouseMove={(e) => applyDrag(e.clientX, e.clientY)}
            onMouseUp={() => {
              dragRef.current.active = false
              setIsDragging(false)
            }}
            onMouseLeave={() => {
              dragRef.current.active = false
              setIsDragging(false)
            }}
            onTouchStart={(e) => {
              const t = e.touches[0]
              if (!t) return
              dragRef.current = {
                active: true,
                mx: t.clientX,
                my: t.clientY,
                ox: pos.x,
                oy: pos.y,
              }
              setIsDragging(true)
            }}
            onTouchEnd={() => {
              dragRef.current.active = false
              setIsDragging(false)
            }}
          >
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={src}
              alt="Vista previa"
              onLoad={handleImgLoad}
              draggable={false}
              style={{
                position: 'absolute',
                width: rendW || '100%',
                height: rendH || 'auto',
                left: pos.x,
                top: pos.y,
                maxWidth: 'none',
                pointerEvents: 'none',
                userSelect: 'none',
              }}
            />

            {/* Hint — only show once image is positioned */}
            {rendW > 0 && (
              <div className="absolute bottom-2 left-2 flex items-center gap-1.5 rounded-md bg-black/60 px-2 py-1 text-xs text-white pointer-events-none">
                <Move className="h-3 w-3 shrink-0" />
                Arrastra para reencuadrar
              </div>
            )}

            {/* Remove button */}
            <Button
              type="button"
              variant="secondary"
              size="icon"
              onClick={(e) => {
                e.stopPropagation()
                handleRemove()
              }}
              className="absolute right-2 top-2 h-7 w-7 z-10"
              aria-label="Eliminar imagen"
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
        )}
      </>
    )
  }
)
