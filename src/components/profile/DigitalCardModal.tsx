'use client'

import { Check, Copy, MapPin, QrCode, Share2 } from 'lucide-react'
import QRCode from 'qrcode'
import { useEffect, useState } from 'react'
import type { SelfProfile } from '@/lib/view-models'
import { Avatar, TierBadge, VerifiedMark } from '../ui/Badges'
import { Dialog } from '../ui/Dialog'
import { useToast } from '../ui/Toast'

export function DigitalCardModal({
  open,
  onClose,
  profile,
  avatarUrl,
}: {
  open: boolean
  onClose: () => void
  profile: SelfProfile
  avatarUrl: string | null
}) {
  const toast = useToast()
  const [qrSrc, setQrSrc] = useState<string | null>(null)
  const [copied, setCopied] = useState(false)

  const profileUrl =
    typeof window !== 'undefined'
      ? `${window.location.origin}/directory?member=${encodeURIComponent(profile.memberId)}`
      : `https://mni-members-app.vercel.app/directory?member=${encodeURIComponent(profile.memberId)}`

  useEffect(() => {
    if (!open) return
    QRCode.toDataURL(profileUrl, {
      width: 240,
      margin: 1,
      color: { dark: '#0B224E', light: '#FFFFFF' },
    })
      .then(setQrSrc)
      .catch(() => {})
  }, [open, profileUrl])

  const copyLink = async () => {
    try {
      await navigator.clipboard.writeText(profileUrl)
      setCopied(true)
      toast('Digital business card link copied!')
      setTimeout(() => setCopied(false), 2000)
    } catch {
      toast('Could not copy link', 'error')
    }
  }

  return (
    <Dialog open={open} onClose={onClose} title="MNI Digital Card" size="sm">
      <div className="space-y-4">
        <div className="relative overflow-hidden rounded-[24px] bg-gradient-to-br from-[#0B224E] via-[#102E6A] to-[#163E8C] p-5 text-white shadow-[0_14px_34px_rgba(11,34,78,0.3)]">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <img src="/brand/mni-logo.webp" alt="MNI" className="size-7 rounded-lg object-cover" />
              <span className="text-[11px] font-bold uppercase tracking-[0.18em] text-on-navy-muted">
                MNI Member Pass
              </span>
            </div>
            <TierBadge tier={profile.tier} onNavy />
          </div>

          <div className="mt-5 flex items-center gap-3.5">
            <Avatar
              initials={profile.avatarInitials || profile.fullName.slice(0, 2).toUpperCase()}
              src={avatarUrl}
              size="lg"
              tone="white"
            />
            <div className="min-w-0 flex-1">
              <p className="flex items-center gap-1.5 text-[18px] font-bold leading-tight">
                <span className="truncate">{profile.fullName}</span>
                {profile.isVerified && <VerifiedMark className="[&_svg]:text-[#7fd4b8]" />}
              </p>
              <p className="truncate text-label font-medium text-on-navy-muted">{profile.businessName}</p>
              <p className="mt-0.5 flex items-center gap-1 text-caption text-on-navy-muted">
                <MapPin className="size-3" />
                {profile.city} · {profile.memberId}
              </p>
            </div>
          </div>

          {/* QR Code Surface */}
          <div className="mt-5 flex flex-col items-center rounded-2xl bg-white p-4 text-center text-navy shadow-inner">
            {qrSrc ? (
              <img src={qrSrc} alt="Member QR Code" className="size-44 rounded-lg" />
            ) : (
              <div className="grid size-44 place-items-center rounded-lg bg-subtle text-muted">
                <QrCode className="size-10" />
              </div>
            )}
            <p className="mt-2 text-caption font-semibold text-navy">Scan to connect via MNI Directory</p>
          </div>
        </div>

        <button
          type="button"
          onClick={copyLink}
          className="inline-flex h-11 w-full items-center justify-center gap-2 rounded-2xl bg-[#007AFF] text-label font-semibold text-white shadow-sm transition-all hover:bg-[#0066E0] active:scale-[0.98]"
        >
          {copied ? <Check className="size-4" /> : <Copy className="size-4" />}
          {copied ? 'Copied!' : 'Copy Digital Card Link'}
        </button>

        {typeof navigator !== 'undefined' && typeof navigator.share === 'function' && (
          <button
            type="button"
            onClick={() =>
              navigator.share({
                title: `${profile.fullName} · MNI Member Card`,
                text: `Connect with ${profile.fullName} (${profile.businessName}) on MNI`,
                url: profileUrl,
              }).catch(() => {})
            }
            className="inline-flex h-10 w-full items-center justify-center gap-2 rounded-2xl border border-line bg-surface text-label font-semibold text-navy hover:bg-subtle"
          >
            <Share2 className="size-4" />
            Share via…
          </button>
        )}
      </div>
    </Dialog>
  )
}
