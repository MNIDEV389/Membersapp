'use client'

import { ImagePlus, Send, Trash2 } from 'lucide-react'
import { useRouter } from 'next/navigation'
import { useRef, useState, type FormEvent } from 'react'
import { ACCEPTED_IMAGE_TYPES, MAX_UPLOAD_BYTES, SUBMISSION_CATEGORIES } from '@/lib/constants'
import { api, ApiError, uploadImage } from '@/lib/client-api'
import { submissionSchema } from '@/lib/schemas'
import type { SubmissionVM } from '@/lib/view-models'
import { Button } from '../ui/Button'
import { Field, Input, Select, Textarea } from '../ui/Field'
import { useToast } from '../ui/Toast'

type Category = (typeof SUBMISSION_CATEGORIES)[number]

export function SubmissionForm({ editing, onDone }: { editing: SubmissionVM | null; onDone: () => void }) {
  const router = useRouter()
  const toast = useToast()
  const fileInput = useRef<HTMLInputElement>(null)
  const [title, setTitle] = useState(editing?.title ?? '')
  const [category, setCategory] = useState<Category>((editing?.category as Category) ?? 'Business Requirement')
  const [description, setDescription] = useState(editing?.description ?? '')
  const [file, setFile] = useState<File | null>(null)
  const [preview, setPreview] = useState<string | null>(editing?.image?.url ?? null)
  const [keepExisting, setKeepExisting] = useState(Boolean(editing?.image))
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [formError, setFormError] = useState<string | null>(null)
  const [stage, setStage] = useState<'idle' | 'uploading' | 'sending'>('idle')

  const pickFile = (f: File | undefined) => {
    setErrors(({ image: _, ...rest }) => rest)
    if (!f) return
    if (!(ACCEPTED_IMAGE_TYPES as readonly string[]).includes(f.type)) return setErrors((e) => ({ ...e, image: 'Use a JPG, PNG or WebP image.' }))
    if (f.size > MAX_UPLOAD_BYTES) return setErrors((e) => ({ ...e, image: 'Image must be 5 MB or smaller.' }))
    setFile(f)
    setKeepExisting(false)
    setPreview(URL.createObjectURL(f))
  }

  const removeImage = () => {
    setFile(null)
    setPreview(null)
    setKeepExisting(false)
    if (fileInput.current) fileInput.current.value = ''
  }

  const onSubmit = async (e: FormEvent) => {
    e.preventDefault()
    setFormError(null)
    const parsed = submissionSchema.safeParse({ title, category, description })
    if (!parsed.success) {
      const errs: Record<string, string> = {}
      for (const i of parsed.error.issues) errs[String(i.path[0])] ??= i.message
      setErrors(errs)
      document.getElementById(`sub-${Object.keys(errs)[0]}`)?.focus()
      return
    }
    try {
      let supportingImageId: number | null = null
      if (file) {
        setStage('uploading')
        supportingImageId = (await uploadImage(file, title)).id
      }
      setStage('sending')
      const body = { title, category, description, supportingImageId: supportingImageId ?? (keepExisting ? undefined : null) }
      if (editing) {
        await api(`/api/app/submissions/${editing.id}`, { method: 'PATCH', body })
        toast('Revision sent to MNI for review.')
      } else {
        await api('/api/app/submissions', { body })
        toast('Submitted. MNI will review it and update you here.')
      }
      setTitle('')
      setDescription('')
      removeImage()
      onDone()
      router.refresh()
    } catch (err) {
      const apiErr = err as ApiError
      setFormError(apiErr.message)
      if (apiErr.fieldErrors) setErrors(apiErr.fieldErrors)
    } finally {
      setStage('idle')
    }
  }

  const busy = stage !== 'idle'

  return (
    <form onSubmit={onSubmit} noValidate className="space-y-5 rounded-[var(--radius-card)] border border-line bg-surface p-5 shadow-card sm:p-6">
      <div className="flex items-start justify-between gap-3">
        <h2 className="text-section font-bold text-navy">{editing ? 'Revise your submission' : 'New submission'}</h2>
        {editing && (
          <Button size="sm" variant="ghost" onClick={onDone} disabled={busy}>
            Cancel
          </Button>
        )}
      </div>
      {editing?.adminFeedback && (
        <p className="rounded-2xl bg-warning-bg p-3 text-label text-[#7a3a05]">
          <span className="font-semibold">MNI asked:</span> {editing.adminFeedback}
        </p>
      )}
      {formError && <p role="alert" className="rounded-xl bg-danger-bg px-4 py-3 text-label text-danger">{formError}</p>}

      <Field label="Category" required>
        <Select id="sub-category" value={category} onChange={(e) => setCategory(e.target.value as Category)}>
          {SUBMISSION_CATEGORIES.map((c) => (
            <option key={c} value={c}>{c}</option>
          ))}
        </Select>
      </Field>
      <Field label="Headline" required error={errors.title} counter={{ value: title.length, max: 160 }}>
        <Input id="sub-title" value={title} maxLength={160} onChange={(e) => setTitle(e.target.value)} placeholder="e.g. Looking for a packaging partner in Bengaluru" />
      </Field>
      <Field
        label="Details"
        required
        error={errors.description}
        hint="Scope, quantities, timelines, location, budget range — whatever helps the right member respond."
        counter={{ value: description.length, max: 4000 }}
      >
        <Textarea id="sub-description" rows={6} maxLength={4000} value={description} onChange={(e) => setDescription(e.target.value)} />
      </Field>

      <div className="space-y-1.5">
        <p className="text-label font-semibold text-ink">
          Supporting image <span className="font-normal text-muted">(optional)</span>
        </p>
        {preview ? (
          <div className="relative overflow-hidden rounded-[var(--radius-art)] border border-line">
            <img src={preview} alt="Selected supporting image" className="max-h-64 w-full object-cover" />
            <button
              type="button"
              onClick={removeImage}
              className="absolute right-2 top-2 inline-flex h-9 items-center gap-1.5 rounded-full bg-[#081733]/80 px-3 text-label font-semibold text-white backdrop-blur hover:bg-[#081733]"
            >
              <Trash2 className="size-4" aria-hidden="true" /> Remove
            </button>
          </div>
        ) : (
          <label className="flex min-h-28 cursor-pointer flex-col items-center justify-center gap-1.5 rounded-[var(--radius-art)] border-2 border-dashed border-line-strong bg-subtle px-4 text-center transition-colors hover:border-brand hover:bg-pale has-[:focus-visible]:outline has-[:focus-visible]:outline-2 has-[:focus-visible]:outline-brand">
            <ImagePlus className="size-6 text-brand" aria-hidden="true" />
            <span className="text-label font-semibold text-navy">Add an image</span>
            <span className="text-caption text-muted">JPG, PNG or WebP · up to 5 MB</span>
            <input
              ref={fileInput}
              type="file"
              accept={ACCEPTED_IMAGE_TYPES.join(',')}
              className="sr-only"
              onChange={(e) => pickFile(e.target.files?.[0])}
            />
          </label>
        )}
        {errors.image && <p className="text-label text-danger">{errors.image}</p>}
      </div>

      <Button
        type="submit"
        size="lg"
        fullWidth
        loading={busy}
        loadingText={stage === 'uploading' ? 'Uploading image…' : 'Sending…'}
        icon={<Send className="size-[18px]" aria-hidden="true" />}
      >
        {editing ? 'Resubmit for review' : 'Send to MNI'}
      </Button>
    </form>
  )
}
