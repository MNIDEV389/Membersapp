'use client'

import { CheckCircle2, Coins, Plus, Search, ShieldAlert, Star, UserCheck, XCircle } from 'lucide-react'
import { useMemo, useState } from 'react'
import { api, ApiError } from '@/lib/client-api'
import { Avatar, TierBadge, VerifiedMark } from '@/components/ui/Badges'
import { Button } from '@/components/ui/Button'
import { Dialog } from '@/components/ui/Dialog'
import { Field, Input, Select } from '@/components/ui/Field'
import { useToast } from '@/components/ui/Toast'
import { cn } from '@/components/ui/cn'
import { AdminImagePicker } from './AdminImagePicker'

export interface AdminMemberRow {
  id: number
  fullName: string
  email: string
  phone: string
  city: string
  businessName: string
  businessCategory: string
  memberId: string
  tier: 'freemium' | 'premium'
  isVerified: boolean
  accountStatus: 'active' | 'suspended'
  avatarInitials: string
  avatarUrl: string | null
  mniCoins: number
  referralCount: number
}

export function AdminMembersView({ initialMembers }: { initialMembers: AdminMemberRow[] }) {
  const toast = useToast()
  const [members, setMembers] = useState<AdminMemberRow[]>(initialMembers)
  const [query, setQuery] = useState('')
  const [tierFilter, setTierFilter] = useState<'all' | 'freemium' | 'premium'>('all')
  const [createOpen, setCreateOpen] = useState(false)
  const [editMember, setEditMember] = useState<AdminMemberRow | null>(null)
  const [busyId, setBusyId] = useState<number | null>(null)
  const [saving, setSaving] = useState(false)

  // New member form
  const [form, setForm] = useState({
    fullName: '',
    email: '',
    phone: '',
    city: 'Delhi-NCR',
    businessName: '',
    businessCategory: 'Technology & SaaS',
    tier: 'freemium' as 'freemium' | 'premium',
    avatarUrl: null as string | null,
    password: 'Member@MNI2026!',
  })

  // Edit / Password reset form
  const [editForm, setEditForm] = useState({
    fullName: '',
    phone: '',
    city: '',
    businessName: '',
    businessCategory: '',
    tier: 'freemium' as 'freemium' | 'premium',
    avatarUrl: null as string | null,
    newPassword: '',
  })

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase()
    return members.filter((m) => {
      if (tierFilter !== 'all' && m.tier !== tierFilter) return false
      if (!q) return true
      return (
        m.fullName.toLowerCase().includes(q) ||
        m.email.toLowerCase().includes(q) ||
        m.businessName.toLowerCase().includes(q) ||
        m.memberId.toLowerCase().includes(q) ||
        m.city.toLowerCase().includes(q)
      )
    })
  }, [members, query, tierFilter])

  const quickPatch = async (id: number, patch: Partial<AdminMemberRow>, msg: string) => {
    setBusyId(id)
    try {
      await api('/api/admin/members', { method: 'PATCH', body: { id, ...patch } })
      setMembers((prev) => prev.map((m) => (m.id === id ? { ...m, ...patch } : m)))
      toast(msg)
    } catch (err) {
      toast((err as ApiError).message || 'Update failed', 'error')
    } finally {
      setBusyId(null)
    }
  }

  const createMember = async () => {
    setSaving(true)
    try {
      const res = await api<{ ok: boolean; member: AdminMemberRow }>('/api/admin/members', {
        body: {
          ...form,
          avatarUrl: form.avatarUrl || undefined,
        },
      })
      const created = {
        ...res.member,
        avatarInitials: res.member.avatarInitials || form.fullName.slice(0, 2).toUpperCase(),
        avatarUrl: form.avatarUrl,
      }
      setMembers((prev) => [created, ...prev])
      toast(`${form.fullName} onboarded!`)
      setCreateOpen(false)
      setForm({
        fullName: '',
        email: '',
        phone: '',
        city: 'Delhi-NCR',
        businessName: '',
        businessCategory: 'Technology & SaaS',
        tier: 'freemium',
        avatarUrl: null,
        password: 'Member@MNI2026!',
      })
    } catch (err) {
      toast((err as ApiError).message || 'Failed to onboard member', 'error')
    } finally {
      setSaving(false)
    }
  }

  const openEdit = (m: AdminMemberRow) => {
    setEditMember(m)
    setEditForm({
      fullName: m.fullName,
      phone: m.phone,
      city: m.city,
      businessName: m.businessName,
      businessCategory: m.businessCategory,
      tier: m.tier,
      avatarUrl: m.avatarUrl,
      newPassword: '',
    })
  }

  const saveEdit = async () => {
    if (!editMember) return
    setSaving(true)
    try {
      const payload: Record<string, unknown> = {
        id: editMember.id,
        fullName: editForm.fullName,
        phone: editForm.phone,
        city: editForm.city,
        businessName: editForm.businessName,
        businessCategory: editForm.businessCategory,
        tier: editForm.tier,
        avatarUrl: editForm.avatarUrl,
      }
      if (editForm.newPassword.trim()) payload.password = editForm.newPassword.trim()

      await api('/api/admin/members', { method: 'PATCH', body: payload })
      setMembers((prev) =>
        prev.map((m) =>
          m.id === editMember.id
            ? {
                ...m,
                fullName: editForm.fullName,
                phone: editForm.phone,
                city: editForm.city,
                businessName: editForm.businessName,
                businessCategory: editForm.businessCategory,
                tier: editForm.tier,
                avatarUrl: editForm.avatarUrl,
              }
            : m,
        ),
      )
      toast('Member updated!')
      setEditMember(null)
    } catch (err) {
      toast((err as ApiError).message || 'Failed to update member', 'error')
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="space-y-6">
      <header className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-[24px] font-bold tracking-tight text-navy">Members ({members.length})</h1>
          <p className="text-label text-muted">Onboard members, manage Freemium/Premium plans, and verify accounts.</p>
        </div>
        <Button onClick={() => setCreateOpen(true)} icon={<Plus className="size-4" />}>
          Onboard Member
        </Button>
      </header>

      {/* Filters */}
      <div className="flex flex-wrap items-center gap-3">
        <div className="relative min-w-[240px] flex-1">
          <Search className="pointer-events-none absolute left-3.5 top-3 size-4 text-muted" />
          <input
            type="search"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search name, email, company, ID, city…"
            className="h-10 w-full rounded-xl border border-line bg-surface pl-10 pr-4 text-label text-navy outline-none focus:border-brand"
          />
        </div>
        <div className="flex gap-1 rounded-xl bg-[#E9EDF4] p-1">
          {(['all', 'premium', 'freemium'] as const).map((t) => (
            <button
              key={t}
              type="button"
              onClick={() => setTierFilter(t)}
              className={cn(
                'h-8 rounded-lg px-3 text-[12px] font-semibold capitalize transition-colors',
                tierFilter === t ? 'bg-white text-navy shadow-sm' : 'text-muted hover:text-navy',
              )}
            >
              {t}
            </button>
          ))}
        </div>
      </div>

      {/* Members List */}
      <div className="space-y-3">
        {filtered.map((m) => (
          <div
            key={m.id}
            className={cn(
              'flex flex-col justify-between gap-4 rounded-2xl border bg-surface p-4 shadow-sm sm:flex-row sm:items-center',
              m.accountStatus === 'suspended' ? 'border-danger/30 bg-danger-bg/20' : 'border-black/[0.06]',
            )}
          >
            <div className="flex items-start gap-3.5 min-w-0">
              <Avatar initials={m.avatarInitials} src={m.avatarUrl} size="md" />
              <div className="min-w-0">
                <div className="flex flex-wrap items-center gap-1.5">
                  <p className="truncate text-[15px] font-bold text-navy">{m.fullName}</p>
                  {m.isVerified && <VerifiedMark />}
                  <TierBadge tier={m.tier} />
                  {m.accountStatus === 'suspended' && (
                    <span className="rounded-full bg-danger-bg px-2 py-0.5 text-[10.5px] font-bold text-danger">
                      Suspended
                    </span>
                  )}
                </div>
                <p className="truncate text-label font-medium text-[#1C1C1E]/85">
                  {m.businessName} · {m.businessCategory}
                </p>
                <p className="mt-0.5 flex flex-wrap items-center gap-x-3 gap-y-0.5 text-caption text-muted">
                  <span>{m.email}</span>
                  <span>{m.phone}</span>
                  <span>{m.city}</span>
                  <span className="font-mono font-semibold text-navy">{m.memberId}</span>
                  <span className="inline-flex items-center gap-1 font-semibold text-navy">
                    <Coins className="size-3 text-coin" />
                    {m.mniCoins}
                  </span>
                </p>
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-2 shrink-0">
              <button
                type="button"
                disabled={busyId === m.id}
                onClick={() =>
                  quickPatch(
                    m.id,
                    { tier: m.tier === 'premium' ? 'freemium' : 'premium' },
                    `Plan updated to ${m.tier === 'premium' ? 'Freemium' : 'Premium'}`,
                  )
                }
                className={cn(
                  'inline-flex h-8 items-center gap-1 rounded-full px-3 text-[12px] font-semibold transition-colors',
                  m.tier === 'premium'
                    ? 'bg-amber-100 text-amber-900 hover:bg-amber-200'
                    : 'bg-subtle text-navy hover:bg-pale',
                )}
              >
                <Star className="size-3.5" />
                {m.tier === 'premium' ? 'Set Freemium' : 'Upgrade Premium'}
              </button>

              <button
                type="button"
                disabled={busyId === m.id}
                onClick={() =>
                  quickPatch(
                    m.id,
                    { isVerified: !m.isVerified },
                    m.isVerified ? 'Verification removed' : 'Member verified',
                  )
                }
                className="inline-flex h-8 items-center gap-1 rounded-full bg-subtle px-3 text-[12px] font-semibold text-navy hover:bg-pale"
              >
                {m.isVerified ? <CheckCircle2 className="size-3.5 text-success" /> : <UserCheck className="size-3.5" />}
                {m.isVerified ? 'Verified' : 'Verify'}
              </button>

              <button
                type="button"
                disabled={busyId === m.id}
                onClick={() =>
                  quickPatch(
                    m.id,
                    { accountStatus: m.accountStatus === 'active' ? 'suspended' : 'active' },
                    m.accountStatus === 'active' ? 'Member suspended' : 'Member reactivated',
                  )
                }
                className={cn(
                  'inline-flex h-8 items-center gap-1 rounded-full px-3 text-[12px] font-semibold',
                  m.accountStatus === 'active'
                    ? 'bg-danger-bg/60 text-danger hover:bg-danger-bg'
                    : 'bg-success-bg text-success',
                )}
              >
                {m.accountStatus === 'active' ? <ShieldAlert className="size-3.5" /> : <XCircle className="size-3.5" />}
                {m.accountStatus === 'active' ? 'Suspend' : 'Activate'}
              </button>

              <Button size="sm" variant="secondary" onClick={() => openEdit(m)}>
                Edit
              </Button>
            </div>
          </div>
        ))}
      </div>

      {/* Create Member Modal */}
      <Dialog
        open={createOpen}
        onClose={() => setCreateOpen(false)}
        busy={saving}
        title="Onboard New MNI Member"
        footer={
          <>
            <Button variant="ghost" onClick={() => setCreateOpen(false)} disabled={saving}>
              Cancel
            </Button>
            <Button onClick={createMember} loading={saving}>
              Create Member
            </Button>
          </>
        }
      >
        <div className="grid gap-3 sm:grid-cols-2">
          <Field label="Full name">
            <Input value={form.fullName} onChange={(e) => setForm({ ...form, fullName: e.target.value })} />
          </Field>
          <Field label="Email">
            <Input type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} />
          </Field>
          <Field label="Phone">
            <Input value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} />
          </Field>
          <Field label="City">
            <Input value={form.city} onChange={(e) => setForm({ ...form, city: e.target.value })} />
          </Field>
          <Field label="Business name">
            <Input value={form.businessName} onChange={(e) => setForm({ ...form, businessName: e.target.value })} />
          </Field>
          <Field label="Business category">
            <Input value={form.businessCategory} onChange={(e) => setForm({ ...form, businessCategory: e.target.value })} />
          </Field>
          <Field label="Plan Tier">
            <Select value={form.tier} onChange={(e) => setForm({ ...form, tier: e.target.value as 'freemium' | 'premium' })}>
              <option value="freemium">Freemium</option>
              <option value="premium">Premium</option>
            </Select>
          </Field>
          <Field label="Initial password">
            <Input value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} />
          </Field>
          <div className="sm:col-span-2">
            <AdminImagePicker
              label="Profile Photo / Avatar (optional)"
              value={form.avatarUrl}
              onChange={(url) => setForm({ ...form, avatarUrl: url })}
              aspect="square"
              helperText="Upload member portrait photo (JPG, PNG, WebP) or provide an HTTPS link."
            />
          </div>
        </div>
      </Dialog>

      {/* Edit Member Modal */}
      <Dialog
        open={Boolean(editMember)}
        onClose={() => setEditMember(null)}
        busy={saving}
        title={`Edit · ${editMember?.fullName ?? ''}`}
        footer={
          <>
            <Button variant="ghost" onClick={() => setEditMember(null)} disabled={saving}>
              Cancel
            </Button>
            <Button onClick={saveEdit} loading={saving}>
              Save Changes
            </Button>
          </>
        }
      >
        <div className="grid gap-3 sm:grid-cols-2">
          <div className="sm:col-span-2">
            <AdminImagePicker
              label="Profile Photo / Avatar"
              value={editForm.avatarUrl}
              onChange={(url) => setEditForm({ ...editForm, avatarUrl: url })}
              aspect="square"
              helperText="Update or remove member profile picture. It updates their avatar across the entire directory, timeline, and digital card."
            />
          </div>
          <Field label="Full name">
            <Input value={editForm.fullName} onChange={(e) => setEditForm({ ...editForm, fullName: e.target.value })} />
          </Field>
          <Field label="Phone">
            <Input value={editForm.phone} onChange={(e) => setEditForm({ ...editForm, phone: e.target.value })} />
          </Field>
          <Field label="City">
            <Input value={editForm.city} onChange={(e) => setEditForm({ ...editForm, city: e.target.value })} />
          </Field>
          <Field label="Business name">
            <Input value={editForm.businessName} onChange={(e) => setEditForm({ ...editForm, businessName: e.target.value })} />
          </Field>
          <Field label="Business category">
            <Input value={editForm.businessCategory} onChange={(e) => setEditForm({ ...editForm, businessCategory: e.target.value })} />
          </Field>
          <Field label="Plan Tier">
            <Select value={editForm.tier} onChange={(e) => setEditForm({ ...editForm, tier: e.target.value as 'freemium' | 'premium' })}>
              <option value="freemium">Freemium</option>
              <option value="premium">Premium</option>
            </Select>
          </Field>
          <div className="sm:col-span-2">
            <Field label="Reset password (leave blank to keep current)" optional>
              <Input
                type="password"
                value={editForm.newPassword}
                onChange={(e) => setEditForm({ ...editForm, newPassword: e.target.value })}
                placeholder="Min 8 characters"
              />
            </Field>
          </div>
        </div>
      </Dialog>
    </div>
  )
}
