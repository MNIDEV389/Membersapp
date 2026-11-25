'use client'

import {
  Briefcase,
  Calendar,
  CheckCircle2,
  Clock,
  Coins,
  ExternalLink,
  Eye,
  Globe,
  Mail,
  MapPin,
  MessageCircle,
  Pencil,
  Phone,
  Plus,
  Search,
  Share2,
  Sparkles,
  Star,
  Target,
  User,
  UserCheck,
  XCircle,
} from 'lucide-react'
import { useMemo, useState } from 'react'
import { CALL_DAYS, CALL_TIME_SLOTS } from '@/lib/constants'
import { api, ApiError } from '@/lib/client-api'
import { Avatar, TierBadge, VerifiedMark } from '@/components/ui/Badges'
import { Button } from '@/components/ui/Button'
import { Dialog } from '@/components/ui/Dialog'
import { Field, Input, Select, Textarea } from '@/components/ui/Field'
import { useToast } from '@/components/ui/Toast'
import { cn } from '@/components/ui/cn'
import { AdminImagePicker } from './AdminImagePicker'

export interface AdminMemberRow {
  id: number
  fullName: string
  email: string
  phone: string
  whatsapp: string | null
  city: string
  businessName: string
  businessCategory: string
  websiteUrl: string | null
  whatWeDo: string | null
  bio: string | null
  keyProductService: string | null
  idealClient: string | null
  opportunityLookingFor: string | null
  targetConnections: string | null
  preferredCallDay: string | null
  preferredCallTime: string | null
  additionalNotes: string | null
  memberSince: string | null
  memberId: string
  tier: 'freemium' | 'premium'
  isVerified: boolean
  accountStatus: 'active' | 'suspended'
  avatarInitials: string
  avatarUrl: string | null
  mniCoins: number
  referralCount: number
}

type EditTab = 'basic' | 'business' | 'matchmaking'

