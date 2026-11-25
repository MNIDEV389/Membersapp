'use client'

import { Award, Briefcase, CalendarClock, Camera, ChevronRight, Compass, ExternalLink, HelpCircle, KeyRound, LogOut, Mail, MapPin, MessageCircle, PencilLine, Phone, Sparkles, Target, Trophy } from 'lucide-react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useEffect, useState, type ReactNode } from 'react'
import { api } from '@/lib/client-api'
import { formatDate, websiteHref } from '@/lib/format'
import type { SelfProfile } from '@/lib/view-models'
import { Avatar, TierBadge, VerifiedMark } from '../ui/Badges'
import { Button } from '../ui/Button'
import { Dialog } from '../ui/Dialog'
import { Alert } from '../ui/Feedback'
import { SegmentedTabs, TabPanel } from '../ui/Tabs'
import { useToast } from '../ui/Toast'
import { EditProfileDialog } from './EditProfileDialog'

type TabId = 'about' | 'networking' | 'account'
type Pending = { id: number | string; status: string; adminFeedback: string | null; createdAt: string; changes: Record<string, string> } | null

export function ProfileView({ profile, rank, pending }: { profile: SelfProfile; rank: number; pending: Pending }) {
  const router = useRouter()
  const toast = useToast()
  const [tab, setTab] = useState<TabId>('about')
  const [editing, setEditing] = useState(false)
  const [confirmLogout, setConfirmLogout] = useState(false)
  const [loggingOut, setLoggingOut] = useState(false)
  const [withdrawing, setWithdrawing] = useState(false)
  const [avatarUrl, setAvatarUrl] = useState<string | null>(profile.avatarUrl)
  const [uploadingAvatar, setUploadingAvatar] = useState(false)
  const site = websiteHref(profile.websiteUrl)

  useEffect(() => {
    setAvatarUrl(profile.avatarUrl)
  }, [profile.avatarUrl])

  const compressAndUploadAvatar = async (file: File) => {
    if (!file.type.startsWith('image/')) {
      toast('Please select an image file (JPG, PNG, or WebP).', 'error')
      return
    }
    setUploadingAvatar(true)
    const reader = new FileReader()
    reader.onload = (e) => {
      const img = new Image()
      img.onload = async () => {
        const canvas = document.createElement('canvas')
        const MAX_SIZE = 360
        let w = img.width
        let h = img.height
        if (w > h) {
          if (w > MAX_SIZE) {
            h = Math.round((h * MAX_SIZE) / w)
            w = MAX_SIZE
          }
        } else {
          if (h > MAX_SIZE) {
            w = Math.round((w * MAX_SIZE) / h)
            h = MAX_SIZE
          }
        }
        canvas.width = w
        canvas.height = h
        const ctx = canvas.getContext('2d')
        if (!ctx) {
          setUploadingAvatar(false)
          return
        }
        ctx.drawImage(img, 0, 0, w, h)
        const dataUrl = canvas.toDataURL('image/jpeg', 0.85)
        setAvatarUrl(dataUrl)
        try {
          await api('/api/app/profile/avatar', { body: { avatarUrl: dataUrl } })
          toast('Profile picture updated!')
          router.refresh()
        } catch (err) {
          toast((err as Error).message || 'Failed to update avatar.', 'error')
          setAvatarUrl(profile.avatarUrl)
        } finally {
          setUploadingAvatar(false)
        }
      }
      img.src = e.target?.result as string
    }
    reader.readAsDataURL(file)
  }

  const logout = async () => {
    setLoggingOut(true)
    try {
      await api('/api/app/auth/logout', { body: {} })
    } finally {
      router.replace('/login')
      router.refresh()
    }
  }

  const withdraw = async () => {
    setWithdrawing(true)
    try {
      await api('/api/app/profile-change', { method: 'DELETE' })
      toast('Profile changes withdrawn.')
      router.refresh()
    } catch (e) {
      toast((e as Error).message, 'error')
    } finally {
      setWithdrawing(false)
    }
  }

  return (
    <div className="space-y-5">
      <h1 className="sr-only">Your profile</h1>

      <section className="rounded-[var(--radius-panel)] bg-navy p-5 text-white sm:p-6" aria-label="Profile summary">
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-start gap-3.5 min-w-0 flex-1">
            <div className="relative group shrink-0">
              <Avatar initials={profile.avatarInitials} src={avatarUrl} size="xl" tone="white" />
              <label
                className="absolute -bottom-1 -right-1 grid size-8 cursor-pointer place-items-center rounded-full bg-[#007AFF] text-white shadow-lg ring-2 ring-navy transition-all hover:scale-110 active:scale-95"
                title="Upload profile photo"
              >
                <Camera className="size-4" />
                <input
                  type="file"
                  accept="image/*"
                  disabled={uploadingAvatar}
                  className="sr-only"
                  onChange={(e) => {
                    const f = e.target.files?.[0]
                    if (f) compressAndUploadAvatar(f)
                  }}
                />
              </label>
            </div>
            <div className="min-w-0 flex-1 space-y-1 pt-0.5">
              <p className="flex flex-wrap items-center gap-2 text-section font-bold">
                {profile.fullName}
                {profile.isVerified && <VerifiedMark className="[&_svg]:text-[#7fd4b8]" />}
              </p>
              <p className="text-label font-medium text-on-navy-muted truncate">{profile.businessName}</p>
              <div className="flex flex-wrap items-center gap-2 pt-1">
                <TierBadge tier={profile.tier} onNavy />
                <span className="text-caption text-on-navy-muted">{profile.memberId}</span>
              </div>
            </div>
          </div>

          {/* Small compact Edit button on the right side */}
          <button
            type="button"
            onClick={() => setEditing(true)}
            className="inline-flex h-8 shrink-0 items-center gap-1.5 rounded-full bg-white/15 px-3 text-[12.5px] font-semibold text-white backdrop-blur transition-all hover:bg-white/25 active:scale-95"
          >
            <PencilLine className="size-3.5" aria-hidden="true" />
            {pending ? 'Review' : 'Edit profile'}
          </button>
        </div>
      </section>

      {pending && (
        <Alert
          tone={pending.status === 'changes_requested' ? 'warning' : 'info'}
          title={pending.status === 'changes_requested' ? 'MNI needs a few changes to your profile update' : 'Profile changes awaiting MNI review'}
          action={
            <div className="flex flex-wrap gap-2">
              <Button size="sm" variant="secondary" onClick={() => setEditing(true)}>Review changes</Button>
              <Button size="sm" variant="ghost" onClick={withdraw} loading={withdrawing}>Withdraw</Button>
            </div>
          }
        >
          {pending.adminFeedback ?? `Submitted ${formatDate(pending.createdAt)}. Members will see your new details once approved.`}
        </Alert>
      )}

      <SegmentedTabs<TabId>
        label="Profile sections"
        idPrefix="profile"
        value={tab}
        onChange={setTab}
        tabs={[
          { id: 'about', label: 'About' },
          { id: 'networking', label: 'Networking' },
          { id: 'account', label: 'Account' },
        ]}
      />

      <TabPanel idPrefix="profile" id={tab}>
        <div className="space-y-3">
          {tab === 'about' && (
            <>
              <InfoCard icon={<Briefcase />} title="Business category">{profile.businessCategory}</InfoCard>
              <InfoCard icon={<Compass />} title="What we do" empty="Tell members what your business does.">{profile.whatWeDo || profile.bio}</InfoCard>
              <InfoCard icon={<Sparkles />} title="Key product or service" empty="Add your main offering.">{profile.keyProductService}</InfoCard>
              {site && (
                <a href={site} target="_blank" rel="noopener noreferrer" className="flex min-h-14 items-center justify-between gap-3 rounded-[var(--radius-card)] border border-line bg-surface px-4 shadow-card hover:bg-subtle">
                  <span className="flex items-center gap-3 text-label font-semibold text-navy">
                    <ExternalLink className="size-4 text-brand" aria-hidden="true" />
                    {profile.websiteUrl}
                  </span>
                  <span className="text-caption text-muted">Website<span className="sr-only"> (opens in a new tab)</span></span>
                </a>
              )}
            </>
          )}
          {tab === 'networking' && (
            <>
              <InfoCard icon={<Target />} title="Ideal client" empty="Who would you like to be introduced to?">{profile.idealClient}</InfoCard>
              <InfoCard icon={<Briefcase />} title="Opportunities I’m looking for" empty="What kind of business are you looking for right now?" highlight>{profile.opportunityLookingFor}</InfoCard>
              <InfoCard icon={<Award />} title="People I’d like to meet" empty="Name a profession, company or role.">{profile.targetConnections}</InfoCard>
              <InfoCard icon={<CalendarClock />} title="Best time to call" empty="Add your preferred day and time.">
                {[profile.preferredCallDay, profile.preferredCallTime].filter(Boolean).join(', ')}
              </InfoCard>
              {profile.additionalNotes && <InfoCard title="Notes">{profile.additionalNotes}</InfoCard>}
            </>
          )}
          {tab === 'account' && (
            <dl className="divide-y divide-line overflow-hidden rounded-[var(--radius-card)] border border-line bg-surface shadow-card">
              <AccountRow icon={<Mail />} label="Email" value={profile.email} />
              <AccountRow icon={<Phone />} label="Phone" value={profile.phone} />
              {profile.whatsapp && profile.whatsapp !== profile.phone && (
                <AccountRow icon={<MessageCircle className="text-[#25D366]" />} label="WhatsApp" value={profile.whatsapp} />
              )}
              <AccountRow icon={<MapPin />} label="Chapter" value={profile.city} />
              <AccountRow icon={<Award />} label="Member ID" value={profile.memberId} />
              {profile.memberSince && <AccountRow icon={<CalendarClock />} label="Member since" value={profile.memberSince} />}
            </dl>
          )}
        </div>
      </TabPanel>

      <nav aria-label="More" className="divide-y divide-line overflow-hidden rounded-[var(--radius-card)] border border-line bg-surface shadow-card">
        <MenuLink href="/rewards" icon={<Trophy className="text-coin" />}>Rewards & leaderboard</MenuLink>
        <MenuLink href="/settings/password" icon={<KeyRound className="text-brand" />}>Change password</MenuLink>
        <MenuLink href="/login-help?reason=other" icon={<HelpCircle className="text-brand" />}>Help & account support</MenuLink>
        <button type="button" onClick={() => setConfirmLogout(true)} className="flex min-h-14 w-full items-center gap-3 px-4 text-left text-body font-semibold text-danger hover:bg-danger-bg/50">
          <LogOut className="size-5" aria-hidden="true" />
          Sign out
        </button>
      </nav>
      <p className="pb-2 text-center text-caption text-muted">To change your email or login details, contact MNI support.</p>

      <EditProfileDialog
        open={editing}
        onClose={() => setEditing(false)}
        profile={profile}
        currentAvatarUrl={avatarUrl}
        onAvatarUpdated={(newUrl) => setAvatarUrl(newUrl)}
        pendingChanges={pending?.changes ?? null}
      />

      <Dialog
        open={confirmLogout}
        onClose={() => setConfirmLogout(false)}
        busy={loggingOut}
        size="sm"
        title="Sign out of MNI?"
        description="You’ll need your email or Member ID and password to sign back in."
        footer={
          <>
            <Button variant="ghost" onClick={() => setConfirmLogout(false)} disabled={loggingOut}>Cancel</Button>
            <Button variant="danger" onClick={logout} loading={loggingOut} loadingText="Signing out…">Sign out</Button>
          </>
        }
      >
        <p className="text-body text-muted">Signed in as <span className="font-semibold text-ink">{profile.email}</span>.</p>
      </Dialog>
    </div>
  )
}

