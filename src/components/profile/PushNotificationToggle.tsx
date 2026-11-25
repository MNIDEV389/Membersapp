'use client'

import { Bell, BellOff } from 'lucide-react'
import { useEffect, useState } from 'react'
import { api } from '@/lib/client-api'
import { useToast } from '../ui/Toast'
import { cn } from '../ui/cn'

export function PushNotificationToggle() {
  const toast = useToast()
  const [enabled, setEnabled] = useState(false)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    api<{ enabled: boolean }>('/api/app/push')
      .then((res) => setEnabled(res.enabled))
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [])

  const toggle = async () => {
    const next = !enabled
    if (next && typeof window !== 'undefined' && 'Notification' in window) {
      if (Notification.permission === 'default') {
        const perm = await Notification.requestPermission()
        if (perm === 'denied') {
          toast('Browser notifications are blocked in your settings.', 'error')
          return
        }
      } else if (Notification.permission === 'denied') {
        toast('Enable notifications in browser settings first.', 'error')
        return
      }
    }

    setEnabled(next)
    try {
      await api('/api/app/push', { body: { enabled: next } })
      toast(next ? 'Push alerts enabled!' : 'Push alerts paused.')
      if (next && typeof window !== 'undefined' && 'Notification' in window && Notification.permission === 'granted') {
        new Notification('MNI Members', {
          body: 'You will now receive alerts for introductions, meetups, and celebrations.',
          icon: '/brand/mni-logo.webp',
        })
      }
    } catch {
      setEnabled(!next)
      toast('Could not save notification preference.', 'error')
    }
  }

  return (
    <div className="flex items-center justify-between gap-3 px-4 py-3.5">
      <div className="flex items-center gap-3">
        <span className="grid size-9 shrink-0 place-items-center rounded-xl bg-pale text-brand">
          {enabled ? <Bell className="size-4" /> : <BellOff className="size-4" />}
        </span>
        <div>
          <p className="text-label font-semibold text-navy">Push Notifications</p>
          <p className="text-caption text-muted">Instant alerts for intros, meetups & wins</p>
        </div>
      </div>
      <button
        type="button"
        role="switch"
        aria-checked={enabled}
        disabled={loading}
        onClick={toggle}
        className={cn(
          'relative inline-flex h-7 w-12 shrink-0 cursor-pointer items-center rounded-full transition-colors',
          enabled ? 'bg-[#34C759]' : 'bg-[#E5E7EB]',
        )}
      >
        <span
          className={cn(
            'inline-block size-5 transform rounded-full bg-white shadow transition-transform',
            enabled ? 'translate-x-6' : 'translate-x-1',
          )}
        />
      </button>
    </div>
  )
}
