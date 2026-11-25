'use client'

import { useEffect, useId, useRef, useState, type ReactNode } from 'react'
import { X } from 'lucide-react'
import { cn } from './cn'

interface DialogProps {
  open: boolean
  onClose: () => void
  title: ReactNode
  description?: ReactNode
  children: ReactNode
  footer?: ReactNode
  footerClassName?: string
  size?: 'sm' | 'md' | 'lg'
  /** Coloured header band (e.g. member profile). */
  header?: ReactNode
  /** Prevent closing via Esc/backdrop while a request is in flight. */
  busy?: boolean
}

/**
 * Accessible modal built on the native <dialog> element: focus is trapped and
 * restored by the browser, Esc closes, the page behind is inert. Renders as a
 * bottom sheet on phones and a centred card on tablet/desktop.
 */
export function Dialog({ open, onClose, title, description, children, footer, footerClassName, size = 'md', header, busy }: DialogProps) {
  const ref = useRef<HTMLDialogElement>(null)
  const titleId = useId()
  const descId = useId()
  const touchStartY = useRef<number | null>(null)
  const [dragY, setDragY] = useState(0)

  useEffect(() => {
    if (!open) setDragY(0)
  }, [open])

  useEffect(() => {
    const el = ref.current
    if (!el) return
    if (open && !el.open) {
      el.showModal()
      document.documentElement.style.overflow = 'hidden'
    } else if (!open && el.open) {
      el.close()
    }
    return () => {
      document.documentElement.style.overflow = ''
    }
  }, [open])

  return (
    <dialog
      ref={ref}
      aria-labelledby={titleId}
      aria-describedby={description ? descId : undefined}
      onCancel={(e) => {
        e.preventDefault()
        if (!busy) onClose()
      }}
      onClose={() => {
        document.documentElement.style.overflow = ''
      }}
      onClick={(e) => {
        if (e.target === ref.current && !busy) onClose()
      }}
      className={cn(
        'm-0 mt-auto w-full max-w-none bg-transparent p-0 text-ink backdrop:bg-transparent',
        'sm:m-auto sm:w-[calc(100%-2rem)]',
        size === 'sm' && 'sm:max-w-md',
        size === 'md' && 'sm:max-w-lg',
        size === 'lg' && 'sm:max-w-2xl',
      )}
    >
      {open && (
        <div
          style={dragY > 0 ? { transform: `translateY(${dragY}px)` } : undefined}
          onTouchStart={(e) => {
            if (busy) return
            touchStartY.current = e.touches[0].clientY
          }}
          onTouchMove={(e) => {
            if (touchStartY.current === null || busy) return
            const delta = e.touches[0].clientY - touchStartY.current
            if (delta > 0) setDragY(delta)
          }}
          onTouchEnd={() => {
            if (dragY > 90 && !busy) {
              setDragY(0)
              onClose()
            } else {
              setDragY(0)
            }
            touchStartY.current = null
          }}
          className="flex max-h-[92dvh] flex-col overflow-hidden rounded-t-[var(--radius-panel)] bg-surface shadow-raised transition-transform duration-150 sm:rounded-[var(--radius-panel)]"
        >
          {/* Apple iOS Bottom Sheet Grabber Handle (mobile only) */}
          <div className="flex justify-center pt-2 sm:hidden" aria-hidden="true">
            <span className="h-1 w-10 rounded-full bg-black/15" />
          </div>
          {header ?? (
            <div className="flex items-start justify-between gap-4 border-b border-line px-5 pb-4 pt-5 sm:px-6">
              <div className="min-w-0 space-y-1">
                <h2 id={titleId} className="text-section font-bold text-navy">
                  {title}
                </h2>
                {description && (
                  <p id={descId} className="text-label text-muted">
                    {description}
                  </p>
                )}
              </div>
              <button
                type="button"
                onClick={onClose}
                disabled={busy}
                className="-m-1.5 grid size-10 shrink-0 place-items-center rounded-full text-muted hover:bg-navy/5 hover:text-navy"
                aria-label="Close"
              >
                <X className="size-5" aria-hidden="true" />
              </button>
            </div>
          )}
          {header && (
            <span id={titleId} className="sr-only">
              {title}
            </span>
          )}
          <div className="flex-1 overflow-y-auto overscroll-contain px-5 py-5 sm:px-6">{children}</div>
          {footer && (
            <div
              className={cn(
                'safe-bottom flex flex-col-reverse gap-2 border-t border-line bg-subtle px-5 pt-3 sm:flex-row sm:justify-end sm:px-6 sm:pb-3',
                footerClassName,
              )}
            >
              {footer}
            </div>
          )}
        </div>
      )}
    </dialog>
  )
}
