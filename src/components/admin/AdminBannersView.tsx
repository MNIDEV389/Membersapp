'use client'

import { ArrowUpRight, Image as ImageIcon, Plus, Trash2 } from 'lucide-react'
import { useState } from 'react'
import { BANNER_CATEGORIES } from '@/lib/constants'
import { api, ApiError } from '@/lib/client-api'
import { StatusPill } from '@/components/ui/Badges'
import { Button } from '@/components/ui/Button'
import { Dialog } from '@/components/ui/Dialog'
import { Field, Input, Select } from '@/components/ui/Field'
import { useToast } from '@/components/ui/Toast'
import { AdminImagePicker } from './AdminImagePicker'

export interface AdminBannerRow {
  id: number
  title: string
  subtitle: string
  category: string
  actionLabel: string
  actionLink: string | null
  imageUrl: string | null
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
    category: BANNER_CATEGORIES[0] as string,
    imageUrl: null as string | null,
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
      const res = await api<{ ok: boolean; banner: AdminBannerRow }>('/api/admin/banners', {
        body: {
          title: form.title.trim(),
          subtitle: form.subtitle.trim(),
          category: form.category.trim(),
          imageUrl: form.imageUrl || undefined,
          actionLabel: form.actionLabel.trim() || 'Learn more',
          actionLink: form.actionLink?.trim() || undefined,
        },
      })
      setBanners((prev) => [
        {
          ...res.banner,
          imageUrl: form.imageUrl,
        },
        ...prev,
      ])
      toast('Banner created and added to carousel!')
      setOpen(false)
      setForm({
        title: '',
        subtitle: '',
        category: BANNER_CATEGORIES[0],
        imageUrl: null,
        actionLabel: 'Explore',
        actionLink: '/meetups',
      })
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
          <p className="text-label text-muted">Manage the top promotional carousel visible on the member Home feed.</p>
        </div>
        <Button onClick={() => setOpen(true)} icon={<Plus className="size-4" />}>
          Add Banner
        </Button>
      </header>

      {banners.length === 0 ? (
        <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-black/10 bg-surface p-12 text-center">
          <div className="grid size-12 place-items-center rounded-full bg-navy/5 text-navy">
            <ImageIcon className="size-6 text-muted" />
          </div>
          <h3 className="mt-3 text-[16px] font-bold text-navy">No banners created yet</h3>
          <p className="mt-1 text-label text-muted">Add carousel slides to highlight events, opportunities, or rewards.</p>
          <Button className="mt-4" onClick={() => setOpen(true)} icon={<Plus className="size-4" />}>
            Add Banner
          </Button>
        </div>
      ) : (
        <div className="space-y-3">
          {banners.map((b) => (
            <div
              key={b.id}
              className="overflow-hidden rounded-2xl border border-black/[0.06] bg-surface p-4 shadow-sm transition-all hover:border-black/10"
            >
              <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                {/* Banner visual preview card */}
                <div className="flex min-w-0 flex-1 items-center gap-4">
                  <div className="relative h-20 w-32 shrink-0 overflow-hidden rounded-xl bg-[#0B224E] sm:h-24 sm:w-40">
                    {b.imageUrl ? (
                      <img src={b.imageUrl} alt="" className="size-full object-cover" />
                    ) : (
                      <div className="flex size-full items-center justify-center bg-navy/15 text-muted">
                        <ImageIcon className="size-6 opacity-40" />
                      </div>
                    )}
                    <div className="absolute inset-0 bg-gradient-to-t from-navy/90 via-navy/40 to-transparent" />
                    <span className="absolute bottom-2 left-2 truncate text-[10px] font-bold uppercase tracking-wider text-white/90">
                      {b.category}
                    </span>
                  </div>

                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      <StatusPill tone={b.isActive ? 'success' : 'neutral'}>{b.isActive ? 'Active' : 'Paused'}</StatusPill>
                      <StatusPill tone="brand">{b.category}</StatusPill>
                      {b.actionLink && (
                        <span className="hidden items-center gap-1 text-[11px] font-medium text-muted sm:inline-flex">
                          <ArrowUpRight className="size-3" />
                          {b.actionLink}
                        </span>
                      )}
                    </div>
                    <h2 className="mt-1.5 text-[15.5px] font-bold text-navy">{b.title}</h2>
                    <p className="line-clamp-1 text-label text-muted">{b.subtitle}</p>
                    <div className="mt-1 flex items-center gap-2 text-caption text-muted">
                      <span>Action button: &ldquo;{b.actionLabel}&rdquo;</span>
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-2 shrink-0 self-end sm:self-center">
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
            </div>
          ))}
        </div>
      )}

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
        <div className="space-y-4">
          <Field label="Banner Title">
            <Input value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} placeholder="e.g. November Annual Meetup" />
          </Field>
          <Field label="Subtitle">
            <Input
              value={form.subtitle}
              onChange={(e) => setForm({ ...form, subtitle: e.target.value })}
              placeholder="e.g. Join 400+ founders at The Leela Palace, Bengaluru"
            />
          </Field>

          <AdminImagePicker
            label="Banner Background Image (Upload or URL)"
            value={form.imageUrl}
            onChange={(url) => setForm({ ...form, imageUrl: url })}
            aspect="banner"
            helperText="Upload a crisp landscape photo or enter an image link. Overlay and gradients are applied automatically."
          />

          <div className="grid gap-3 sm:grid-cols-2">
            <Field label="Category / Tag">
              <Select
                value={form.category}
                onChange={(e) => setForm({ ...form, category: e.target.value })}
              >
                {BANNER_CATEGORIES.map((cat) => (
                  <option key={cat} value={cat}>
                    {cat}
                  </option>
                ))}
              </Select>
            </Field>
            <Field label="Action Label">
              <Input value={form.actionLabel} onChange={(e) => setForm({ ...form, actionLabel: e.target.value })} placeholder="e.g. Explore, RSVP" />
            </Field>
          </div>
          <Field label="Action Link" optional>
            <Input
              value={form.actionLink}
              onChange={(e) => setForm({ ...form, actionLink: e.target.value })}
              placeholder="e.g. /meetups, /rewards, or https://..."
            />
          </Field>
        </div>
      </Dialog>
    </div>
  )
}
