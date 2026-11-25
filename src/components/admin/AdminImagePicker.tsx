'use client'

import { Image as ImageIcon, Link as LinkIcon, RefreshCw, Trash2, UploadCloud } from 'lucide-react'
import { useRef, useState } from 'react'
import { Button } from '@/components/ui/Button'
import { cn } from '@/components/ui/cn'

interface Props {
  value: string | null
  onChange: (url: string | null) => void
  label?: string
  aspect?: 'video' | 'banner' | 'square'
  helperText?: string
}

export function AdminImagePicker({
  value,
  onChange,
  label = 'Image',
  aspect = 'video',
  helperText = 'Upload a photo (JPG, PNG, WebP) or provide an HTTPS image link.',
}: Props) {
  const [tab, setTab] = useState<'upload' | 'url'>('upload')
  const [urlInput, setUrlInput] = useState(value && !value.startsWith('data:') ? value : '')
  const [optimizing, setOptimizing] = useState(false)
  const [dragOver, setDragOver] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const processFile = (file: File) => {
    setError(null)
    if (!file.type.startsWith('image/')) {
      setError('Please select an image file (JPG, PNG, WebP, or GIF).')
      return
    }

    setOptimizing(true)
    const reader = new FileReader()
    reader.onerror = () => {
      setError('Failed to read image file.')
      setOptimizing(false)
    }
    reader.onload = (e) => {
      const img = new Image()
      img.onerror = () => {
        setError('Failed to process image file.')
        setOptimizing(false)
      }
      img.onload = () => {
        try {
          const canvas = document.createElement('canvas')
          let { width: w, height: h } = img
          const maxDim = 1280
          if (w > maxDim || h > maxDim) {
            if (w > h) {
              h = Math.round((h * maxDim) / w)
              w = maxDim
            } else {
              w = Math.round((w * maxDim) / h)
              h = maxDim
            }
          }
          canvas.width = w
          canvas.height = h
          const ctx = canvas.getContext('2d')
          if (!ctx) {
            setError('Canvas context unavailable.')
            setOptimizing(false)
            return
          }
          ctx.drawImage(img, 0, 0, w, h)
          // Try webp first, fallback to jpeg
          let dataUrl = ''
          try {
            dataUrl = canvas.toDataURL('image/webp', 0.85)
            if (!dataUrl.startsWith('data:image/webp')) {
              dataUrl = canvas.toDataURL('image/jpeg', 0.85)
            }
          } catch {
            dataUrl = canvas.toDataURL('image/jpeg', 0.85)
          }

          onChange(dataUrl)
        } catch {
          setError('Failed to compress image.')
        } finally {
          setOptimizing(false)
        }
      }
      img.src = e.target?.result as string
    }
    reader.readAsDataURL(file)
  }

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault()
    setDragOver(false)
    const file = e.dataTransfer.files?.[0]
    if (file) processFile(file)
  }

  const handleApplyUrl = () => {
    const trimmed = urlInput.trim()
    if (!trimmed) {
      onChange(null)
      return
    }
    if (!/^https?:\/\/\S+/i.test(trimmed)) {
      setError('URL must start with https://')
      return
    }
    setError(null)
    onChange(trimmed)
  }

  const handleClear = () => {
    onChange(null)
    setUrlInput('')
    setError(null)
    if (fileInputRef.current) fileInputRef.current.value = ''
  }

  const isDataUrl = value?.startsWith('data:')
  const aspectClass =
    aspect === 'banner' ? 'aspect-[21/9]' : aspect === 'square' ? 'aspect-square' : 'aspect-[16/9]'

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <label className="text-[13px] font-semibold text-navy">{label}</label>
        {value && (
          <span className="text-[11px] font-semibold text-muted">
            {isDataUrl ? 'Uploaded file' : 'Remote link'}
          </span>
        )}
      </div>

      {value ? (
        <div className="relative overflow-hidden rounded-2xl border border-black/[0.08] bg-[#0B224E]/5">
          <div className={cn('relative w-full overflow-hidden bg-navy/10', aspectClass)}>
            <img src={value} alt="Preview" className="size-full object-cover" />
            <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-black/20" />
            <div className="absolute top-2.5 right-2.5 flex items-center gap-1.5">
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="inline-flex items-center gap-1 rounded-full bg-white/90 px-2.5 py-1 text-[11px] font-bold text-navy shadow-sm backdrop-blur hover:bg-white active:scale-95"
              >
                <RefreshCw className="size-3" />
                Change
              </button>
              <button
                type="button"
                onClick={handleClear}
                className="grid size-7 place-items-center rounded-full bg-white/90 text-danger shadow-sm backdrop-blur hover:bg-white active:scale-95"
                title="Remove image"
              >
                <Trash2 className="size-3.5" />
              </button>
            </div>
          </div>
          <input
            ref={fileInputRef}
            type="file"
            accept="image/jpeg,image/png,image/webp,image/gif"
            className="sr-only"
            onChange={(e) => {
              const f = e.target.files?.[0]
              if (f) processFile(f)
            }}
          />
        </div>
      ) : (
        <div className="space-y-2.5">
          {/* Mode Switcher */}
          <div className="inline-flex rounded-xl bg-black/[0.04] p-0.5 text-[12px] font-semibold">
            <button
              type="button"
              onClick={() => {
                setTab('upload')
                setError(null)
              }}
              className={cn(
                'flex items-center gap-1.5 rounded-lg px-3 py-1 transition-colors',
                tab === 'upload' ? 'bg-white text-navy shadow-sm' : 'text-muted hover:text-navy',
              )}
            >
              <UploadCloud className="size-3.5" />
              Upload Image
            </button>
            <button
              type="button"
              onClick={() => {
                setTab('url')
                setError(null)
              }}
              className={cn(
                'flex items-center gap-1.5 rounded-lg px-3 py-1 transition-colors',
                tab === 'url' ? 'bg-white text-navy shadow-sm' : 'text-muted hover:text-navy',
              )}
            >
              <LinkIcon className="size-3.5" />
              Image URL
            </button>
          </div>

          {tab === 'upload' ? (
            <div
              onDragOver={(e) => {
                e.preventDefault()
                setDragOver(true)
              }}
              onDragLeave={() => setDragOver(false)}
              onDrop={handleDrop}
              onClick={() => fileInputRef.current?.click()}
              className={cn(
                'flex cursor-pointer flex-col items-center justify-center rounded-2xl border-2 border-dashed p-6 text-center transition-all',
                dragOver
                  ? 'border-[#007AFF] bg-[#007AFF]/5 ring-4 ring-[#007AFF]/10'
                  : 'border-black/10 bg-black/[0.015] hover:border-black/20 hover:bg-black/[0.03]',
              )}
            >
              <input
                ref={fileInputRef}
                type="file"
                accept="image/jpeg,image/png,image/webp,image/gif"
                className="sr-only"
                onChange={(e) => {
                  const f = e.target.files?.[0]
                  if (f) processFile(f)
                }}
              />
              <div className="grid size-10 place-items-center rounded-full bg-white shadow-sm ring-1 ring-black/5">
                <ImageIcon className="size-5 text-[#007AFF]" />
              </div>
              <p className="mt-2.5 text-[13px] font-semibold text-navy">
                {optimizing ? 'Optimising image…' : 'Click to upload or drag & drop'}
              </p>
              <p className="mt-0.5 text-[11.5px] text-muted">JPG, PNG, WebP or GIF (compressed automatically)</p>
            </div>
          ) : (
            <div className="flex gap-2">
              <input
                type="url"
                value={urlInput}
                onChange={(e) => setUrlInput(e.target.value)}
                placeholder="https://images.unsplash.com/…"
                className="h-10 flex-1 rounded-xl border border-line bg-surface px-3 text-[13.5px] text-ink placeholder:text-muted/60 focus:border-[#007AFF] focus:outline-none focus:ring-2 focus:ring-[#007AFF]/15"
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault()
                    handleApplyUrl()
                  }
                }}
              />
              <Button type="button" size="sm" variant="secondary" onClick={handleApplyUrl}>
                Apply
              </Button>
            </div>
          )}

          {error && <p className="text-[12px] font-semibold text-danger">{error}</p>}
          <p className="text-[11.5px] text-muted">{helperText}</p>
        </div>
      )}
    </div>
  )
}
