'use client'

import { Plus, Trash2 } from 'lucide-react'
import { useState } from 'react'
import { api, ApiError } from '@/lib/client-api'
import { StatusPill } from '@/components/ui/Badges'
import { Button } from '@/components/ui/Button'
import { Dialog } from '@/components/ui/Dialog'
import { Field, Input } from '@/components/ui/Field'
import { useToast } from '@/components/ui/Toast'

export interface AdminBannerRow {
  id: number
  title: string
  subtitle: string
  category: string
  actionLabel: string
  actionLink: string | null
  sortOrder: number
  isActive: boolean
}

export function AdminBannersView({ initialBanners }: { initialBanners: AdminBannerRow[] }) {
  const toast = useToast()
  const [banners, setBanners] = useState<AdminBannerRow[]>(initialBanners)
  const [open, setOpen] = useState(false)
  const [saving, setSaving] = useState(false)
  const [form, setForm] = useState({
    title: '',
    subtitle: '',
    category: 'Spotlight',
    actionLabel: 'Explore',
    actionLink: '/meetups',
  })

  const createBanner = async () => {
    if (!form.title.trim() || !form.subtitle.trim()) {
      toast('Enter banner title and subtitle', 'error')
      return
    }
    setSaving(true)
    try {
      const res = await api<{ ok: boolean; banner: AdminBannerRow }>('/api/admin/banners', { body: form })
      setBanners((prev) => [res.banner, ...prev])
      toast('Banner created!')
      setOpen(false)
      setForm({ title: '', subtitle: '', category: 'Spotlight', actionLabel: 'Explore', actionLink: '/meetups' })
    } catch (err) {
      toast((err as ApiError).message || 'Failed to create banner', 'error')
    } finally {
      setSaving(false)
    }
  }

  const toggleActive = async (b: AdminBannerRow) => {
    try {
      await api('/api/admin/banners', { method: 'PATCH', body: { id: b.id, isActive: !b.isActive } })
      setBanners((prev) => prev.map((x) => (x.id === b.id ? { ...x, isActive: !b.isActive } : x)))
      toast(b.isActive ? 'Banner paused' : 'Banner activated')
    } catch (err) {
      toast((err as ApiError).message || 'Failed', 'error')
    }
  }

  const removeBanner = async (id: number) => {
    try {
      await api('/api/admin/banners', { method: 'DELETE', body: { id } })
      setBanners((prev) => prev.filter((x) => x.id !== id))
      toast('Banner deleted')
    } catch (err) {
      toast((err as ApiError).message || 'Failed', 'error')
    }
  }

  return (
    <div className="space-y-6">
      <header className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-[24px] font-bold tracking-tight text-navy">Home Banners ({banners.length})</h1>
          <p className="text-label text-muted">Manage the top carousel banners visible on the member Home feed.</p>
        </div>
        <Button onClick={() => setOpen(true)} icon={<Plus className="size-4" />}>
          Add Banner
        </Button>
      </header>

      <div className="space-y-3">
        {banners.map((b) => (
          <div key={b.id} className="flex flex-wrap items-center justify-between gap-4 rounded-2xl border border-black/[0.06] bg-surface p-4 shadow-sm">
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-2">
                <StatusPill tone={b.isActive ? 'success' : 'neutral'}>{b.isActive ? 'Active' : 'Paused'}</StatusPill>
                <StatusPill tone="brand">{b.category}</StatusPill>
              </div>
              <h2 className="mt-2 text-[15.5px] font-bold text-navy">{b.title}</h2>
              <p className="text-label text-muted">{b.subtitle}</p>
            </div>
            <div className="flex items-center gap-2">
              <Button size="sm" variant="secondary" onClick={() => toggleActive(b)}>
                {b.isActive ? 'Pause' : 'Activate'}
              </Button>
              <button
                type="button"
                onClick={() => removeBanner(b.id)}
                className="grid size-8 place-items-center rounded-full text-danger hover:bg-danger-bg"
                aria-label="Delete banner"
              >
                <Trash2 className="size-4" />
              </button>
            </div>
          </div>
        ))}
      </div>

      <Dialog
        open={open}
        onClose={() => setOpen(false)}
        busy={saving}
        title="Create Carousel Banner"
        footer={
          <>
            <Button variant="ghost" onClick={() => setOpen(false)} disabled={saving}>
              Cancel
            </Button>
            <Button onClick={createBanner} loading={saving}>
              Save Banner
            </Button>
          </>
        }
      >
        <div className="space-y-3">
          <Field label="Title">
            <Input value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} />
          </Field>
          <Field label="Subtitle">
            <Input value={form.subtitle} onChange={(e) => setForm({ ...form, subtitle: e.target.value })} />
          </Field>
          <div className="grid gap-3 sm:grid-cols-2">
            <Field label="Tag / Category">
              <Input value={form.category} onChange={(e) => setForm({ ...form, category: e.target.value })} />
            </Field>
            <Field label="Action Label">
              <Input value={form.actionLabel} onChange={(e) => setForm({ ...form, actionLabel: e.target.value })} />
            </Field>
          </div>
          <Field label="Action Link (optional)" optional>
            <Input value={form.actionLink} onChange={(e) => setForm({ ...form, actionLink: e.target.value })} />
          </Field>
        </div>
      </Dialog>
    </div>
  )
}
