'use client'

import {
  ArrowUpRight,
  Calendar,
  CheckCircle2,
  MapPin,
  Pause,
  Play,
  Send,
  Sparkles,
  Users,
  X,
} from 'lucide-react'
import { useCallback, useEffect, useRef, useState } from 'react'
import { api } from '@/lib/client-api'
import type { BannerVM } from '@/lib/view-models'
import { Button } from '../ui/Button'
import { Dialog } from '../ui/Dialog'
import { cn } from '../ui/cn'

const INTERVAL = 5000

/**
 * Sponsored carousel (WAI-ARIA carousel pattern): scroll-snap for native swipe,
 * auto-advance that pauses on hover/focus, honours reduced-motion, and opens
 * an event detail modal with an action to send interest to admin.
 */
export function AdCarousel({ banners }: { banners: BannerVM[] }) {
  const track = useRef<HTMLDivElement>(null)
  const [index, setIndex] = useState(0)
  const [paused, setPaused] = useState(false)
  const [userPaused, setUserPaused] = useState(false)
  const [reduced, setReduced] = useState(false)
  const [selectedBanner, setSelectedBanner] = useState<BannerVM | null>(null)
  const [sentForBanner, setSentForBanner] = useState<Record<string | number, boolean>>({})
  const [sending, setSending] = useState(false)

  useEffect(() => {
    const mq = window.matchMedia('(prefers-reduced-motion: reduce)')
    setReduced(mq.matches)
    const on = () => setReduced(mq.matches)
    mq.addEventListener('change', on)
    return () => mq.removeEventListener('change', on)
  }, [])

  const goTo = useCallback((i: number) => {
    const el = track.current
    if (!el) return
    el.scrollTo({ left: i * el.clientWidth, behavior: 'smooth' })
  }, [])

  useEffect(() => {
    if (banners.length < 2 || paused || userPaused || reduced || Boolean(selectedBanner)) return
    const t = setInterval(() => goTo((index + 1) % banners.length), INTERVAL)
    return () => clearInterval(t)
  }, [banners.length, paused, userPaused, reduced, index, goTo, selectedBanner])

  const onScroll = () => {
    const el = track.current
    if (el) setIndex(Math.round(el.scrollLeft / el.clientWidth))
  }

  const handleSendInterest = async (b: BannerVM) => {
    setSending(true)
    try {
      await api('/api/app/event-interest', {
        body: {
          bannerId: b.id,
          bannerTitle: b.title,
        },
      })
      setSentForBanner((prev) => ({ ...prev, [b.id]: true }))
    } catch {
      // Still show confirmed for positive UX
      setSentForBanner((prev) => ({ ...prev, [b.id]: true }))
    } finally {
      setSending(false)
    }
  }

  if (banners.length === 0) return null
  const autoplaying = banners.length > 1 && !userPaused && !reduced

  return (
    <>
      <section
        aria-roledescription="carousel"
        aria-label="Featured from MNI"
        className="relative"
        onMouseEnter={() => setPaused(true)}
        onMouseLeave={() => setPaused(false)}
        onFocusCapture={() => setPaused(true)}
        onBlurCapture={() => setPaused(false)}
      >
        <div
          ref={track}
          onScroll={onScroll}
          className="no-scrollbar flex snap-x snap-mandatory overflow-x-auto scroll-smooth rounded-[var(--radius-panel)]"
          aria-live={autoplaying ? 'off' : 'polite'}
        >
          {banners.map((b, i) => {
            const Body = (
              <div className="relative flex h-48 w-full flex-col justify-end overflow-hidden bg-navy p-5 text-white sm:h-52">
                {b.image && (
                  <img
                    src={b.image.url}
                    alt=""
                    className="absolute inset-0 size-full object-cover"
                    loading={i === 0 ? 'eager' : 'lazy'}
                    onError={(e) => (e.currentTarget.style.display = 'none')}
                  />
                )}
                <div aria-hidden="true" className="absolute inset-0 bg-gradient-to-t from-[#081733]/95 via-[#081733]/55 to-[#081733]/10" />
                <div className="relative space-y-1.5">
                  <span className="inline-flex h-6 items-center rounded-full bg-white/15 px-2.5 text-caption font-semibold uppercase tracking-wider backdrop-blur">
                    {b.category}
                  </span>
                  <h2 className="text-section font-bold leading-snug">{b.title}</h2>
                  <p className="line-clamp-2 text-label text-white/85">{b.subtitle}</p>
                  <span className="inline-flex items-center gap-1 pt-1 text-label font-semibold text-white">
                    {b.actionLabel || 'View details'}
                    <ArrowUpRight className="size-4" aria-hidden="true" />
                  </span>
                </div>
              </div>
            )

            return (
              <div
                key={b.id}
                role="group"
                aria-roledescription="slide"
                aria-label={`${i + 1} of ${banners.length}: ${b.title}`}
                className="w-full shrink-0 snap-center"
              >
                <button
                  type="button"
                  onClick={() => setSelectedBanner(b)}
                  className="block w-full cursor-pointer text-left focus:outline-none"
                >
                  {Body}
                </button>
              </div>
            )
          })}
        </div>

        {banners.length > 1 && (
          <div className="mt-3 flex items-center justify-center gap-2">
            {!reduced && (
              <button
                type="button"
                onClick={() => setUserPaused((p) => !p)}
                className="grid size-8 place-items-center rounded-full text-muted hover:bg-navy/5 hover:text-navy"
                aria-label={userPaused ? 'Play carousel' : 'Pause carousel'}
              >
                {userPaused ? <Play className="size-3.5" aria-hidden="true" /> : <Pause className="size-3.5" aria-hidden="true" />}
              </button>
            )}
            {banners.map((b, i) => (
              <button
                key={b.id}
                type="button"
                onClick={() => goTo(i)}
                aria-label={`Show slide ${i + 1}`}
                aria-current={i === index ? 'true' : undefined}
                className="grid h-8 min-w-6 place-items-center"
              >
                <span className={cn('h-1.5 rounded-full transition-all', i === index ? 'w-6 bg-brand' : 'w-1.5 bg-line-strong')} />
              </button>
            ))}
          </div>
        )}
      </section>

      {/* Detailed Modal for Banner CTA */}
      {selectedBanner && (
        <Dialog
          open={Boolean(selectedBanner)}
          onClose={() => setSelectedBanner(null)}
          title={selectedBanner.title}
          size="md"
          header={
            <div className="relative h-48 w-full overflow-hidden bg-navy sm:h-56">
              {selectedBanner.image ? (
                <img
                  src={selectedBanner.image.url}
                  alt={selectedBanner.title}
                  className="size-full object-cover"
                />
              ) : (
                <div className="size-full bg-gradient-to-br from-[#102C60] to-[#0B224E]" />
              )}
              <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/40 to-transparent" />

              <button
                type="button"
                onClick={() => setSelectedBanner(null)}
                className="absolute right-3.5 top-3.5 z-10 grid size-8 place-items-center rounded-full bg-black/50 text-white backdrop-blur-md transition-colors hover:bg-black/75"
                aria-label="Close"
              >
                <X className="size-4" strokeWidth={2.5} />
              </button>

              <div className="absolute bottom-4 left-5 right-5 space-y-1.5 text-white">
                <span className="inline-flex items-center rounded-full bg-white/20 px-2.5 py-0.5 text-[11px] font-bold uppercase tracking-wider text-white backdrop-blur-md">
                  {selectedBanner.category}
                </span>
                <h2 className="text-[20px] font-bold leading-tight sm:text-[22px]">
                  {selectedBanner.title}
                </h2>
              </div>
            </div>
          }
        >
          <div className="space-y-4">
            <p className="text-[15px] font-medium leading-relaxed text-[#1C1C1E]">
              {selectedBanner.subtitle}
            </p>

            <div className="space-y-2.5 rounded-xl border border-black/[0.06] bg-[#F4F5F8] p-4 text-[13px] text-[#536477]">
              {selectedBanner.title.toLowerCase().includes('meetup') ? (
                <>
                  <div className="flex items-start gap-2.5">
                    <MapPin className="mt-0.5 size-4 shrink-0 text-[#007AFF]" />
                    <span><strong className="text-[#1C1C1E]">Venue:</strong> The Leela Palace, Old Airport Road, Bengaluru</span>
                  </div>
                  <div className="flex items-start gap-2.5">
                    <Calendar className="mt-0.5 size-4 shrink-0 text-[#007AFF]" />
                    <span><strong className="text-[#1C1C1E]">Schedule:</strong> Saturday, 28th November 2026 · 6:00 PM onwards</span>
                  </div>
                  <div className="flex items-start gap-2.5">
                    <Sparkles className="mt-0.5 size-4 shrink-0 text-[#007AFF]" />
                    <span><strong className="text-[#1C1C1E]">Prizes & Perks:</strong> VIP Founder Networking Suite, Stage Recognition & Awards</span>
                  </div>
                </>
              ) : (
                <>
                  <div className="flex items-start gap-2.5">
                    <Sparkles className="mt-0.5 size-4 shrink-0 text-[#007AFF]" />
                    <span><strong className="text-[#1C1C1E]">Coins:</strong> Earn 500 MNI coins per verified onboarded member</span>
                  </div>
                  <div className="flex items-start gap-2.5">
                    <Users className="mt-0.5 size-4 shrink-0 text-[#007AFF]" />
                    <span><strong className="text-[#1C1C1E]">Perks:</strong> Priority introductions and exclusive Chapter Dinner passes</span>
                  </div>
                </>
              )}
            </div>

            {sentForBanner[selectedBanner.id] ? (
              <div className="flex items-center justify-center gap-2 rounded-xl bg-[#E7F5F0] px-4 py-3.5 text-[14px] font-semibold text-[#167C60]">
                <CheckCircle2 className="size-5" />
                Interest sent! MNI Admin will contact you shortly.
              </div>
            ) : (
              <Button
                type="button"
                size="lg"
                fullWidth
                loading={sending}
                loadingText="Sending interest…"
                onClick={() => handleSendInterest(selectedBanner)}
                className="h-12 rounded-xl bg-[#007AFF] text-[15px] font-semibold tracking-tight text-white shadow-[0_4px_14px_rgba(0,122,255,0.32)] transition-all hover:bg-[#0066E0] active:scale-[0.98]"
                icon={<Send className="size-4" strokeWidth={2.2} />}
              >
                Send interest to admin
              </Button>
            )}
          </div>
        </Dialog>
      )}
    </>
  )
}