function InfoCard({ icon, title, children, empty, highlight }: { icon?: ReactNode; title: string; children?: ReactNode; empty?: string; highlight?: boolean }) {
  const has = Boolean(children && (typeof children !== 'string' || children.trim()))
  return (
    <section className={highlight && has ? 'rounded-[var(--radius-card)] bg-pale p-4' : 'rounded-[var(--radius-card)] border border-line bg-surface p-4 shadow-card'}>
      <h2 className="flex items-center gap-2 text-caption font-bold uppercase tracking-wider text-muted">
        {icon && <span className="text-brand [&_svg]:size-4" aria-hidden="true">{icon}</span>}
        {title}
      </h2>
      {has ? <p className="mt-1.5 whitespace-pre-line text-body text-ink/90">{children}</p> : <p className="mt-1.5 text-label italic text-muted">{empty ?? 'Not added yet.'}</p>}
    </section>
  )
}

function AccountRow({ icon, label, value }: { icon: ReactNode; label: string; value: string }) {
  return (
    <div className="flex items-center gap-3 px-4 py-3.5">
      <span className="text-muted [&_svg]:size-[18px]" aria-hidden="true">{icon}</span>
      <dt className="w-28 shrink-0 text-label text-muted">{label}</dt>
      <dd className="min-w-0 flex-1 truncate text-right text-label font-semibold text-navy">{value || '—'}</dd>
    </div>
  )
}

function MenuLink({ href, icon, children }: { href: string; icon: ReactNode; children: ReactNode }) {
  return (
    <Link href={href} className="flex min-h-14 items-center gap-3 px-4 text-body font-semibold text-navy hover:bg-subtle">
      <span className="[&_svg]:size-5" aria-hidden="true">{icon}</span>
      <span className="flex-1">{children}</span>
      <ChevronRight className="size-4 text-muted" aria-hidden="true" />
    </Link>
  )
}
