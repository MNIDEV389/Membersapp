'use client'

import { X } from 'lucide-react'
import { useEffect, useRef } from 'react'
import type { ImageVM } from '@/lib/view-models'

/** Full-screen lightbox for timeline creatives. */
export function ImageViewer({ image, title, onClose }: { image: ImageVM | null; title?: string; onClose: () => void }) {
  const ref = useRef<HTMLDialogElement>(null)
  useEffect(() => {
    const el = ref.current
    if (!el) return
    if (image && !el.open) el.showModal()
    if (!image && el.open) el.close()
  }, [image])

  return (
    <dialog
      ref={ref}
      aria-label={title ? `Image: ${title}` : 'Image'}
      onCancel={(e) => {
        e.preventDefault()
        onClose()
      }}
      onClick={(e) => e.target === ref.current && onClose()}
      className="m-0 h-dvh max-h-none w-screen max-w-none bg-[#050b18]/95 p-0 backdrop:bg-transparent"
    >
      {image && (
        <div className="flex h-full flex-col" onClick={(e) => e.target === e.currentTarget && onClose()}>
          <div className="flex items-center justify-between gap-4 px-4 pb-2 pt-[max(env(safe-area-inset-top),0.75rem)] text-white">
            <p className="truncate text-label font-semibold">{title}</p>
            <button type="button" onClick={onClose} className="grid size-11 place-items-center rounded-full bg-white/10 hover:bg-white/20" aria-label="Close image">
              <X className="size-5" aria-hidden="true" />
            </button>
          </div>
          <div className="flex min-h-0 flex-1 items-center justify-center p-4" onClick={(e) => e.target === e.currentTarget && onClose()}>
            <img src={image.url} alt={image.alt || title || ''} className="max-h-full max-w-full rounded-2xl object-contain" />
          </div>
        </div>
      )}
    </dialog>
  )
}
