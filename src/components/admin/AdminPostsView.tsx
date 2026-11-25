'use client'

import { Eye, Heart, Plus, Trash2 } from 'lucide-react'
import { useState } from 'react'
import { POST_CATEGORIES } from '@/lib/constants'
import { api, ApiError } from '@/lib/client-api'
import { formatDate } from '@/lib/format'
import { StatusPill } from '@/components/ui/Badges'
import { Button } from '@/components/ui/Button'
import { Dialog } from '@/components/ui/Dialog'
import { Field, Input, Select, Textarea } from '@/components/ui/Field'
import { useToast } from '@/components/ui/Toast'

export interface AdminPostRow {
  id: number
  title: string
  category: (typeof POST_CATEGORIES)[number]
  status: 'draft' | 'published'
  content: string | null
  taggedMemberName: string | null
  taggedMemberId: number | null
  displayOrder: number
  publishedAt: string | null
  likesCount: number
  viewsCount: number
}

export function AdminPostsView({
  initialPosts,
  members,
}: {
  initialPosts: AdminPostRow[]
  members: { id: number; fullName: string; businessName: string }[]
}) {
  const toast = useToast()
  const [posts, setPosts] = useState<AdminPostRow[]>(initialPosts)
  const [createOpen, setCreateOpen] = useState(false)
  const [saving, setSaving] = useState(false)
  const [form, setForm] = useState({
    title: '',
    category: 'Announcement' as (typeof POST_CATEGORIES)[number],
    content: '',
    taggedMemberId: '',
    status: 'published' as 'draft' | 'published',
    displayOrder: '50',
  })

  const createPost = async () => {
    if (!form.title.trim()) {
      toast('Enter a post title', 'error')
      return
    }
    setSaving(true)
    try {
      const res = await api<{ ok: boolean; post: { id: number; publishedAt?: string | null } }>('/api/admin/posts', {
        body: {
          title: form.title.trim(),
          category: form.category,
          postType: 'text_only',
          content: form.content.trim() || undefined,
          taggedMemberId: form.taggedMemberId ? Number(form.taggedMemberId) : null,
          status: form.status,
          displayOrder: Number(form.displayOrder) || 50,
        },
      })
      const m = members.find((x) => String(x.id) === form.taggedMemberId)
      setPosts((prev) => [
        {
          id: res.post.id,
          title: form.title.trim(),
          category: form.category,
          status: form.status,
          content: form.content.trim() || null,
          taggedMemberName: m ? m.fullName : null,
          taggedMemberId: m ? m.id : null,
          displayOrder: Number(form.displayOrder) || 50,
          publishedAt: res.post.publishedAt ?? new Date().toISOString(),
          likesCount: 0,
          viewsCount: 0,
        },
        ...prev,
      ])
      toast('Post created!')
      setCreateOpen(false)
      setForm({ title: '', category: 'Announcement', content: '', taggedMemberId: '', status: 'published', displayOrder: '50' })
    } catch (err) {
      toast((err as ApiError).message || 'Failed to create post', 'error')
    } finally {
      setSaving(false)
    }
  }

  const toggleStatus = async (p: AdminPostRow) => {
    const next = p.status === 'published' ? 'draft' : 'published'
    try {
      await api('/api/admin/posts', { method: 'PATCH', body: { id: p.id, status: next } })
      setPosts((prev) => prev.map((x) => (x.id === p.id ? { ...x, status: next } : x)))
      toast(`Post marked as ${next}`)
    } catch (err) {
      toast((err as ApiError).message || 'Failed to update', 'error')
    }
  }

  const removePost = async (id: number) => {
    try {
      await api('/api/admin/posts', { method: 'DELETE', body: { id } })
      setPosts((prev) => prev.filter((x) => x.id !== id))
      toast('Post deleted')
    } catch (err) {
      toast((err as ApiError).message || 'Failed to delete', 'error')
    }
  }

  return (
    <div className="space-y-6">
      <header className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-[24px] font-bold tracking-tight text-navy">Posts &amp; Feed ({posts.length})</h1>
          <p className="text-label text-muted">Publish announcements, member spotlights, and monitor likes/views.</p>
        </div>
        <Button onClick={() => setCreateOpen(true)} icon={<Plus className="size-4" />}>
          Create Post
        </Button>
      </header>

      <div className="space-y-3">
        {posts.map((p) => (
          <div key={p.id} className="rounded-2xl border border-black/[0.06] bg-surface p-4 shadow-sm">
            <div className="flex flex-wrap items-start justify-between gap-2">
              <div className="min-w-0 flex-1">
                <div className="flex flex-wrap items-center gap-2">
                  <StatusPill tone={p.status === 'published' ? 'success' : 'neutral'}>{p.status}</StatusPill>
                  <StatusPill tone="brand">{p.category}</StatusPill>
                  {p.taggedMemberName && <span className="text-caption font-semibold text-navy">· {p.taggedMemberName}</span>}
                </div>
                <h2 className="mt-2 text-[15.5px] font-bold text-navy">{p.title}</h2>
                {p.content && <p className="mt-1 line-clamp-2 text-label text-muted">{p.content}</p>}
              </div>
              <div className="flex items-center gap-2 shrink-0">
                <Button size="sm" variant="secondary" onClick={() => toggleStatus(p)}>
                  {p.status === 'published' ? 'Unpublish' : 'Publish'}
                </Button>
                <button
                  type="button"
                  onClick={() => removePost(p.id)}
                  className="grid size-8 place-items-center rounded-full text-danger hover:bg-danger-bg"
                  aria-label="Delete post"
                >
                  <Trash2 className="size-4" />
                </button>
              </div>
            </div>

            <div className="mt-3 flex items-center gap-4 border-t border-line pt-2.5 text-caption font-semibold text-muted">
              <span className="inline-flex items-center gap-1">
                <Heart className="size-3.5 text-[#FF2D55]" />
                {p.likesCount} likes
              </span>
              <span className="inline-flex items-center gap-1">
                <Eye className="size-3.5 text-[#007AFF]" />
                {p.viewsCount} views
              </span>
              {p.publishedAt && <span>Published {formatDate(p.publishedAt)}</span>}
            </div>
          </div>
        ))}
      </div>

      <Dialog
        open={createOpen}
        onClose={() => setCreateOpen(false)}
        busy={saving}
        title="Publish New Timeline Post"
        footer={
          <>
            <Button variant="ghost" onClick={() => setCreateOpen(false)} disabled={saving}>
              Cancel
            </Button>
            <Button onClick={createPost} loading={saving}>
              Publish Post
            </Button>
          </>
        }
      >
        <div className="space-y-3">
          <Field label="Title">
            <Input value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} placeholder="Post headline" />
          </Field>
          <div className="grid gap-3 sm:grid-cols-2">
            <Field label="Category">
              <Select
                value={form.category}
                onChange={(e) => setForm({ ...form, category: e.target.value as (typeof POST_CATEGORIES)[number] })}
              >
                {POST_CATEGORIES.map((c) => (
                  <option key={c} value={c}>
                    {c}
                  </option>
                ))}
              </Select>
            </Field>
            <Field label="Tag Member" optional>
              <Select value={form.taggedMemberId} onChange={(e) => setForm({ ...form, taggedMemberId: e.target.value })}>
                <option value="">MNI Admin (Network Bulletin)</option>
                {members.map((m) => (
                  <option key={m.id} value={m.id}>
                    {m.fullName} — {m.businessName}
                  </option>
                ))}
              </Select>
            </Field>
          </div>
          <Field label="Content">
            <Textarea
              rows={4}
              value={form.content}
              onChange={(e) => setForm({ ...form, content: e.target.value })}
              placeholder="Write the announcement or opportunity details…"
            />
          </Field>
        </div>
      </Dialog>
    </div>
  )
}
