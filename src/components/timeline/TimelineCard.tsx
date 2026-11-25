'use client'

import { Check, Eye, Flag, Heart, Info, MoreVertical, Trash2, UserPlus } from 'lucide-react'
import { useState } from 'react'
import type { PostVM } from '@/lib/view-models'
import { timeAgo } from '@/lib/format'
import { Avatar, StatusPill, type Tone } from '../ui/Badges'
import { cn } from '../ui/cn'

const categoryTone: Record<string, Tone> = {
  Opportunity: 'success',
  Requirement: 'warning',
  Announcement: 'brand',
  Promotion: 'brand',
  'Member Spotlight': 'navy',
  'Community Meetup': 'neutral',
}

interface Props {
  post: PostVM
  isRequested: boolean
  isMine: boolean
  onInfo: (post: PostVM) => void
  onRequest: (post: PostVM) => void
  onReadMore: (post: PostVM) => void
  onToggleLike: (post: PostVM) => void
  onOpenSeenBy: (post: PostVM) => void
  onReport?: (post: PostVM) => void
  onRemove?: (post: PostVM) => void
}

/** Renders cards with compact prominent actions, like & views counter, and read more modal trigger. */
export function TimelineCard({
  post,
  isRequested,
  isMine,
  onInfo,
  onRequest,
  onReadMore,
  onToggleLike,
  onOpenSeenBy,
  onReport,
  onRemove,
}: Props) {
  const [imageFailed, setImageFailed] = useState(false)
  const [menuOpen, setMenuOpen] = useState(false)
  const m = post.taggedMember
  const hasImage = Boolean(post.image) && !imageFailed
  const hasText = (post.postType !== 'image_only' || imageFailed) && Boolean(post.content)
  const content = post.content || ''
  const isLong = content.length > 200

  return (
    <article
      aria-labelledby={`post-${post.id}`}
      className="overflow-hidden rounded-[20px] border border-black/[0.08] bg-white shadow-[0_2px_12px_rgba(0,0,0,0.04)] transition-shadow hover:shadow-[0_4px_20px_rgba(0,0,0,0.06)]"
    >
      <header className="flex items-center gap-3 px-4 pt-4">
        {m ? (
          <Avatar initials={m.avatarInitials} src={m.avatarUrl} size="sm" />
        ) : (
          <Avatar initials="MNI" src="/brand/mni-logo.webp" size="sm" />
        )}
        <div className="min-w-0 flex-1">
          <p className="truncate text-label font-semibold text-navy">
            {m ? m.fullName : 'MNI Admin'}
          </p>
          <p className="truncate text-caption text-muted">
            {m ? m.businessName : 'Network bulletin'}
            {post.publishedAt && (
              <>
                {' · '}
                <time dateTime={post.publishedAt}>{timeAgo(post.publishedAt)}</time>
              </>
            )}
          </p>
        </div>
        <StatusPill tone={categoryTone[post.category] ?? 'neutral'}>
          {post.badgeText || post.category}
        </StatusPill>
        <div className="relative ml-1">
          <button
            type="button"
            onClick={() => setMenuOpen((v) => !v)}
            className="grid size-8 place-items-center rounded-full text-muted transition-colors hover:bg-subtle hover:text-navy"
            aria-label="Post actions"
            aria-expanded={menuOpen}
          >
            <MoreVertical className="size-4" aria-hidden="true" />
          </button>
          {menuOpen && (
            <div className="absolute right-0 top-9 z-50 w-44 overflow-hidden rounded-xl border border-line bg-surface shadow-lg">
              {!isMine && (
                <button
                  type="button"
                  onClick={() => {
                    setMenuOpen(false)
                    onReport?.(post)
                  }}
                  className="flex w-full items-center gap-2.5 px-4 py-2.5 text-left text-label font-medium text-ink hover:bg-subtle"
                >
                  <Flag className="size-4 text-warning" aria-hidden="true" />
                  Report
                </button>
              )}
              {isMine && (
                <button
                  type="button"
                  onClick={() => {
                    setMenuOpen(false)
                    onRemove?.(post)
                  }}
                  className="flex w-full items-center gap-2.5 px-4 py-2.5 text-left text-label font-medium text-danger hover:bg-danger-bg/40"
                >
                  <Trash2 className="size-4" aria-hidden="true" />
                  Remove
                </button>
              )}
            </div>
          )}
        </div>
      </header>

      <div className="space-y-3 px-4 pt-3 pb-3">
        <h3
          id={`post-${post.id}`}
          onClick={() => onReadMore(post)}
          className="cursor-pointer text-section font-bold leading-snug text-navy transition-colors hover:text-[#007AFF]"
        >
          {post.title}
        </h3>

        {hasImage && post.image && (
          <button
            type="button"
            onClick={() => onReadMore(post)}
            className="group relative block w-full overflow-hidden rounded-[var(--radius-art)] bg-subtle"
            aria-label={`Open post details: ${post.image.alt || post.title}`}
          >
            <img
              src={post.image.url}
              alt={post.image.alt || ''}
              loading="lazy"
              onError={() => setImageFailed(true)}
              className="max-h-[380px] w-full object-cover transition-transform duration-300 group-hover:scale-[1.015]"
            />
          </button>
        )}

        {hasText && (
          <div>
            <p className="whitespace-pre-line text-body text-ink/90">
              {isLong ? `${content.slice(0, 190)}…` : content}
              {isLong && (
                <button
                  type="button"
                  onClick={() => onReadMore(post)}
                  className="ml-1.5 inline-block font-semibold text-[#007AFF] hover:underline"
                >
                  Read more
                </button>
              )}
            </p>
          </div>
        )}
      </div>

      {/* Unified Apple HIG Footer across ALL posts with Likes, Views, and compact Prominent Actions */}
      <footer className="flex items-center justify-between border-t border-black/[0.06] bg-[#FAFAFC] px-4 py-2.5">
        <div className="flex items-center gap-2">
          {/* Like button with like count */}
          <button
            type="button"
            onClick={() => onToggleLike(post)}
            className={cn(
              'inline-flex h-8 items-center gap-1.5 rounded-full px-3 text-[12.5px] font-semibold transition-all active:scale-95',
              post.isLikedByMe
                ? 'bg-[#FF2D55]/10 text-[#FF2D55]'
                : 'bg-black/[0.04] text-[#6E6E73] hover:text-[#FF2D55]',
            )}
            title={post.isLikedByMe ? 'Unlike' : 'Like'}
          >
            <Heart
              className={cn(
                'size-4 transition-transform',
                post.isLikedByMe && 'fill-current scale-110',
              )}
            />
            <span>{post.likesCount}</span>
          </button>

          {/* Views count & seen-by list trigger */}
          <button
            type="button"
            onClick={() => onOpenSeenBy(post)}
            className="inline-flex h-8 items-center gap-1.5 rounded-full bg-black/[0.04] px-3 text-[12.5px] font-medium text-[#6E6E73] transition-colors hover:bg-black/[0.08] hover:text-navy active:scale-95"
            title="See who viewed this post"
          >
            <Eye className="size-3.5" />
            <span>{post.viewsCount} views</span>
          </button>
        </div>

        <div className="flex items-center gap-2">
          {m && (
            <button
              type="button"
              onClick={() => onInfo(post)}
              className="inline-flex h-8 items-center gap-1.5 rounded-full border border-black/10 bg-white px-3 text-[12.5px] font-semibold text-[#1C1C1E] shadow-sm transition-colors hover:bg-[#F2F4F7] active:scale-95"
            >
              <Info className="size-3.5 text-[#007AFF]" />
              Info
            </button>
          )}

          {m && !isMine && (
            isRequested ? (
              <span className="inline-flex h-8 items-center gap-1.5 rounded-full bg-success-bg px-3 text-[12.5px] font-semibold text-success">
                <Check className="size-3.5" />
                Requested
              </span>
            ) : (
              <button
                type="button"
                onClick={() => onRequest(post)}
                className="inline-flex h-8 items-center gap-1.5 rounded-full bg-[#007AFF] px-3.5 text-[12.5px] font-semibold text-white shadow-[0_2px_8px_rgba(0,122,255,0.25)] transition-all hover:bg-[#0066E0] active:scale-95"
              >
                <UserPlus className="size-3.5" />
                Request
              </button>
            )
          )}
        </div>
      </footer>
    </article>
  )
}
