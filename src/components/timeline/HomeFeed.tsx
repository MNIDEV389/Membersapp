'use client'

import { ArrowRight, Calendar, Newspaper, Sparkles, Trophy, Users } from 'lucide-react'
import Link from 'next/link'
import { Fragment, useMemo, useState } from 'react'
import { TIMELINE_FILTERS } from '@/lib/constants'
import { api } from '@/lib/client-api'
import type { BannerVM, CelebrationVM, ID, PostSeenByMember, PostVM } from '@/lib/view-models'
import { CelebrationModal } from '../modals/CelebrationModal'
import { ContactRequestDialog } from '../modals/ContactRequestDialog'
import { MemberInfoDialog } from '../modals/MemberInfoDialog'
import { PostDetailModal } from '../modals/PostDetailModal'
import { SeenByDialog } from '../modals/SeenByDialog'
import { EmptyState } from '../ui/Feedback'
import { cn } from '../ui/cn'
import { AdCarousel } from './AdCarousel'
import { CelebrationCard } from './CelebrationCard'
import { FilterChips } from './FilterChips'
import { TimelineCard } from './TimelineCard'

interface Props {
  firstName: string
  myId: ID
  posts: PostVM[]
  banners: BannerVM[]
  requestedMemberIds: string[]
  celebrations?: CelebrationVM[]
  membersForPicker?: { id: number; fullName: string; businessName: string }[]
}

const greeting = () => {
  const h = Number(new Date().toLocaleString('en-IN', { hour: 'numeric', hour12: false, timeZone: 'Asia/Kolkata' }))
  return h < 12 ? 'Good morning' : h < 17 ? 'Good afternoon' : 'Good evening'
}

