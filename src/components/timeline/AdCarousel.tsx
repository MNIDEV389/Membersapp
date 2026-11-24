'use client'

import { ArrowUpRight, Pause, Play } from 'lucide-react'
import Link from 'next/link'
import { useCallback, useEffect, useRef, useState } from 'react'
import type { BannerVM } from '@/lib/view-models'
import { cn } from '../ui/cn'

const INTERVAL = 5000

/**
 * Sponsored carousel (WAI-ARIA carousel pattern): scroll-snap for native swipe,
 * auto-advance that pauses on hover/focus, honours reduced-motion, and an
 * explicit pause control (WCAG 2.2.2).
 */
export function AdCarousel({ banners }: { banners: BannerVM[] }) {
  const track = useRef<HTMLDivElement>(null)
  const [index, setIndex] = useState(0)
  const [paused, setPaused] = useState(false)
  const [userPaused, setUserPaused] = useState(false)
  const [reduced, setReduced] = useState(false)

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
    if (banners.length < 2 || paused || userPaused || reduced) return
    const t = setInterval(() => goTo((index + 1) % banners.length), INTERVAL)
    return () => clearInterval(t)
  }, [banners.length, paused, userPaused, reduced, index, goTo])

  const onScroll = () => {
    const el = track.current
    if (el) setIndex(Math.round(el.scrollLeft / el.clientWidth))
  }

  if (banners.length === 0) return null
  const autoplaying = banners.length > 1 && !userPaused && !reduced

  return (
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
          const external = b.actionLink?.startsWith('http')
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
                {b.actionLink && (
                  <span className="inline-flex items-center gap-1 pt-1 text-label font-semibold text-white">
                    {b.actionLabel}
                    <ArrowUpRight className="size-4" aria-hidden="true" />
                  </span>
                )}
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
              {b.actionLink ? (
                external ? (
                  <a href={b.actionLink} target="_blank" rel="noopener noreferrer" className="block rounded-[var(--radius-panel)]">
                    {Body}
                    <span className="sr-only"> (opens in a new tab)</span>
                  </a>
                ) : (
                  <Link href={b.actionLink} className="block rounded-[var(--radius-panel)]">
                    {Body}
                  </Link>
                )
              ) : (
                Body
              )}
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
  )
}
