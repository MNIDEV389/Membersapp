'use client'

import { Check, Eye, Heart, Info, UserPlus, X } from 'lucide-react'
import type { PostVM } from '@/lib/view-models'
import { timeAgo } from '@/lib/format'
import { Avatar, StatusPill, type Tone } from '../ui/Badges'
import { Dialog } from '../ui/Dialog'
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
  post: PostVM | null
  isRequested: boolean
  isMine: boolean
  onClose: () => void
  onInfo: (post: PostVM) => void
  onRequest: (post: PostVM) => void
  onToggleLike: (post: PostVM) => void
  onOpenSeenBy: (post: PostVM) => void
  isLiked?: boolean
  likesCount?: number
  viewsCount?: number
}

export function PostDetailModal({
  post,
  isRequested,
  isMine,
  onClose,
  onInfo,
  onRequest,
  onToggleLike,
  onOpenSeenBy,
  isLiked,
  likesCount,
  viewsCount,
}: Props) {
  if (!post) return null

  const m = post.taggedMember
  const liked = isLiked ?? post.isLikedByMe
  const likes = likesCount ?? post.likesCount
  const views = viewsCount ?? post.viewsCount

  return (
    <Dialog
      open={Boolean(post)}
      onClose={onClose}
      title={post.title}
      size="md"
      header={
        <div className="relative border-b border-black/[0.08] px-5 py-4">
          <div className="flex items-center justify-between gap-3 pr-8">
            <div className="flex items-center gap-3 min-w-0">
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
            </div>
            <StatusPill tone={categoryTone[post.category] ?? 'neutral'}>
              {post.badgeText || post.category}
            </StatusPill>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="absolute right-3.5 top-3.5 grid size-8 place-items-center rounded-full text-muted transition-colors hover:bg-subtle hover:text-navy"
            aria-label="Close"
          >
            <X className="size-4" />
          </button>
        </div>
      }
      footerClassName="flex-row items-center justify-between bg-[#FAFAFC] px-4 py-3 sm:px-5 sm:py-3"
      footer={
        <>
          <div className="flex items-center gap-2">
            {/* Like button */}
            <button
              type="button"
              onClick={() => onToggleLike(post)}
              className={cn(
                'inline-flex h-8 items-center gap-1.5 rounded-full px-3 text-[12.5px] font-semibold transition-all active:scale-95',
                liked
                  ? 'bg-[#FF2D55]/10 text-[#FF2D55]'
                  : 'bg-black/[0.04] text-[#6E6E73] hover:text-[#FF2D55]',
              )}
            >
              <Heart
                className={cn('size-4 transition-transform', liked && 'fill-current scale-110')}
              />
              <span>{likes}</span>
            </button>

            {/* Views counter & seen by trigger */}
            <button
              type="button"
              onClick={() => onOpenSeenBy(post)}
              className="inline-flex h-8 items-center gap-1.5 rounded-full bg-black/[0.04] px-3 text-[12.5px] font-medium text-[#6E6E73] transition-colors hover:bg-black/[0.08] hover:text-navy"
            >
              <Eye className="size-3.5" />
              <span>{views} views</span>
            </button>
          </div>

          <div className="flex items-center gap-2">
            {m && (
              <button
                type="button"
                onClick={() => {
                  onClose()
                  onInfo(post)
                }}
                className="inline-flex h-8 items-center gap-1.5 rounded-full border border-black/10 bg-[#F2F4F7] px-3 text-[12.5px] font-semibold text-[#1C1C1E] transition-colors hover:bg-[#E5E7EB]"
              >
                <Info className="size-3.5" />
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
                  onClick={() => {
                    onClose()
                    onRequest(post)
                  }}
                  className="inline-flex h-8 items-center gap-1.5 rounded-full bg-[#007AFF] px-3.5 text-[12.5px] font-semibold text-white shadow-sm transition-all hover:bg-[#0066E0] active:scale-98"
                >
                  <UserPlus className="size-3.5" />
                  Request
                </button>
              )
            )}
          </div>
        </>
      }
    >
      <div className="space-y-4">
        {post.image && (
          <div className="overflow-hidden rounded-2xl bg-subtle">
            <img
              src={post.image.url}
              alt={post.image.alt || post.title}
              className="max-h-[380px] w-full object-cover"
            />
          </div>
        )}

        <h1 className="text-[19px] font-bold leading-snug text-navy">
          {post.title}
        </h1>

        {post.content && (
          <div className="whitespace-pre-line text-[14.5px] leading-relaxed text-[#1C1C1E]/90">
            {post.content}
          </div>
        )}
      </div>
    </Dialog>
  )
}
