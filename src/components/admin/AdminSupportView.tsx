'use client'

import {
  ArrowRight,
  CheckCircle2,
  Clock,
  ExternalLink,
  HelpCircle,
  Mail,
  MessageCircle,
  Phone,
  Trash2,
  UserCheck,
} from 'lucide-react'
import Link from 'next/link'
import { useMemo, useState } from 'react'
import { api, ApiError } from '@/lib/client-api'
import { formatDate } from '@/lib/format'
import { StatusPill, type Tone } from '@/components/ui/Badges'
import { Button } from '@/components/ui/Button'
import { useToast } from '@/components/ui/Toast'
import { cn } from '@/components/ui/cn'

export interface AdminSupportRow {
  id: number
  reason: string
  fullName: string
  email: string
  phone: string
  businessName: string | null
  message: string | null
  status: 'pending' | 'in_progress' | 'resolved'
  createdAt: string
}

const TONE: Record<AdminSupportRow['status'], Tone> = {
  pending: 'warning',
  in_progress: 'brand',
  resolved: 'success',
}

const ISSUE_LABELS: Record<string, string> = {
  forgot_password: 'Forgot Password / Reset Access',
  new_credentials: 'New Member — Request Login Details',
  verification_status: 'Membership Verification Check',
  account_locked: 'Account Locked / Suspended',
  other: 'General Support / Other',
}

