'use client'

import { Check, Copy, ExternalLink, MapPin, QrCode, Share2 } from 'lucide-react'
import Link from 'next/link'
import QRCode from 'qrcode'
import { useEffect, useState } from 'react'
import type { SelfProfile } from '@/lib/view-models'
import { Avatar, TierBadge, VerifiedMark } from '../ui/Badges'
import { Dialog } from '../ui/Dialog'
import { useToast } from '../ui/Toast'
import { SaveContactButton } from './SaveContactButton'

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
  const [showQr, setShowQr] = useState(false)
  const [qrSrc, setQrSrc] = useState<string | null>(null)
  const [copied, setCopied] = useState(false)

  const publicCardPath = `/card/${encodeURIComponent(profile.memberId)}`
  const cardUrl =
    typeof window !== 'undefined'
      ? `${window.location.origin}${publicCardPath}`
      : `https://mni-members-app.vercel.app${publicCardPath}`

  useEffect(() => {
    if (!open || !showQr) return
    QRCode.toDataURL(cardUrl, {
      width: 220,
      margin: 1,
      color: { dark: '#0B224E', light: '#FFFFFF' },
    })
      .then(setQrSrc)
      .catch(() => {})
  }, [open, showQr, cardUrl])

  const copyLink = async () => {
    try {
      await navigator.clipboard.writeText(cardUrl)
      setCopied(true)
      toast('Public MNI Card link copied!')
      setTimeout(() => setCopied(false), 2000)
    } catch {
      toast('Could not copy link', 'error')
    }
  }

  const shareCard = async () => {
    if (typeof navigator !== 'undefined' && typeof navigator.share === 'function') {
      try {
        await navigator.share({
          title: `${profile.fullName} · MNI Digital Card`,
          text: `Connect with ${profile.fullName} (${profile.businessName}) on MNI`,
          url: cardUrl,
        })
        return
      } catch {
        // Fallback to copy
      }
    }
    copyLink()
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

          {showQr && qrSrc && (
            <div className="mt-5 flex flex-col items-center rounded-2xl bg-white p-4 text-center text-navy shadow-inner">
              <img src={qrSrc} alt="Public MNI Card QR" className="size-40 rounded-lg" />
              <p className="mt-2 text-caption font-semibold text-navy">Opens public MNI business card</p>
            </div>
          )}
        </div>

        {/* Primary Action: Download vCard */}
        <SaveContactButton
          fullName={profile.fullName}
          businessName={profile.businessName}
          businessCategory={profile.businessCategory}
          city={profile.city}
          websiteUrl={profile.websiteUrl}
          memberId={profile.memberId}
          cardUrl={cardUrl}
        />

        {/* Share & Copy Actions */}
        <div className="grid grid-cols-2 gap-2.5">
          <button
            type="button"
            onClick={shareCard}
            className="inline-flex h-10 items-center justify-center gap-2 rounded-2xl border border-line bg-surface text-label font-semibold text-navy hover:bg-subtle"
          >
            <Share2 className="size-4 text-brand" />
            Share Card
          </button>
          <button
            type="button"
            onClick={copyLink}
            className="inline-flex h-10 items-center justify-center gap-2 rounded-2xl border border-line bg-surface text-label font-semibold text-navy hover:bg-subtle"
          >
            {copied ? <Check className="size-4 text-success" /> : <Copy className="size-4 text-brand" />}
            {copied ? 'Copied' : 'Copy Link'}
          </button>
        </div>

        {/* Preview Public Card & Optional In-Person QR Toggle */}
        <div className="flex items-center justify-between pt-1 text-caption font-semibold">
          <Link
            href={publicCardPath}
            target="_blank"
            className="inline-flex items-center gap-1.5 text-brand hover:underline"
          >
            <ExternalLink className="size-3.5" />
            Preview Public Card
          </Link>
          <button
            type="button"
            onClick={() => setShowQr((v) => !v)}
            className="inline-flex items-center gap-1.5 text-muted hover:text-navy"
          >
            <QrCode className="size-3.5" />
            {showQr ? 'Hide QR' : 'Show In-Person QR'}
          </button>
        </div>
      </div>
    </Dialog>
  )
}
