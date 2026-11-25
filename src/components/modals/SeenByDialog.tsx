'use client'

import { Eye, Users, X } from 'lucide-react'
import type { PostSeenByMember } from '@/lib/view-models'
import { timeAgo } from '@/lib/format'
import { Avatar } from '../ui/Badges'
import { Dialog } from '../ui/Dialog'

interface Props {
  open: boolean
  onClose: () => void
  postTitle?: string
  seenBy: PostSeenByMember[]
  loading?: boolean
}

export function SeenByDialog({ open, onClose, postTitle, seenBy, loading }: Props) {
  return (
    <Dialog
      open={open}
      onClose={onClose}
      title="Seen by"
      size="sm"
      header={
        <div className="relative flex items-center justify-between border-b border-black/[0.08] px-5 py-4">
          <div className="flex items-center gap-2.5">
            <div className="grid size-9 place-items-center rounded-full bg-[#007AFF]/10 text-[#007AFF]">
              <Eye className="size-4" strokeWidth={2.5} />
            </div>
            <div>
              <h2 className="text-[17px] font-bold text-navy">
                Seen by ({seenBy.length})
              </h2>
              {postTitle && (
                <p className="max-w-[240px] truncate text-caption text-muted sm:max-w-xs">
                  {postTitle}
                </p>
              )}
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="grid size-8 place-items-center rounded-full text-muted transition-colors hover:bg-subtle hover:text-navy"
            aria-label="Close"
          >
            <X className="size-4" />
          </button>
        </div>
      }
    >
      <div className="max-h-[60vh] overflow-y-auto px-5 py-3">
        {loading ? (
          <div className="py-8 text-center text-label text-muted">
            Loading views…
          </div>
        ) : seenBy.length === 0 ? (
          <div className="py-10 text-center text-muted">
            <Users className="mx-auto mb-2 size-8 text-muted/60" />
            <p className="text-label font-semibold text-navy">No views recorded yet</p>
            <p className="text-caption">Members who read this post will appear here.</p>
          </div>
        ) : (
          <ul className="divide-y divide-black/[0.04]">
            {seenBy.map((m) => (
              <li key={`${m.id}-${m.viewedAt}`} className="flex items-center justify-between py-3">
                <div className="flex items-center gap-3">
                  <Avatar initials={m.avatarInitials} src={m.avatarUrl} size="sm" />
                  <div className="min-w-0">
                    <p className="truncate text-label font-semibold text-navy">{m.fullName}</p>
                    {m.businessName && (
                      <p className="truncate text-caption text-muted">{m.businessName}</p>
                    )}
                  </div>
                </div>
                <time className="shrink-0 text-[11px] font-medium text-muted">
                  {timeAgo(m.viewedAt)}
                </time>
              </li>
            ))}
          </ul>
        )}
      </div>
    </Dialog>
  )
}
