'use client'

import { ArrowRight, Newspaper } from 'lucide-react'
import Link from 'next/link'
import { Fragment, useMemo, useState } from 'react'
import { TIMELINE_FILTERS } from '@/lib/constants'
import { api } from '@/lib/client-api'
import type { BannerVM, ID, PostSeenByMember, PostVM } from '@/lib/view-models'
import { ContactRequestDialog } from '../modals/ContactRequestDialog'
import { MemberInfoDialog } from '../modals/MemberInfoDialog'
import { PostDetailModal } from '../modals/PostDetailModal'
import { SeenByDialog } from '../modals/SeenByDialog'
import { EmptyState } from '../ui/Feedback'
import { AdCarousel } from './AdCarousel'
import { FilterChips } from './FilterChips'
import { TimelineCard } from './TimelineCard'

interface Props {
  firstName: string
  myId: ID
  posts: PostVM[]
  banners: BannerVM[]
  requestedMemberIds: string[]
}

const greeting = () => {
  const h = Number(new Date().toLocaleString('en-IN', { hour: 'numeric', hour12: false, timeZone: 'Asia/Kolkata' }))
  return h < 12 ? 'Good morning' : h < 17 ? 'Good afternoon' : 'Good evening'
}

export function HomeFeed({ firstName, myId, posts: initialPosts, banners, requestedMemberIds }: Props) {
  const [feedPosts, setFeedPosts] = useState<PostVM[]>(initialPosts)
  const [filter, setFilter] = useState('all')
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
    const f = TIMELINE_FILTERS.find((x) => x.id === filter)
    return f?.categories ? feedPosts.filter((p) => f.categories!.includes(p.category)) : feedPosts
  }, [filter, feedPosts])

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

        {feedPosts.length > 0 && <FilterChips value={filter} onChange={setFilter} counts={counts} />}

        {feedPosts.length === 0 ? (
          <EmptyState icon={<Newspaper className="size-5" aria-hidden="true" />} title="Nothing on the timeline yet">
            MNI will post opportunities, requirements and member spotlights here.
          </EmptyState>
        ) : visible.length === 0 ? (
          <EmptyState icon={<Newspaper className="size-5" aria-hidden="true" />} title="No posts in this category">
            Try another filter.
          </EmptyState>
        ) : (
          <div className="space-y-4">
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
