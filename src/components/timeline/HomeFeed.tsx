'use client'

import { ArrowRight, Newspaper } from 'lucide-react'
import Link from 'next/link'
import { Fragment, useMemo, useState } from 'react'
import { TIMELINE_FILTERS } from '@/lib/constants'
import type { BannerVM, ID, PostVM } from '@/lib/view-models'
import { ContactRequestDialog } from '../modals/ContactRequestDialog'
import { ImageViewer } from '../modals/ImageViewer'
import { MemberInfoDialog } from '../modals/MemberInfoDialog'
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

export function HomeFeed({ firstName, myId, posts, banners, requestedMemberIds }: Props) {
  const [filter, setFilter] = useState('all')
  const [requested, setRequested] = useState(() => new Set(requestedMemberIds))
  const [infoPost, setInfoPost] = useState<PostVM | null>(null)
  const [requestPost, setRequestPost] = useState<PostVM | null>(null)
  const [imagePost, setImagePost] = useState<PostVM | null>(null)

  const counts = useMemo(() => {
    const c: Record<string, number> = {}
    for (const f of TIMELINE_FILTERS) c[f.id] = f.categories ? posts.filter((p) => f.categories!.includes(p.category)).length : posts.length
    return c
  }, [posts])

  const visible = useMemo(() => {
    const f = TIMELINE_FILTERS.find((x) => x.id === filter)
    return f?.categories ? posts.filter((p) => f.categories!.includes(p.category)) : posts
  }, [filter, posts])

  const isRequested = (p: PostVM | null) => Boolean(p?.taggedMember && requested.has(String(p.taggedMember.id)))
  const isMine = (p: PostVM | null) => Boolean(p?.taggedMember && String(p.taggedMember.id) === String(myId))

  return (
    <div className="space-y-6">
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

        {posts.length > 0 && <FilterChips value={filter} onChange={setFilter} counts={counts} />}

        {posts.length === 0 ? (
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
                  onExpand={setImagePost}
                />
                {i === 1 && <SubmitPrompt />}
              </Fragment>
            ))}
            {visible.length < 2 && <SubmitPrompt />}
          </div>
        )}
      </section>

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
      <ContactRequestDialog
        member={requestPost?.taggedMember ?? null}
        postId={requestPost?.id}
        onClose={() => setRequestPost(null)}
        onRequested={(id) => setRequested((s) => new Set(s).add(String(id)))}
      />
      <ImageViewer image={imagePost?.image ?? null} title={imagePost?.title} onClose={() => setImagePost(null)} />
    </div>
  )
}

function SubmitPrompt() {
  return (
    <aside className="flex items-center gap-4 rounded-[var(--radius-card)] bg-gradient-to-br from-navy to-[#173a7a] p-5 text-white">
      <div className="min-w-0 flex-1 space-y-1">
        <p className="text-caption font-semibold uppercase tracking-wider text-on-navy-muted">Need a partner or vendor?</p>
        <p className="text-body font-semibold">Send your requirement to MNI</p>
        <p className="text-label text-on-navy-muted">We review it and share it with the right members.</p>
      </div>
      <Link
        href="/submit"
        className="inline-flex h-11 shrink-0 items-center gap-1.5 rounded-[var(--radius-control)] bg-white px-4 text-label font-semibold text-navy hover:bg-pale"
      >
        Submit
        <ArrowRight className="size-4" aria-hidden="true" />
      </Link>
    </aside>
  )
}