export function AdminSupportView({ initialTickets }: { initialTickets: AdminSupportRow[] }) {
  const toast = useToast()
  const [tickets, setTickets] = useState<AdminSupportRow[]>(initialTickets)
  const [filter, setFilter] = useState<'all' | 'pending' | 'in_progress' | 'resolved'>('all')
  const [busyId, setBusyId] = useState<number | null>(null)

  const filteredTickets = useMemo(() => {
    if (filter === 'all') return tickets
    return tickets.filter((t) => t.status === filter)
  }, [tickets, filter])

  const counts = useMemo(
    () => ({
      all: tickets.length,
      pending: tickets.filter((t) => t.status === 'pending').length,
      in_progress: tickets.filter((t) => t.status === 'in_progress').length,
      resolved: tickets.filter((t) => t.status === 'resolved').length,
    }),
    [tickets],
  )

  const updateStatus = async (id: number, status: AdminSupportRow['status']) => {
    setBusyId(id)
    try {
      await api('/api/admin/support', { method: 'PATCH', body: { id, status } })
      setTickets((prev) => prev.map((t) => (t.id === id ? { ...t, status } : t)))
      toast(`Ticket status updated to ${status.replace('_', ' ')}!`)
    } catch (err) {
      toast((err as ApiError).message || 'Failed to update ticket', 'error')
    } finally {
      setBusyId(null)
    }
  }

  const deleteTicket = async (id: number) => {
    setBusyId(id)
    try {
      await api('/api/admin/support', { method: 'DELETE', body: { id } })
      setTickets((prev) => prev.filter((t) => t.id !== id))
      toast('Ticket removed from queue.')
    } catch (err) {
      toast((err as ApiError).message || 'Failed to remove ticket', 'error')
    } finally {
      setBusyId(null)
    }
  }

  return (
    <div className="space-y-6">
      <header className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-[24px] font-bold tracking-tight text-navy">Support Queue &amp; Access Help</h1>
          <p className="text-label text-muted">
            Incoming tickets from members needing password resets, new login credentials, or verification assistance.
          </p>
        </div>

        {/* Filter Pills */}
        <div className="flex gap-1 rounded-xl bg-[#E9EDF4] p-1 text-[12px] font-semibold">
          {(
            [
              { id: 'all', label: `All (${counts.all})` },
              { id: 'pending', label: `Pending (${counts.pending})` },
              { id: 'in_progress', label: `In Progress (${counts.in_progress})` },
              { id: 'resolved', label: `Resolved (${counts.resolved})` },
            ] as const
          ).map((tab) => (
            <button
              key={tab.id}
              type="button"
              onClick={() => setFilter(tab.id)}
              className={cn(
                'rounded-lg px-3 py-1.5 transition-colors',
                filter === tab.id ? 'bg-white text-navy shadow-sm' : 'text-muted hover:text-navy',
              )}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </header>

      {filteredTickets.length === 0 ? (
        <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-black/10 bg-surface p-12 text-center">
          <div className="grid size-12 place-items-center rounded-full bg-navy/5 text-navy">
            <HelpCircle className="size-6 text-muted" />
          </div>
          <h3 className="mt-3 text-[16px] font-bold text-navy">No {filter === 'all' ? '' : `${filter} `}tickets in queue</h3>
          <p className="mt-1 text-label text-muted">
            When members submit login help or credential requests from the public login screen, they will appear here.
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {filteredTickets.map((t) => {
            const cleanPhone = t.phone.replace(/[^0-9]/g, '')
            return (
              <div
                key={t.id}
                className={cn(
                  'rounded-2xl border bg-surface p-4 shadow-sm transition-all hover:border-black/15',
                  t.status === 'pending'
                    ? 'border-warning/30 bg-[#FFFDF7]'
                    : t.status === 'in_progress'
                      ? 'border-[#007AFF]/25 bg-[#F8FAFF]'
                      : 'border-black/[0.06]',
                )}
              >
                <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <StatusPill tone={TONE[t.status]}>{t.status.replace('_', ' ')}</StatusPill>
                      <span className="inline-flex items-center gap-1 rounded-full bg-navy/5 px-2.5 py-0.5 text-[11.5px] font-bold text-navy">
                        {ISSUE_LABELS[t.reason] || t.reason.replace(/_/g, ' ')}
                      </span>
                      <span className="text-caption text-muted">Submitted {formatDate(t.createdAt)}</span>
                    </div>

                    <h2 className="mt-2 text-[16px] font-bold text-navy">{t.fullName}</h2>
                    {t.businessName && <p className="text-label font-medium text-navy/80">{t.businessName}</p>}

                    {/* Contact Pills */}
                    <div className="mt-2 flex flex-wrap items-center gap-2 text-caption font-semibold">
                      <a
                        href={`mailto:${t.email}?subject=MNI Network Access Help`}
                        className="inline-flex items-center gap-1 rounded-lg border border-black/10 bg-white px-2.5 py-1 text-navy hover:bg-[#F2F4F7]"
                      >
                        <Mail className="size-3 text-muted" />
                        <span>{t.email}</span>
                      </a>

                      <a
                        href={`tel:${t.phone}`}
                        className="inline-flex items-center gap-1 rounded-lg border border-black/10 bg-white px-2.5 py-1 text-navy hover:bg-[#F2F4F7]"
                      >
                        <Phone className="size-3 text-muted" />
                        <span>{t.phone}</span>
                      </a>

                      {cleanPhone && (
                        <a
                          href={`https://wa.me/${cleanPhone}?text=Hi ${encodeURIComponent(t.fullName)}, this is MNI Support regarding your access request.`}
                          target="_blank"
                          rel="noreferrer"
                          className="inline-flex items-center gap-1 rounded-lg border border-[#25D366]/30 bg-[#25D366]/10 px-2.5 py-1 text-[#1E7E34] hover:bg-[#25D366]/20"
                        >
                          <MessageCircle className="size-3 text-[#25D366]" />
                          <span>WhatsApp</span>
                        </a>
                      )}
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex items-center gap-2 shrink-0 self-end sm:self-start">
                    {t.status === 'pending' && (
                      <Button
                        size="sm"
                        variant="secondary"
                        loading={busyId === t.id}
                        onClick={() => updateStatus(t.id, 'in_progress')}
                      >
                        Start Processing
                      </Button>
                    )}

                    {t.status !== 'resolved' ? (
                      <Button
                        size="sm"
                        variant="primary"
                        icon={<CheckCircle2 className="size-3.5" />}
                        loading={busyId === t.id}
                        onClick={() => updateStatus(t.id, 'resolved')}
                      >
                        Mark Resolved
                      </Button>
                    ) : (
                      <Button
                        size="sm"
                        variant="secondary"
                        loading={busyId === t.id}
                        onClick={() => updateStatus(t.id, 'pending')}
                      >
                        Re-open
                      </Button>
                    )}

                    <button
                      type="button"
                      disabled={busyId === t.id}
                      onClick={() => deleteTicket(t.id)}
                      className="grid size-8 place-items-center rounded-full text-danger hover:bg-danger-bg disabled:opacity-50"
                      aria-label="Delete ticket"
                      title="Delete ticket"
                    >
                      <Trash2 className="size-4" />
                    </button>
                  </div>
                </div>

                {t.message && (
                  <div className="mt-3 rounded-xl border border-black/5 bg-white p-3 text-label text-ink/90">
                    <p className="text-caption font-bold uppercase tracking-wider text-muted">Issue Message</p>
                    <p className="mt-1 whitespace-pre-line leading-relaxed">{t.message}</p>
                  </div>
                )}

                {/* Workflow helper prompt */}
                {t.status !== 'resolved' && (
                  <div className="mt-2.5 flex items-center justify-between text-caption text-muted">
                    <span>Next step: Contact member or reset password in Members module.</span>
                    <Link
                      href="/admin/members"
                      className="inline-flex items-center gap-1 font-semibold text-[#007AFF] hover:underline"
                    >
                      <span>Open Members</span>
                      <ArrowRight className="size-3" />
                    </Link>
                  </div>
                )}
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
