'use client'

import { CheckCircle2, X, XCircle } from 'lucide-react'
import { createContext, useCallback, useContext, useState, type ReactNode } from 'react'
import { cn } from './cn'

type ToastItem = { id: number; message: string; tone: 'success' | 'error' }
const ToastContext = createContext<(message: string, tone?: ToastItem['tone']) => void>(() => {})

export const useToast = () => useContext(ToastContext)

export function ToastProvider({ children }: { children: ReactNode }) {
  const [items, setItems] = useState<ToastItem[]>([])
  const dismiss = (id: number) => setItems((all) => all.filter((t) => t.id !== id))

  const push = useCallback((message: string, tone: ToastItem['tone'] = 'success') => {
    const id = Date.now() + Math.random()
    setItems((all) => [...all.slice(-2), { id, message, tone }])
    setTimeout(() => dismiss(id), 4500)
  }, [])

  return (
    <ToastContext.Provider value={push}>
      {children}
      <div
        aria-live="polite"
        className="pointer-events-none fixed inset-x-0 bottom-24 z-[60] flex flex-col items-center gap-2 px-4"
      >
        {items.map((t) => (
          <div
            key={t.id}
            role="status"
            className={cn(
              'pointer-events-auto flex w-full max-w-md animate-[sheet-up_200ms_ease-out] items-center gap-3 rounded-2xl px-4 py-3 text-label font-medium text-white shadow-raised',
              t.tone === 'success' ? 'bg-navy' : 'bg-danger',
            )}
          >
            {t.tone === 'success' ? <CheckCircle2 className="size-5 shrink-0 text-[#7fd4b8]" aria-hidden="true" /> : <XCircle className="size-5 shrink-0" aria-hidden="true" />}
            <span className="flex-1">{t.message}</span>
            <button type="button" onClick={() => dismiss(t.id)} className="-m-1 grid size-8 place-items-center rounded-full hover:bg-white/10" aria-label="Dismiss">
              <X className="size-4" aria-hidden="true" />
            </button>
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  )
}