export function HomeFeed({
  firstName,
  myId,
  posts: initialPosts,
  banners,
  requestedMemberIds,
  celebrations: initialCelebrations = [],
  membersForPicker = [],
}: Props) {
  const [feedPosts, setFeedPosts] = useState<PostVM[]>(initialPosts)
  const [celebrations, setCelebrations] = useState<CelebrationVM[]>(initialCelebrations)
  const [feedMode, setFeedMode] = useState<'all' | 'need' | 'give' | 'celebrations'>('all')
  const [filter, setFilter] = useState('all')
  const [celebrateOpen, setCelebrateOpen] = useState(false)
  const [requested, setRequested] = useState(() => new Set(requestedMemberIds))
  const [infoPost, setInfoPost] = useState<PostVM | null>(null)
  const [requestPost, setRequestPost] = useState<PostVM | null>(null)
  const [detailPost, setDetailPost] = useState<PostVM | null>(null)
  const [seenByPost, setSeenByPost] = useState<PostVM | null>(null)
  const [seenByList, setSeenByList] = useState<PostSeenByMember[]>([])
  const [loadingSeenBy, setLoadingSeenBy] = useState(false)

  const counts = useMemo(() => {
    const c: Record<string, number> = {}
    for (const f of TIMELINE_FILTERS) {
      c[f.id] = f.categories
        ? feedPosts.filter((p) => f.categories!.includes(p.category)).length
        : feedPosts.length
    }
    return c
  }, [feedPosts])

  const visible = useMemo(() => {
    if (feedMode === 'need') {
      return feedPosts.filter((p) => p.category === 'Requirement')
    }
    if (feedMode === 'give') {
      return feedPosts.filter((p) => p.category === 'Opportunity' || p.category === 'Promotion')
    }
    const f = TIMELINE_FILTERS.find((x) => x.id === filter)
    return f?.categories ? feedPosts.filter((p) => f.categories!.includes(p.category)) : feedPosts
  }, [feedMode, filter, feedPosts])

  const isRequested = (p: PostVM | null) => Boolean(p?.taggedMember && requested.has(String(p.taggedMember.id)))
  const isMine = (p: PostVM | null) => Boolean(p?.taggedMember && String(p.taggedMember.id) === String(myId))

  // Optimistic Like toggle
  const handleToggleLike = async (post: PostVM) => {
    const nextLiked = !post.isLikedByMe
    const nextCount = post.likesCount + (nextLiked ? 1 : -1)

    // Update in feed list
    setFeedPosts((prev) =>
      prev.map((p) => (p.id === post.id ? { ...p, isLikedByMe: nextLiked, likesCount: nextCount } : p)),
    )
    if (detailPost && detailPost.id === post.id) {
      setDetailPost((p) => (p ? { ...p, isLikedByMe: nextLiked, likesCount: nextCount } : null))
    }

    try {
      const res = await api<{ ok: boolean; likesCount: number; isLikedByMe: boolean }>(
        `/api/app/posts/${post.id}/like`,
        { body: {} },
      )
      setFeedPosts((prev) =>
        prev.map((p) =>
          p.id === post.id ? { ...p, isLikedByMe: res.isLikedByMe, likesCount: res.likesCount } : p,
        ),
      )
      if (detailPost && detailPost.id === post.id) {
        setDetailPost((p) =>
          p ? { ...p, isLikedByMe: res.isLikedByMe, likesCount: res.likesCount } : null,
        )
      }
    } catch {
      // Revert on error
      setFeedPosts((prev) =>
        prev.map((p) =>
          p.id === post.id ? { ...p, isLikedByMe: post.isLikedByMe, likesCount: post.likesCount } : p,
        ),
      )
    }
  }

  // Record view & open detail modal
  const handleReadMore = async (post: PostVM) => {
    setDetailPost(post)

    // Record view in background
    if (!post.isViewedByMe) {
      setFeedPosts((prev) =>
        prev.map((p) => (p.id === post.id ? { ...p, isViewedByMe: true, viewsCount: p.viewsCount + 1 } : p)),
      )
      api<{ ok: boolean; viewsCount: number }>(`/api/app/posts/${post.id}/view`, { body: {} })
        .then((res) => {
          setFeedPosts((prev) =>
            prev.map((p) => (p.id === post.id ? { ...p, viewsCount: res.viewsCount, isViewedByMe: true } : p)),
          )
        })
        .catch(() => {})
    }
  }

  // Open seen-by list (WhatsApp-style)
  const handleOpenSeenBy = async (post: PostVM) => {
    setSeenByPost(post)
    setSeenByList(post.seenBy ?? [])
    setLoadingSeenBy(true)

    try {
      const res = await api<{ seenBy: PostSeenByMember[] }>(`/api/app/posts/${post.id}/seen-by`)
      setSeenByList(res.seenBy || [])
    } catch {
      // Fallback to local
      setSeenByList(post.seenBy ?? [])
    } finally {
      setLoadingSeenBy(false)
    }
  }

  return (
    <div className="space-y-6 pb-20">
      <div className="flex items-end justify-between gap-3">
        <div>
          <p className="text-label text-muted">{greeting()},</p>
          <h1 className="text-title font-bold text-navy">{firstName}</h1>
        </div>
        <button
          type="button"
          onClick={() => setCelebrateOpen(true)}
          className="inline-flex h-9 shrink-0 items-center gap-1.5 rounded-full bg-[#FFFBEB] px-3.5 text-[12.5px] font-bold text-[#92400E] ring-1 ring-inset ring-[#FDE68A] transition-all hover:bg-[#FEF3C7] active:scale-95"
        >
          <Trophy className="size-3.5 text-[#D97706]" aria-hidden="true" />
          Celebrate Deal
        </button>
      </div>

      {/* Quick Chapter Navigation Pills */}
      <div className="grid grid-cols-2 gap-2.5">
        <Link
          href="/directory"
          className="flex items-center gap-2.5 rounded-2xl border border-black/[0.06] bg-surface px-3.5 py-2.5 shadow-sm transition-all hover:border-brand/30 hover:bg-pale/40 active:scale-[0.98]"
        >
          <span className="grid size-8 shrink-0 place-items-center rounded-xl bg-pale text-brand">
            <Users className="size-4" aria-hidden="true" />
          </span>
          <div className="min-w-0">
            <p className="truncate text-label font-bold text-navy">Member Directory</p>
            <p className="truncate text-[11px] text-muted">Search · City · Match</p>
          </div>
        </Link>
        <Link
          href="/meetups"
          className="flex items-center gap-2.5 rounded-2xl border border-black/[0.06] bg-surface px-3.5 py-2.5 shadow-sm transition-all hover:border-brand/30 hover:bg-pale/40 active:scale-[0.98]"
        >
          <span className="grid size-8 shrink-0 place-items-center rounded-xl bg-[#ECFDF5] text-[#059669]">
            <Calendar className="size-4" aria-hidden="true" />
          </span>
          <div className="min-w-0">
            <p className="truncate text-label font-bold text-navy">Meetups & 1-on-1</p>
            <p className="truncate text-[11px] text-muted">RSVP · Coffee Connect</p>
          </div>
        </Link>
      </div>

      <AdCarousel banners={banners} />

      <section aria-labelledby="feed-heading" className="space-y-4">
        <div>
          <h2 id="feed-heading" className="text-section font-bold text-navy">
            Inside your network
          </h2>
          <p className="text-label text-muted">Opportunities and introductions curated by MNI.</p>
        </div>

        {/* Need vs Give vs Celebrations Mode Bar */}
        <div className="grid grid-cols-4 gap-1 rounded-2xl bg-[#EEF1F5] p-1">
          {[
            { id: 'all', label: 'All' },
            { id: 'need', label: 'Need' },
            { id: 'give', label: 'Give' },
            { id: 'celebrations', label: `Wins (${celebrations.length})` },
          ].map((m) => (
            <button
              key={m.id}
              type="button"
              onClick={() => setFeedMode(m.id as typeof feedMode)}
              className={cn(
                'h-8 rounded-xl text-[12.5px] font-semibold transition-all',
                feedMode === m.id ? 'bg-white text-navy shadow-sm' : 'text-muted hover:text-navy',
              )}
            >
              {m.label}
            </button>
          ))}
        </div>

        {feedMode === 'all' && feedPosts.length > 0 && (
          <FilterChips value={filter} onChange={setFilter} counts={counts} />
        )}

        {feedMode === 'celebrations' ? (
          celebrations.length === 0 ? (
            <EmptyState icon={<Trophy className="size-5" aria-hidden="true" />} title="No closed business celebrations yet">
              Be the first to share a deal or partnership closed through MNI!
            </EmptyState>
          ) : (
            <div className="space-y-4">
              {celebrations.map((c) => (
                <CelebrationCard key={c.id} item={c} />
              ))}
            </div>
          )
        ) : feedPosts.length === 0 ? (
          <EmptyState icon={<Newspaper className="size-5" aria-hidden="true" />} title="Nothing on the timeline yet">
            MNI will post opportunities, requirements and member spotlights here.
          </EmptyState>
        ) : visible.length === 0 ? (
          <EmptyState icon={<Newspaper className="size-5" aria-hidden="true" />} title="No posts in this category">
            Try another filter.
          </EmptyState>
        ) : (
          <div className="space-y-4">
            {feedMode === 'all' && filter === 'all' && celebrations[0] && (
              <CelebrationCard item={celebrations[0]} />
            )}
            {visible.map((post, i) => (
              <Fragment key={post.id}>
                <TimelineCard
                  post={post}
                  isRequested={isRequested(post)}
                  isMine={isMine(post)}
                  onInfo={setInfoPost}
                  onRequest={setRequestPost}
                  onReadMore={handleReadMore}
                  onToggleLike={handleToggleLike}
                  onOpenSeenBy={handleOpenSeenBy}
                />
                {i === 1 && <SubmitPrompt />}
              </Fragment>
            ))}
            {visible.length < 2 && <SubmitPrompt />}
          </div>
        )}
      </section>

      <CelebrationModal
        open={celebrateOpen}
        myId={myId}
        members={membersForPicker}
        onClose={() => setCelebrateOpen(false)}
        onCreated={(c) => setCelebrations((prev) => [c, ...prev])}
      />

      {/* Post Detail Modal (opened when clicking Read more or card) */}
      <PostDetailModal
        post={detailPost}
        isRequested={isRequested(detailPost)}
        isMine={isMine(detailPost)}
        onClose={() => setDetailPost(null)}
        onInfo={setInfoPost}
        onRequest={setRequestPost}
        onToggleLike={handleToggleLike}
        onOpenSeenBy={handleOpenSeenBy}
      />

      {/* WhatsApp-style Seen by Members list */}
      <SeenByDialog
        open={Boolean(seenByPost)}
        onClose={() => setSeenByPost(null)}
        postTitle={seenByPost?.title}
        seenBy={seenByList}
        loading={loadingSeenBy}
      />

      {/* Member Info Dialog */}
      <MemberInfoDialog
        member={infoPost?.taggedMember ?? null}
        postTitle={infoPost?.title}
        isRequested={isRequested(infoPost)}
        isMine={isMine(infoPost)}
        onClose={() => setInfoPost(null)}
        onRequest={() => {
          const p = infoPost
          setInfoPost(null)
          setRequestPost(p)
        }}
      />

      {/* Contact Request Dialog */}
      <ContactRequestDialog
        member={requestPost?.taggedMember ?? null}
        postId={requestPost?.id}
        onClose={() => setRequestPost(null)}
        onRequested={(id) => setRequested((s) => new Set(s).add(String(id)))}
      />
    </div>
  )
}

function SubmitPrompt() {
  return (
    <aside className="flex items-center gap-4 rounded-[var(--radius-card)] bg-gradient-to-br from-navy to-[#173a7a] p-5 text-white shadow-sm">
      <div className="min-w-0 flex-1 space-y-1">
        <p className="text-caption font-semibold uppercase tracking-wider text-on-navy-muted">Need a partner or vendor?</p>
        <p className="text-body font-semibold">Send your requirement to MNI</p>
        <p className="text-label text-on-navy-muted">We review it and share it with the right members.</p>
      </div>
      <Link
        href="/submit"
        className="inline-flex h-11 shrink-0 items-center gap-1.5 rounded-[var(--radius-control)] bg-white px-4 text-label font-semibold text-navy hover:bg-pale active:scale-95"
      >
        Submit
        <ArrowRight className="size-4" aria-hidden="true" />
      </Link>
    </aside>
  )
}
