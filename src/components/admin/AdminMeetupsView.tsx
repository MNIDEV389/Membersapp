'use client'

import { MapPin, Pencil, Plus, Trash2, Trophy, Users, Video } from 'lucide-react'
import { useState } from 'react'
import { api, ApiError } from '@/lib/client-api'
import { formatDate } from '@/lib/format'
import type { CelebrationVM, MeetupVM } from '@/lib/view-models'
import { Button } from '@/components/ui/Button'
import { Dialog } from '@/components/ui/Dialog'
import { Field, Input, Select, Textarea } from '@/components/ui/Field'
import { useToast } from '@/components/ui/Toast'

export function AdminMeetupsView({
  initialMeetups,
  initialCelebrations,
}: {
  initialMeetups: MeetupVM[]
  initialCelebrations: CelebrationVM[]
}) {
  const toast = useToast()
  const [meetups, setMeetups] = useState<MeetupVM[]>(initialMeetups)
  const [celebrations, setCelebrations] = useState<CelebrationVM[]>(initialCelebrations)
  const [createOpen, setCreateOpen] = useState(false)
  const [editMeetup, setEditMeetup] = useState<MeetupVM | null>(null)
  const [saving, setSaving] = useState(false)

  // Create form
  const [form, setForm] = useState({
    title: '',
    description: '',
    mode: 'Online' as 'Online' | 'NCR',
    venue: 'Google Meet (link shared upon RSVP)',
    startsAt: new Date(Date.now() + 5 * 86400000).toISOString().slice(0, 16),
    hostName: 'MNI Admin',
  })

  // Edit form
  const [editForm, setEditForm] = useState({
    title: '',
    description: '',
    mode: 'Online' as 'Online' | 'NCR',
    venue: '',
    startsAt: '',
    hostName: 'MNI Admin',
  })

  const createMeetup = async () => {
    if (!form.title.trim() || !form.venue.trim()) {
      toast('Enter title and venue/link', 'error')
      return
    }
    setSaving(true)
    try {
      const res = await api<{
        ok: boolean
        meetup: { id: number; title: string; description: string | null; city: string; venue: string; starts_at: string; host_name: string }
      }>('/api/admin/meetups', { body: form })
      const m = res.meetup
      setMeetups((prev) => [
        {
          id: m.id,
          title: m.title,
          description: m.description,
          city: m.city,
          venue: m.venue,
          startsAt: new Date(m.starts_at).toISOString(),
          hostName: m.host_name,
          isGoing: false,
          attendeesCount: 0,
          attendees: [],
        },
        ...prev,
      ])
      toast('MNI Organised Meetup created!')
      setCreateOpen(false)
    } catch (err) {
      toast((err as ApiError).message || 'Failed to create meetup', 'error')
    } finally {
      setSaving(false)
    }
  }

  const openEdit = (m: MeetupVM) => {
    setEditMeetup(m)
    setEditForm({
      title: m.title,
      description: m.description ?? '',
      mode: (m.city === 'NCR' ? 'NCR' : 'Online') as 'Online' | 'NCR',
      venue: m.venue,
      startsAt: m.startsAt ? new Date(m.startsAt).toISOString().slice(0, 16) : '',
      hostName: m.hostName ?? 'MNI Admin',
    })
  }

  const saveEdit = async () => {
    if (!editMeetup) return
    if (!editForm.title.trim() || !editForm.venue.trim()) {
      toast('Enter title and venue/link', 'error')
      return
    }
    setSaving(true)
    try {
      const res = await api<{
        ok: boolean
        meetup: { id: number; title: string; description: string | null; city: string; venue: string; starts_at: string; host_name: string }
      }>('/api/admin/meetups', {
        method: 'PATCH',
        body: {
          id: Number(editMeetup.id),
          ...editForm,
        },
      })
      const updated = res.meetup
      setMeetups((prev) =>
        prev.map((x) =>
          Number(x.id) === Number(editMeetup.id)
            ? {
                ...x,
                title: updated.title,
                description: updated.description,
                city: updated.city,
                venue: updated.venue,
                startsAt: new Date(updated.starts_at).toISOString(),
                hostName: updated.host_name,
              }
            : x,
        ),
      )
      toast('Meetup updated successfully!')
      setEditMeetup(null)
    } catch (err) {
      toast((err as ApiError).message || 'Failed to update meetup', 'error')
    } finally {
      setSaving(false)
    }
  }

  const removeItem = async (type: 'meetup' | 'celebration', id: number) => {
    try {
      await api('/api/admin/meetups', { method: 'DELETE', body: { type, id } })
      if (type === 'meetup') setMeetups((prev) => prev.filter((x) => Number(x.id) !== id))
      else setCelebrations((prev) => prev.filter((x) => Number(x.id) !== id))
      toast(type === 'meetup' ? 'Meetup deleted' : 'Celebration removed')
    } catch (err) {
      toast((err as ApiError).message || 'Failed to delete', 'error')
    }
  }

  return (
    <div className="space-y-8">
      <section className="space-y-4">
        <header className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <h1 className="text-[24px] font-bold tracking-tight text-navy">MNI Organised Meetups</h1>
            <p className="text-label text-muted">Create, edit and manage Online (Google Meet) or NCR events and inspect RSVPs.</p>
          </div>
          <Button onClick={() => setCreateOpen(true)} icon={<Plus className="size-4" />}>
            Create Meetup
          </Button>
        </header>

        <div className="space-y-3">
          {meetups.map((m) => (
            <div key={m.id} className="rounded-2xl border border-black/[0.06] bg-surface p-4 shadow-sm transition-all hover:border-black/10">
              <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                <div>
                  <span className="inline-flex items-center gap-1 rounded-full bg-pale px-2.5 py-0.5 text-[11px] font-bold text-brand-strong">
                    {m.city === 'Online' ? <Video className="size-3" /> : <MapPin className="size-3" />}
                    MNI Organised · {m.city}
                  </span>
                  <h2 className="mt-2 text-[15.5px] font-bold text-navy">{m.title}</h2>
                  {m.description && <p className="mt-1 text-label text-muted line-clamp-2">{m.description}</p>}
                  <p className="mt-1 text-caption font-medium text-muted">
                    {m.venue} · {formatDate(m.startsAt)}
                  </p>
                  <p className="mt-1 inline-flex items-center gap-1 text-caption font-semibold text-navy">
                    <Users className="size-3.5 text-brand" />
                    {m.attendeesCount} going
                    {m.attendees.length > 0 && ` (${m.attendees.map((a) => a.fullName).join(', ')})`}
                  </p>
                </div>

                <div className="flex items-center gap-2 shrink-0 self-end sm:self-start">
                  <Button
                    size="sm"
                    variant="secondary"
                    onClick={() => openEdit(m)}
                    icon={<Pencil className="size-3.5" />}
                  >
                    Edit
                  </Button>
                  <button
                    type="button"
                    onClick={() => removeItem('meetup', Number(m.id))}
                    className="grid size-8 place-items-center rounded-full text-danger hover:bg-danger-bg"
                    aria-label="Delete meetup"
                    title="Delete meetup"
                  >
                    <Trash2 className="size-4" />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      </section>

      <section className="space-y-4">
        <div>
          <h2 className="text-section font-bold text-navy">Closed Business Celebrations ({celebrations.length})</h2>
          <p className="text-label text-muted">Moderate member-posted business wins.</p>
        </div>
        <div className="space-y-3">
          {celebrations.map((c) => (
            <div key={c.id} className="flex items-start justify-between gap-3 rounded-2xl border border-[#FDE68A] bg-[#FFFDF7] p-4 shadow-sm">
              <div>
                <p className="flex items-center gap-1.5 text-label font-bold text-navy">
                  <Trophy className="size-4 text-[#D97706]" />
                  {c.fromMember.fullName} → {c.toMember.fullName} ({c.amountLabel})
                </p>
                <p className="mt-1 text-label text-ink/90">{c.story}</p>
                <p className="mt-1 text-caption text-muted">
                  {formatDate(c.createdAt)} · 👏 {c.clapsCount} claps
                </p>
              </div>
              <button
                type="button"
                onClick={() => removeItem('celebration', Number(c.id))}
                className="grid size-8 place-items-center rounded-full text-danger hover:bg-danger-bg"
                aria-label="Remove celebration"
                title="Remove celebration"
              >
                <Trash2 className="size-4" />
              </button>
            </div>
          ))}
        </div>
      </section>

      {/* Create Meetup Modal */}
      <Dialog
        open={createOpen}
        onClose={() => setCreateOpen(false)}
        busy={saving}
        title="Create MNI Meetup"
        footer={
          <>
            <Button variant="ghost" onClick={() => setCreateOpen(false)} disabled={saving}>
              Cancel
            </Button>
            <Button onClick={createMeetup} loading={saving}>
              Publish Meetup
            </Button>
          </>
        }
      >
        <div className="space-y-3">
          <Field label="Meetup title">
            <Input value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} placeholder="e.g. Founders & Scaleup Mixer" />
          </Field>
          <div className="grid gap-3 sm:grid-cols-2">
            <Field label="Mode / Location">
              <Select value={form.mode} onChange={(e) => setForm({ ...form, mode: e.target.value as 'Online' | 'NCR' })}>
                <option value="Online">Online (Google Meet)</option>
                <option value="NCR">Delhi-NCR (In-person)</option>
              </Select>
            </Field>
            <Field label="Date &amp; Time">
              <Input
                type="datetime-local"
                value={form.startsAt}
                onChange={(e) => setForm({ ...form, startsAt: e.target.value })}
              />
            </Field>
          </div>
          <Field label="Venue or Meet link">
            <Input
              value={form.venue}
              onChange={(e) => setForm({ ...form, venue: e.target.value })}
              placeholder={form.mode === 'Online' ? 'Google Meet link (shared upon RSVP)' : 'Hotel / Club / Office address'}
            />
          </Field>
          <Field label="Host / Coordinator">
            <Input value={form.hostName} onChange={(e) => setForm({ ...form, hostName: e.target.value })} />
          </Field>
          <Field label="Description (optional)" optional>
            <Textarea
              rows={3}
              value={form.description}
              onChange={(e) => setForm({ ...form, description: e.target.value })}
              placeholder="What will happen, agenda, dress code, attendee expectations…"
            />
          </Field>
        </div>
      </Dialog>

      {/* Edit Meetup Modal */}
      <Dialog
        open={Boolean(editMeetup)}
        onClose={() => setEditMeetup(null)}
        busy={saving}
        title="Edit MNI Meetup"
        footer={
          <>
            <Button variant="ghost" onClick={() => setEditMeetup(null)} disabled={saving}>
              Cancel
            </Button>
            <Button onClick={saveEdit} loading={saving}>
              Save Changes
            </Button>
          </>
        }
      >
        <div className="space-y-3">
          <Field label="Meetup title">
            <Input value={editForm.title} onChange={(e) => setEditForm({ ...editForm, title: e.target.value })} />
          </Field>
          <div className="grid gap-3 sm:grid-cols-2">
            <Field label="Mode / Location">
              <Select value={editForm.mode} onChange={(e) => setEditForm({ ...editForm, mode: e.target.value as 'Online' | 'NCR' })}>
                <option value="Online">Online (Google Meet)</option>
                <option value="NCR">Delhi-NCR (In-person)</option>
              </Select>
            </Field>
            <Field label="Date &amp; Time">
              <Input
                type="datetime-local"
                value={editForm.startsAt}
                onChange={(e) => setEditForm({ ...editForm, startsAt: e.target.value })}
              />
            </Field>
          </div>
          <Field label="Venue or Meet link">
            <Input
              value={editForm.venue}
              onChange={(e) => setEditForm({ ...editForm, venue: e.target.value })}
              placeholder={editForm.mode === 'Online' ? 'Google Meet link' : 'Physical address'}
            />
          </Field>
          <Field label="Host / Coordinator">
            <Input value={editForm.hostName} onChange={(e) => setEditForm({ ...editForm, hostName: e.target.value })} />
          </Field>
          <Field label="Description (optional)" optional>
            <Textarea
              rows={3}
              value={editForm.description}
              onChange={(e) => setEditForm({ ...editForm, description: e.target.value })}
            />
          </Field>
        </div>
      </Dialog>
    </div>
  )
}
