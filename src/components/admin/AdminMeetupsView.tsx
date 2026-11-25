'use client'

import { MapPin, Plus, Trash2, Trophy, Users, Video } from 'lucide-react'
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
  const [saving, setSaving] = useState(false)
  const [form, setForm] = useState({
    title: '',
    description: '',
    mode: 'Online' as 'Online' | 'NCR',
    venue: 'Google Meet (link shared upon RSVP)',
    startsAt: new Date(Date.now() + 5 * 86400000).toISOString().slice(0, 16),
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
            <p className="text-label text-muted">Create Online (Google Meet) or NCR events and inspect RSVPs.</p>
          </div>
          <Button onClick={() => setCreateOpen(true)} icon={<Plus className="size-4" />}>
            Create Meetup
          </Button>
        </header>

        <div className="space-y-3">
          {meetups.map((m) => (
            <div key={m.id} className="rounded-2xl border border-black/[0.06] bg-surface p-4 shadow-sm">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <span className="inline-flex items-center gap-1 rounded-full bg-pale px-2.5 py-0.5 text-[11px] font-bold text-brand-strong">
                    {m.city === 'Online' ? <Video className="size-3" /> : <MapPin className="size-3" />}
                    MNI Organised · {m.city}
                  </span>
                  <h2 className="mt-2 text-[15.5px] font-bold text-navy">{m.title}</h2>
                  <p className="text-caption text-muted">
                    {m.venue} · {formatDate(m.startsAt)}
                  </p>
                  <p className="mt-1 inline-flex items-center gap-1 text-caption font-semibold text-navy">
                    <Users className="size-3.5 text-brand" />
                    {m.attendeesCount} going
                    {m.attendees.length > 0 && ` (${m.attendees.map((a) => a.fullName).join(', ')})`}
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => removeItem('meetup', Number(m.id))}
                  className="grid size-8 place-items-center rounded-full text-danger hover:bg-danger-bg"
                  aria-label="Delete meetup"
                >
                  <Trash2 className="size-4" />
                </button>
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
                <p className="mt-1 text-caption text-muted">👏 {c.clapsCount} claps</p>
              </div>
              <button
                type="button"
                onClick={() => removeItem('celebration', Number(c.id))}
                className="grid size-8 shrink-0 place-items-center rounded-full text-danger hover:bg-danger-bg"
                aria-label="Remove celebration"
              >
                <Trash2 className="size-4" />
              </button>
            </div>
          ))}
        </div>
      </section>

      <Dialog
        open={createOpen}
        onClose={() => setCreateOpen(false)}
        busy={saving}
        title="Create MNI Organised Meetup"
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
          <Field label="Event Title">
            <Input value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} />
          </Field>
          <div className="grid gap-3 sm:grid-cols-2">
            <Field label="Format">
              <Select
                value={form.mode}
                onChange={(e) => {
                  const mode = e.target.value as 'Online' | 'NCR'
                  setForm({
                    ...form,
                    mode,
                    venue: mode === 'Online' ? 'Google Meet (link shared upon RSVP)' : 'New Delhi / NCR',
                  })
                }}
              >
                <option value="Online">Online (Google Meet)</option>
                <option value="NCR">In-Person (Delhi-NCR)</option>
              </Select>
            </Field>
            <Field label="Date & Time">
              <Input type="datetime-local" value={form.startsAt} onChange={(e) => setForm({ ...form, startsAt: e.target.value })} />
            </Field>
          </div>
          <Field label="Venue or Meet Link">
            <Input value={form.venue} onChange={(e) => setForm({ ...form, venue: e.target.value })} />
          </Field>
          <Field label="Description">
            <Textarea rows={3} value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} />
          </Field>
        </div>
      </Dialog>
    </div>
  )
}
