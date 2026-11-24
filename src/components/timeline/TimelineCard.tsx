'use client'

import { Check, Expand, Flag, Info, MoreVertical, Trash2, UserPlus } from 'lucide-react'
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
  onExpand: (post: PostVM) => void
  onReport?: (post: PostVM) => void
  onRemove?: (post: PostVM) => void
}

/** Renders image-only, text-only and image+text posts without empty placeholders. */
export function TimelineCard({ post, isRequested, isMine, onInfo, onRequest, onExpand, onReport, onRemove }: Props) {
  const [expanded, setExpanded] = useState(false)
  const [imageFailed, setImageFailed] = useState(false)
  const [menuOpen, setMenuOpen] = useState(false)
  const m = post.taggedMember
  const hasImage = Boolean(post.image) && !imageFailed
  const hasText = (post.postType !== 'image_only' || imageFailed) && Boolean(post.content)
  const long = (post.content?.length ?? 0) > 260

  return (
    <article aria-labelledby={`post-${post.id}`} className="overflow-hidden rounded-[var(--radius-card)] border border-line bg-surface shadow-card">
      <header className="flex items-center gap-3 px-4 pt-4">
        {m ? <Avatar initials={m.avatarInitials} src={m.avatarUrl} size="sm" /> : <Avatar initials="MNI" size="sm" className="text-[10px]" />}
        <div className="min-w-0 flex-1">
          <p className="truncate text-label font-semibold text-navy">{m ? m.fullName : 'MNI Admin'}</p>
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
        <StatusPill tone={categoryTone[post.category] ?? 'neutral'}>{post.badgeText || post.category}</StatusPill>
        <div className="relative ml-1">
          <button
            type="button"
            onClick={() => setMenuOpen((v) => !v)}
            className="grid size-8 place-items-center rounded-full text-muted hover:bg-subtle hover:text-navy"
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
                  onClick={() => { setMenuOpen(false); onReport?.(post) }}
                  className="flex w-full items-center gap-2.5 px-4 py-2.5 text-left text-label font-medium text-ink hover:bg-subtle"
                >
                  <Flag className="size-4 text-warning" aria-hidden="true" />
                  Report
                </button>
              )}
              {isMine && (
                <button
                  type="button"
                  onClick={() => { setMenuOpen(false); onRemove?.(post) }}
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

      <div className="space-y-3 px-4 pt-3">
        <h3 id={`post-${post.id}`} className="text-section font-bold leading-snug text-navy">
          {post.title}
        </h3>
        {hasImage && post.image && (
          <button
            type="button"
            onClick={() => onExpand(post)}
            className="group relative block w-full overflow-hidden rounded-[var(--radius-art)] bg-subtle"
            aria-label={`Expand image: ${post.image.alt || post.title}`}
          >
            <img
              src={post.image.url}
              alt={post.image.alt || ''}
              loading="lazy"
              onError={() => setImageFailed(true)}
              className="max-h-[420px] w-full object-cover transition-transform duration-300 group-hover:scale-[1.015]"
            />
          </button>
        )}
        {hasText && (
          <div>
            <p className={cn('whitespace-pre-line text-body text-ink/90', long && !expanded && 'line-clamp-5')}>{post.content}</p>
            {long && (
              <button
                type="button"
                onClick={() => setExpanded((v) => !v)}
                className="mt-1 text-label font-semibold text-brand hover:underline"
                aria-expanded={expanded}
              >
                {expanded ? 'Show less' : 'Read more'}
              </button>
            )}
          </div>
        )}
      </div>

      {(m || hasImage) && (
        <footer className="mt-4 flex items-center gap-2 border-t border-line px-3 py-2.5">
          {m && (
            <ActionButton onClick={() => onInfo(post)} icon={<Info className="size-[18px]" aria-hidden="true" />}>
              Info
            </ActionButton>
          )}
          {m && !isMine && (
            isRequested ? (
              <span className="inline-flex h-10 flex-1 items-center justify-center gap-1.5 rounded-[var(--radius-control)] bg-success-bg text-label font-semibold text-success">
                <Check className="size-[18px]" aria-hidden="true" />
                Requested
              </span>
            ) : (
              <ActionButton
                primary
                onClick={() => onRequest(post)}
                icon={<UserPlus className="size-[18px]" aria-hidden="true" />}
                ariaLabel={`Request ${m.fullName}’s contact`}
              >
                Request
              </ActionButton>
            )
          )}
          {hasImage && (
            <ActionButton onClick={() => onExpand(post)} icon={<Expand className="size-[18px]" aria-hidden="true" />} compact={Boolean(m)}>
              {m ? <span className="sr-only">Expand image</span> : 'Expand image'}
            </ActionButton>
          )}
        </footer>
      )}
    </article>
  )
}

function ActionButton({ children, icon, onClick, primary, compact, ariaLabel }: { children: React.ReactNode; icon: React.ReactNode; onClick: () => void; primary?: boolean; compact?: boolean; ariaLabel?: string }) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-label={ariaLabel}
      className={cn(
        'inline-flex h-10 items-center justify-center gap-1.5 whitespace-nowrap rounded-[var(--radius-control)] text-label font-semibold transition-colors',
        compact ? 'w-10 shrink-0' : 'flex-1 px-3',
        primary ? 'bg-brand text-white hover:bg-brand-strong' : 'bg-pale text-navy hover:bg-[#dde7fb]',
      )}
    >
      {icon}
      {children}
    </button>
  )
}
