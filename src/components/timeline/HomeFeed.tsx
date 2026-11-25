'use client'

import { ArrowRight, Newspaper, Trophy } from 'lucide-react'
import Link from 'next/link'
import { Fragment, useMemo, useState } from 'react'
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

const UNIFIED_FILTERS = [
  { id: 'all', label: 'All' },
  { id: 'need', label: 'Need' },
  { id: 'give', label: 'Give' },
  { id: 'wins', label: 'Wins' },
  { id: 'announcements', label: 'Announcements' },
  { id: 'meetups', label: 'Meetups' },
  { id: 'spotlight', label: 'Spotlight' },
] as const

type UnifiedFilterId = (typeof UNIFIED_FILTERS)[number]['id']

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
  const [activeFilter, setActiveFilter] = useState<UnifiedFilterId>('all')
  const [celebrateOpen, setCelebrateOpen] = useState(false)
  const [requested, setRequested] = useState(() => new Set(requestedMemberIds))
  const [infoPost, setInfoPost] = useState<PostVM | null>(null)
  const [requestPost, setRequestPost] = useState<PostVM | null>(null)
  const [detailPost, setDetailPost] = useState<PostVM | null>(null)
  const [seenByPost, setSeenByPost] = useState<PostVM | null>(null)
  const [seenByList, setSeenByList] = useState<PostSeenByMember[]>([])
  const [loadingSeenBy, setLoadingSeenBy] = useState(false)

  const counts = useMemo<Record<UnifiedFilterId, number>>(() => ({
    all: feedPosts.length,
    need: feedPosts.filter((p) => p.category === 'Requirement').length,
    give: feedPosts.filter((p) => p.category === 'Opportunity' || p.category === 'Promotion').length,
    wins: celebrations.length,
    announcements: feedPosts.filter((p) => p.category === 'Announcement').length,
    meetups: feedPosts.filter((p) => p.category === 'Community Meetup').length,
    spotlight: feedPosts.filter((p) => p.category === 'Member Spotlight').length,
  }), [feedPosts, celebrations.length])

  const visible = useMemo(() => {
    if (activeFilter === 'need') return feedPosts.filter((p) => p.category === 'Requirement')
    if (activeFilter === 'give') return feedPosts.filter((p) => p.category === 'Opportunity' || p.category === 'Promotion')
    if (activeFilter === 'announcements') return feedPosts.filter((p) => p.category === 'Announcement')
    if (activeFilter === 'meetups') return feedPosts.filter((p) => p.category === 'Community Meetup')
    if (activeFilter === 'spotlight') return feedPosts.filter((p) => p.category === 'Member Spotlight')
    return feedPosts
  }, [activeFilter, feedPosts])

  const isRequested = (p: PostVM | null) => Boolean(p?.taggedMember && requested.has(String(p.taggedMember.id)))
  const isMine = (p: PostVM | null) => Boolean(p?.taggedMember && String(p.taggedMember.id) === String(myId))

  const handleToggleClap = async (item: CelebrationVM) => {
    const nextClapped = !item.isClappedByMe
    const nextCount = Math.max(0, item.clapsCount + (nextClapped ? 1 : -1))
    setCelebrations((prev) =>
      prev.map((c) => (c.id === item.id ? { ...c, isClappedByMe: nextClapped, clapsCount: nextCount } : c)),
    )
    try {
      const res = await api<{ ok: boolean; clapsCount: number; isClappedByMe: boolean }>(
        `/api/app/celebrations/${item.id}/clap`,
        { body: {} },
      )
      setCelebrations((prev) =>
        prev.map((c) =>
          c.id === item.id ? { ...c, isClappedByMe: res.isClappedByMe, clapsCount: res.clapsCount } : c,
        ),
      )
    } catch {
      setCelebrations((prev) =>
        prev.map((c) =>
          c.id === item.id ? { ...c, isClappedByMe: item.isClappedByMe, clapsCount: item.clapsCount } : c,
        ),
      )
    }
  }

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
      <div>
        <p className="text-label text-muted">{greeting()},</p>
        <h1 className="text-title font-bold text-navy">{firstName}</h1>
      </div>

      <AdCarousel banners={banners} />

      <section aria-labelledby="feed-heading" className="space-y-4">
        <div>
          <h2 id="feed-heading" className="text-section font-bold text-navy">
            Inside your network
          </h2>
          <p className="text-label text-muted">Opportunities and introductions curated by MNI.</p>
        </div>

        {/* Single Unified Apple Filter Strip (No stacked tabs) */}
        <div role="tablist" aria-label="Filter timeline" className="no-scrollbar flex gap-2 overflow-x-auto pb-1">
          {UNIFIED_FILTERS.map((f) => {
            const selected = activeFilter === f.id
            const count = counts[f.id]
            return (
              <button
                key={f.id}
                type="button"
                role="tab"
                aria-selected={selected}
                onClick={() => setActiveFilter(f.id)}
                className={cn(
                  'inline-flex h-9 shrink-0 items-center gap-1.5 rounded-full px-3.5 text-[13px] font-semibold transition-all',
                  selected
                    ? 'bg-navy text-white shadow-sm'
                    : 'bg-surface text-muted ring-1 ring-inset ring-line hover:text-navy',
                )}
              >
                <span>{f.label}</span>
                {count > 0 && (
                  <span
                    className={cn(
                      'rounded-full px-1.5 py-0.5 text-[10.5px] font-bold leading-none',
                      selected ? 'bg-white/20 text-white' : 'bg-subtle text-muted',
                    )}
                  >
                    {count}
                  </span>
                )}
              </button>
            )
          })}
        </div>

        {activeFilter === 'wins' ? (
          <div className="space-y-4">
            <div className="flex items-center justify-between rounded-2xl border border-[#FDE68A] bg-[#FFFBEB] px-4 py-3">
              <div className="min-w-0">
                <p className="text-label font-bold text-[#92400E]">Closed Business Wins</p>
                <p className="text-caption text-[#92400E]/80">Share a deal closed via MNI (+50 pts)</p>
              </div>
              <button
                type="button"
                onClick={() => setCelebrateOpen(true)}
                className="inline-flex h-8 shrink-0 items-center gap-1.5 rounded-full bg-[#D97706] px-3.5 text-[12px] font-bold text-white shadow-sm hover:bg-[#B45309] active:scale-95"
              >
                <Trophy className="size-3.5" aria-hidden="true" />
                Share Win
              </button>
            </div>
            {celebrations.length === 0 ? (
              <EmptyState icon={<Trophy className="size-5" aria-hidden="true" />} title="No closed business celebrations yet">
                Be the first to share a deal or partnership closed through MNI!
              </EmptyState>
            ) : (
              celebrations.map((c) => <CelebrationCard key={c.id} item={c} onClap={handleToggleClap} />)
            )}
          </div>
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
            {activeFilter === 'all' && celebrations[0] && (
              <CelebrationCard item={celebrations[0]} onClap={handleToggleClap} />
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