export function AdminMembersView({ initialMembers }: { initialMembers: AdminMemberRow[] }) {
  const toast = useToast()
  const [members, setMembers] = useState<AdminMemberRow[]>(initialMembers)
  const [query, setQuery] = useState('')
  const [tierFilter, setTierFilter] = useState<'all' | 'freemium' | 'premium'>('all')
  const [createOpen, setCreateOpen] = useState(false)
  const [viewMember, setViewMember] = useState<AdminMemberRow | null>(null)
  const [editMember, setEditMember] = useState<AdminMemberRow | null>(null)
  const [editTab, setEditTab] = useState<EditTab>('basic')
  const [busyId, setBusyId] = useState<number | null>(null)
  const [saving, setSaving] = useState(false)

  // New member onboard form
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

  // Full Edit form covering every single member profile detail
  const [editForm, setEditForm] = useState({
    fullName: '',
    phone: '',
    whatsapp: '',
    city: '',
    businessName: '',
    businessCategory: '',
    websiteUrl: '',
    whatWeDo: '',
    keyProductService: '',
    idealClient: '',
    opportunityLookingFor: '',
    targetConnections: '',
    preferredCallDay: '',
    preferredCallTime: '',
    additionalNotes: '',
    tier: 'freemium' as 'freemium' | 'premium',
    isVerified: true,
    accountStatus: 'active' as 'active' | 'suspended',
    mniCoins: 0,
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
        m.city.toLowerCase().includes(q) ||
        m.businessCategory.toLowerCase().includes(q)
      )
    })
  }, [members, query, tierFilter])

  const quickPatch = async (id: number, patch: Partial<AdminMemberRow>, msg: string) => {
    setBusyId(id)
    try {
      await api('/api/admin/members', { method: 'PATCH', body: { id, ...patch } })
      setMembers((prev) => prev.map((m) => (m.id === id ? { ...m, ...patch } : m)))
      if (viewMember?.id === id) setViewMember((prev) => (prev ? { ...prev, ...patch } : null))
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
      const created: AdminMemberRow = {
        ...res.member,
        whatsapp: form.phone,
        websiteUrl: null,
        whatWeDo: null,
        bio: null,
        keyProductService: null,
        idealClient: null,
        opportunityLookingFor: null,
        targetConnections: null,
        preferredCallDay: null,
        preferredCallTime: null,
        additionalNotes: null,
        memberSince: 'Just now',
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
    setEditTab('basic')
    setEditForm({
      fullName: m.fullName,
      phone: m.phone,
      whatsapp: m.whatsapp ?? m.phone,
      city: m.city,
      businessName: m.businessName,
      businessCategory: m.businessCategory,
      websiteUrl: m.websiteUrl ?? '',
      whatWeDo: m.whatWeDo ?? m.bio ?? '',
      keyProductService: m.keyProductService ?? '',
      idealClient: m.idealClient ?? '',
      opportunityLookingFor: m.opportunityLookingFor ?? '',
      targetConnections: m.targetConnections ?? '',
      preferredCallDay: m.preferredCallDay ?? '',
      preferredCallTime: m.preferredCallTime ?? '',
      additionalNotes: m.additionalNotes ?? '',
      tier: m.tier,
      isVerified: m.isVerified,
      accountStatus: m.accountStatus,
      mniCoins: m.mniCoins,
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
        fullName: editForm.fullName.trim(),
        phone: editForm.phone.trim(),
        whatsapp: editForm.whatsapp.trim() || null,
        city: editForm.city.trim(),
        businessName: editForm.businessName.trim(),
        businessCategory: editForm.businessCategory.trim(),
        websiteUrl: editForm.websiteUrl.trim() || null,
        whatWeDo: editForm.whatWeDo.trim() || null,
        bio: editForm.whatWeDo.trim() || null,
        keyProductService: editForm.keyProductService.trim() || null,
        idealClient: editForm.idealClient.trim() || null,
        opportunityLookingFor: editForm.opportunityLookingFor.trim() || null,
        targetConnections: editForm.targetConnections.trim() || null,
        preferredCallDay: editForm.preferredCallDay || null,
        preferredCallTime: editForm.preferredCallTime || null,
        additionalNotes: editForm.additionalNotes.trim() || null,
        tier: editForm.tier,
        isVerified: editForm.isVerified,
        accountStatus: editForm.accountStatus,
        mniCoins: Number(editForm.mniCoins) || 0,
        avatarUrl: editForm.avatarUrl,
      }
      if (editForm.newPassword.trim()) payload.password = editForm.newPassword.trim()

      await api('/api/admin/members', { method: 'PATCH', body: payload })
      const updatedRow: AdminMemberRow = {
        ...editMember,
        fullName: editForm.fullName.trim(),
        phone: editForm.phone.trim(),
        whatsapp: editForm.whatsapp.trim() || null,
        city: editForm.city.trim(),
        businessName: editForm.businessName.trim(),
        businessCategory: editForm.businessCategory.trim(),
        websiteUrl: editForm.websiteUrl.trim() || null,
        whatWeDo: editForm.whatWeDo.trim() || null,
        bio: editForm.whatWeDo.trim() || null,
        keyProductService: editForm.keyProductService.trim() || null,
        idealClient: editForm.idealClient.trim() || null,
        opportunityLookingFor: editForm.opportunityLookingFor.trim() || null,
        targetConnections: editForm.targetConnections.trim() || null,
        preferredCallDay: editForm.preferredCallDay || null,
        preferredCallTime: editForm.preferredCallTime || null,
        additionalNotes: editForm.additionalNotes.trim() || null,
        tier: editForm.tier,
        isVerified: editForm.isVerified,
        accountStatus: editForm.accountStatus,
        mniCoins: Number(editForm.mniCoins) || 0,
        avatarUrl: editForm.avatarUrl,
      }

      setMembers((prev) => prev.map((m) => (m.id === editMember.id ? updatedRow : m)))
      if (viewMember?.id === editMember.id) setViewMember(updatedRow)
      toast('Member profile updated successfully!')
      setEditMember(null)
    } catch (err) {
      toast((err as ApiError).message || 'Failed to update member profile', 'error')
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="space-y-6">
      <header className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-[24px] font-bold tracking-tight text-navy">Members ({members.length})</h1>
          <p className="text-label text-muted">
            Manage complete member profiles, business details, deal preferences, and plan tiers.
          </p>
        </div>
        <Button onClick={() => setCreateOpen(true)} icon={<Plus className="size-4" />}>
          Onboard Member
        </Button>
      </header>

      {/* Filters & Search */}
      <div className="flex flex-wrap items-center gap-3">
        <div className="relative min-w-[240px] flex-1">
          <Search className="pointer-events-none absolute left-3.5 top-3 size-4 text-muted" />
          <input
            type="search"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search name, company, email, ID, category, city…"
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
              'flex flex-col justify-between gap-4 rounded-2xl border bg-surface p-4 shadow-sm transition-all hover:border-black/15 sm:flex-row sm:items-center',
              m.accountStatus === 'suspended' ? 'border-danger/30 bg-danger-bg/20' : 'border-black/[0.06]',
            )}
          >
            <div className="flex min-w-0 items-start gap-3.5">
              <button
                type="button"
                onClick={() => setViewMember(m)}
                className="shrink-0 transition-transform hover:scale-105 active:scale-95"
                title="View full profile"
              >
                <Avatar initials={m.avatarInitials} src={m.avatarUrl} size="md" />
              </button>
              <div className="min-w-0">
                <div className="flex flex-wrap items-center gap-1.5">
                  <button
                    type="button"
                    onClick={() => setViewMember(m)}
                    className="truncate text-left text-[15.5px] font-bold text-navy hover:text-[#007AFF] hover:underline"
                  >
                    {m.fullName}
                  </button>
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
              <Button
                size="sm"
                variant="secondary"
                onClick={() => setViewMember(m)}
                icon={<Eye className="size-3.5 text-[#007AFF]" />}
              >
                View
              </Button>

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
                {m.tier === 'premium' ? 'Freemium' : 'Upgrade'}
              </button>

              <Button
                size="sm"
                variant="primary"
                onClick={() => openEdit(m)}
                icon={<Pencil className="size-3.5" />}
              >
                Edit
              </Button>
            </div>
          </div>
        ))}
      </div>

      {/* View Full Member Profile Modal */}
      <Dialog
        open={Boolean(viewMember)}
        onClose={() => setViewMember(null)}
        title="Member Profile Details"
        footer={
          <div className="flex w-full items-center justify-between">
            <Button
              variant="secondary"
              onClick={() => {
                if (viewMember) {
                  const m = viewMember
                  setViewMember(null)
                  openEdit(m)
                }
              }}
              icon={<Pencil className="size-3.5" />}
            >
              Edit All Details
            </Button>
            <Button variant="ghost" onClick={() => setViewMember(null)}>
              Close
            </Button>
          </div>
        }
      >
        {viewMember && (
          <div className="space-y-6">
            {/* Header Card */}
            <div className="flex flex-col gap-4 rounded-2xl border border-black/[0.06] bg-[#0B224E]/5 p-4 sm:flex-row sm:items-center">
              <Avatar initials={viewMember.avatarInitials} src={viewMember.avatarUrl} size="lg" />
              <div className="min-w-0 flex-1">
                <div className="flex flex-wrap items-center gap-2">
                  <h2 className="text-[18px] font-bold text-navy">{viewMember.fullName}</h2>
                  {viewMember.isVerified && <VerifiedMark />}
                  <TierBadge tier={viewMember.tier} />
                  {viewMember.accountStatus === 'suspended' ? (
                    <span className="rounded-full bg-danger-bg px-2 py-0.5 text-[10.5px] font-bold text-danger">
                      Suspended
                    </span>
                  ) : (
                    <span className="rounded-full bg-success-bg px-2 py-0.5 text-[10.5px] font-bold text-success">
                      Active
                    </span>
                  )}
                </div>
                <p className="text-[14px] font-semibold text-navy/90">{viewMember.businessName}</p>
                <p className="text-label text-muted">{viewMember.businessCategory}</p>
                <div className="mt-2 flex flex-wrap items-center gap-3 text-caption text-muted">
                  <span className="font-mono font-bold text-navy">{viewMember.memberId}</span>
                  <span>Joined: {viewMember.memberSince || 'Active Member'}</span>
                  <span className="inline-flex items-center gap-1 font-bold text-navy">
                    <Coins className="size-3 text-coin" />
                    {viewMember.mniCoins} Coins
                  </span>
                </div>
              </div>
            </div>

            {/* Contact & Links */}
            <div className="grid gap-3 sm:grid-cols-2">
              <div className="rounded-xl border border-line bg-surface p-3 space-y-1">
                <p className="text-caption font-bold uppercase tracking-wider text-muted">Contact Info</p>
                <p className="flex items-center gap-2 text-label font-medium text-navy">
                  <Mail className="size-3.5 text-muted shrink-0" />
                  <span className="truncate">{viewMember.email}</span>
                </p>
                <p className="flex items-center gap-2 text-label font-medium text-navy">
                  <Phone className="size-3.5 text-muted shrink-0" />
                  <span>{viewMember.phone}</span>
                </p>
                {viewMember.whatsapp && (
                  <p className="flex items-center gap-2 text-label font-medium text-[#25D366]">
                    <MessageCircle className="size-3.5 shrink-0" />
                    <span>WhatsApp: {viewMember.whatsapp}</span>
                  </p>
                )}
                <p className="flex items-center gap-2 text-label font-medium text-navy">
                  <MapPin className="size-3.5 text-muted shrink-0" />
                  <span>{viewMember.city}</span>
                </p>
              </div>

              <div className="rounded-xl border border-line bg-surface p-3 space-y-1">
                <p className="text-caption font-bold uppercase tracking-wider text-muted">Company &amp; Web</p>
                {viewMember.websiteUrl ? (
                  <a
                    href={viewMember.websiteUrl.startsWith('http') ? viewMember.websiteUrl : `https://${viewMember.websiteUrl}`}
                    target="_blank"
                    rel="noreferrer"
                    className="flex items-center gap-1.5 text-label font-semibold text-[#007AFF] hover:underline"
                  >
                    <Globe className="size-3.5 shrink-0" />
                    <span className="truncate">{viewMember.websiteUrl}</span>
                    <ExternalLink className="size-3 shrink-0" />
                  </a>
                ) : (
                  <p className="text-label text-muted italic">No website specified</p>
                )}
                <div className="pt-1">
                  <p className="text-caption font-semibold text-muted">Call Availability:</p>
                  <p className="text-label font-medium text-navy">
                    {viewMember.preferredCallDay || 'Flexible days'} · {viewMember.preferredCallTime || 'Flexible hours'}
                  </p>
                </div>
              </div>
            </div>

            {/* What We Do & Key Offerings */}
            <div className="space-y-3">
              <div className="rounded-xl border border-line bg-surface p-3.5">
                <p className="text-caption font-bold uppercase tracking-wider text-muted">What We Do / Bio</p>
                <p className="mt-1 whitespace-pre-line text-label leading-relaxed text-ink/90">
                  {viewMember.whatWeDo || viewMember.bio || 'Not provided yet.'}
                </p>
              </div>

              {viewMember.keyProductService && (
                <div className="rounded-xl border border-line bg-surface p-3.5">
                  <p className="text-caption font-bold uppercase tracking-wider text-muted">Key Products / Services</p>
                  <p className="mt-1 whitespace-pre-line text-label leading-relaxed text-ink/90">
                    {viewMember.keyProductService}
                  </p>
                </div>
              )}
            </div>

            {/* Deal Matchmaking & Lead Preferences */}
            <div className="rounded-xl border border-brand/20 bg-brand/5 p-4 space-y-3">
              <p className="text-[13px] font-bold uppercase tracking-wider text-brand">Deal Matchmaking &amp; Networking Goals</p>
              <div className="grid gap-3 sm:grid-cols-3">
                <div className="rounded-lg bg-surface p-3 border border-line">
                  <p className="text-[11px] font-bold text-muted uppercase">Ideal Client</p>
                  <p className="mt-1 text-label text-navy font-medium">
                    {viewMember.idealClient || 'Any qualified B2B client'}
                  </p>
                </div>
                <div className="rounded-lg bg-surface p-3 border border-line">
                  <p className="text-[11px] font-bold text-muted uppercase">Opportunities Looking For</p>
                  <p className="mt-1 text-label text-navy font-medium">
                    {viewMember.opportunityLookingFor || 'Strategic collaborations & intros'}
                  </p>
                </div>
                <div className="rounded-lg bg-surface p-3 border border-line">
                  <p className="text-[11px] font-bold text-muted uppercase">Target Connections</p>
                  <p className="mt-1 text-label text-navy font-medium">
                    {viewMember.targetConnections || 'Founders, CXOs & Procurement Heads'}
                  </p>
                </div>
              </div>
            </div>

            {viewMember.additionalNotes && (
              <div className="rounded-xl border border-line bg-subtle p-3 text-caption text-muted">
                <span className="font-bold text-navy">Additional Notes: </span>
                {viewMember.additionalNotes}
              </div>
            )}
          </div>
        )}
      </Dialog>

      {/* Onboard New Member Modal */}
      <Dialog
        open={createOpen}
        onClose={() => setCreateOpen(false)}
        busy={saving}
        title="Onboard New Member"
        footer={
          <>
            <Button variant="ghost" onClick={() => setCreateOpen(false)} disabled={saving}>
              Cancel
            </Button>
            <Button onClick={createMember} loading={saving}>
              Provision Account
            </Button>
          </>
        }
      >
        <div className="space-y-4">
          <div className="grid gap-3 sm:grid-cols-2">
            <Field label="Full name">
              <Input value={form.fullName} onChange={(e) => setForm({ ...form, fullName: e.target.value })} placeholder="e.g. Rahul Sharma" />
            </Field>
            <Field label="Email">
              <Input type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} placeholder="rahul@example.com" />
            </Field>
            <Field label="Phone">
              <Input value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} placeholder="+91 98100 00000" />
            </Field>
            <Field label="City">
              <Input value={form.city} onChange={(e) => setForm({ ...form, city: e.target.value })} placeholder="Delhi-NCR" />
            </Field>
            <Field label="Business name">
              <Input value={form.businessName} onChange={(e) => setForm({ ...form, businessName: e.target.value })} placeholder="Company name" />
            </Field>
            <Field label="Business category">
              <Input value={form.businessCategory} onChange={(e) => setForm({ ...form, businessCategory: e.target.value })} placeholder="Technology & SaaS" />
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
          </div>

          <AdminImagePicker
            label="Profile Photo / Avatar (optional)"
            value={form.avatarUrl}
            onChange={(url) => setForm({ ...form, avatarUrl: url })}
            aspect="avatar"
            helperText="Upload member portrait photo (JPG, PNG, WebP) or provide an HTTPS link."
          />
        </div>
      </Dialog>

      {/* Edit Full Member Profile Modal (With 3 Dedicated Tabs) */}
      <Dialog
        open={Boolean(editMember)}
        onClose={() => setEditMember(null)}
        busy={saving}
        title={`Edit Profile · ${editMember?.fullName ?? ''}`}
        footer={
          <>
            <Button variant="ghost" onClick={() => setEditMember(null)} disabled={saving}>
              Cancel
            </Button>
            <Button onClick={saveEdit} loading={saving}>
              Save All Changes
            </Button>
          </>
        }
      >
        <div className="space-y-4">
          {/* Tab Switcher */}
          <div className="flex border-b border-line">
            <button
              type="button"
              onClick={() => setEditTab('basic')}
              className={cn(
                'flex items-center gap-1.5 border-b-2 px-3 py-2 text-[13px] font-bold transition-colors',
                editTab === 'basic' ? 'border-[#007AFF] text-[#007AFF]' : 'border-transparent text-muted hover:text-navy',
              )}
            >
              <User className="size-4" />
              Account &amp; Personal
            </button>
            <button
              type="button"
              onClick={() => setEditTab('business')}
              className={cn(
                'flex items-center gap-1.5 border-b-2 px-3 py-2 text-[13px] font-bold transition-colors',
                editTab === 'business' ? 'border-[#007AFF] text-[#007AFF]' : 'border-transparent text-muted hover:text-navy',
              )}
            >
              <Briefcase className="size-4" />
              Business &amp; Company
            </button>
            <button
              type="button"
              onClick={() => setEditTab('matchmaking')}
              className={cn(
                'flex items-center gap-1.5 border-b-2 px-3 py-2 text-[13px] font-bold transition-colors',
                editTab === 'matchmaking' ? 'border-[#007AFF] text-[#007AFF]' : 'border-transparent text-muted hover:text-navy',
              )}
            >
              <Target className="size-4" />
              Networking &amp; Matchmaking
            </button>
          </div>

          {/* TAB 1: Account & Personal */}
          {editTab === 'basic' && (
            <div className="space-y-4">
              <AdminImagePicker
                label="Profile Photo / Avatar"
                value={editForm.avatarUrl}
                onChange={(url) => setEditForm({ ...editForm, avatarUrl: url })}
                aspect="avatar"
                helperText="Updates member avatar across member directory, timeline posts, and digital cards."
              />

              <div className="grid gap-3 sm:grid-cols-2">
                <Field label="Full name">
                  <Input value={editForm.fullName} onChange={(e) => setEditForm({ ...editForm, fullName: e.target.value })} />
                </Field>
                <Field label="Email (Login ID)" hint="System identifier">
                  <Input value={editMember?.email ?? ''} disabled className="bg-subtle text-muted cursor-not-allowed" />
                </Field>
                <Field label="Phone">
                  <Input value={editForm.phone} onChange={(e) => setEditForm({ ...editForm, phone: e.target.value })} />
                </Field>
                <Field label="WhatsApp">
                  <Input value={editForm.whatsapp} onChange={(e) => setEditForm({ ...editForm, whatsapp: e.target.value })} placeholder="+91..." />
                </Field>
                <Field label="City">
                  <Input value={editForm.city} onChange={(e) => setEditForm({ ...editForm, city: e.target.value })} />
                </Field>
                <Field label="Plan Tier">
                  <Select value={editForm.tier} onChange={(e) => setEditForm({ ...editForm, tier: e.target.value as 'freemium' | 'premium' })}>
                    <option value="freemium">Freemium</option>
                    <option value="premium">Premium</option>
                  </Select>
                </Field>
                <Field label="Account Status">
                  <Select
                    value={editForm.accountStatus}
                    onChange={(e) => setEditForm({ ...editForm, accountStatus: e.target.value as 'active' | 'suspended' })}
                  >
                    <option value="active">Active</option>
                    <option value="suspended">Suspended</option>
                  </Select>
                </Field>
                <Field label="MNI Coins">
                  <Input
                    type="number"
                    value={editForm.mniCoins}
                    onChange={(e) => setEditForm({ ...editForm, mniCoins: Number(e.target.value) || 0 })}
                  />
                </Field>
              </div>

              <div className="flex items-center gap-3 rounded-xl border border-line bg-surface p-3">
                <input
                  id="verified-check"
                  type="checkbox"
                  checked={editForm.isVerified}
                  onChange={(e) => setEditForm({ ...editForm, isVerified: e.target.checked })}
                  className="size-4 rounded text-brand focus:ring-brand"
                />
                <label htmlFor="verified-check" className="text-[13px] font-semibold text-navy cursor-pointer">
                  Verified Member (displays blue checkmark on profile and timeline cards)
                </label>
              </div>

              <Field label="Reset Password" optional hint="Leave blank to keep current password">
                <Input
                  type="password"
                  value={editForm.newPassword}
                  onChange={(e) => setEditForm({ ...editForm, newPassword: e.target.value })}
                  placeholder="Min 8 characters"
                />
              </Field>
            </div>
          )}

          {/* TAB 2: Business & Profile */}
          {editTab === 'business' && (
            <div className="space-y-3">
              <div className="grid gap-3 sm:grid-cols-2">
                <Field label="Business name">
                  <Input value={editForm.businessName} onChange={(e) => setEditForm({ ...editForm, businessName: e.target.value })} />
                </Field>
                <Field label="Business category">
                  <Input value={editForm.businessCategory} onChange={(e) => setEditForm({ ...editForm, businessCategory: e.target.value })} />
                </Field>
              </div>

              <Field label="Website URL" optional>
                <Input
                  value={editForm.websiteUrl}
                  onChange={(e) => setEditForm({ ...editForm, websiteUrl: e.target.value })}
                  placeholder="https://company.com"
                />
              </Field>

              <Field label="What We Do / Company Bio">
                <Textarea
                  rows={4}
                  value={editForm.whatWeDo}
                  onChange={(e) => setEditForm({ ...editForm, whatWeDo: e.target.value })}
                  placeholder="Describe the company, core competencies, and track record…"
                />
              </Field>

              <Field label="Key Products & Services Offered">
                <Textarea
                  rows={3}
                  value={editForm.keyProductService}
                  onChange={(e) => setEditForm({ ...editForm, keyProductService: e.target.value })}
                  placeholder="List main product lines, consulting packages, or solutions…"
                />
              </Field>
            </div>
          )}

          {/* TAB 3: Networking & Matchmaking */}
          {editTab === 'matchmaking' && (
            <div className="space-y-3">
              <Field label="Ideal Client Profile">
                <Textarea
                  rows={2}
                  value={editForm.idealClient}
                  onChange={(e) => setEditForm({ ...editForm, idealClient: e.target.value })}
                  placeholder="e.g. Series-A funded D2C brands, Hospital chains with 100+ beds…"
                />
              </Field>

              <Field label="Opportunities Looking For">
                <Textarea
                  rows={2}
                  value={editForm.opportunityLookingFor}
                  onChange={(e) => setEditForm({ ...editForm, opportunityLookingFor: e.target.value })}
                  placeholder="e.g. Joint ventures, Angel syndicates, Export distributors in UAE…"
                />
              </Field>

              <Field label="Target Connections / Key People">
                <Input
                  value={editForm.targetConnections}
                  onChange={(e) => setEditForm({ ...editForm, targetConnections: e.target.value })}
                  placeholder="e.g. CTOs, Procurement Directors, Real Estate Developers"
                />
              </Field>

              <div className="grid gap-3 sm:grid-cols-2">
                <Field label="Preferred Call Day">
                  <Select
                    value={editForm.preferredCallDay}
                    onChange={(e) => setEditForm({ ...editForm, preferredCallDay: e.target.value })}
                  >
                    <option value="">Flexible (Any Day)</option>
                    {CALL_DAYS.map((d) => (
                      <option key={d} value={d}>
                        {d}
                      </option>
                    ))}
                  </Select>
                </Field>

                <Field label="Preferred Call Time Slot">
                  <Select
                    value={editForm.preferredCallTime}
                    onChange={(e) => setEditForm({ ...editForm, preferredCallTime: e.target.value })}
                  >
                    <option value="">Flexible (Any Time)</option>
                    {CALL_TIME_SLOTS.map((t) => (
                      <option key={t} value={t}>
                        {t}
                      </option>
                    ))}
                  </Select>
                </Field>
              </div>

              <Field label="Additional Internal Admin Notes" optional>
                <Textarea
                  rows={2}
                  value={editForm.additionalNotes}
                  onChange={(e) => setEditForm({ ...editForm, additionalNotes: e.target.value })}
                  placeholder="Internal notes about this member (lead quality, verified references, etc.)"
                />
              </Field>
            </div>
          )}
        </div>
      </Dialog>
    </div>
  )
}
