'use client'

import { useRouter } from 'next/navigation'
import { useEffect, useState } from 'react'
import { Camera, Trash2, Upload } from 'lucide-react'
import { CALL_DAYS, CALL_TIME_SLOTS } from '@/lib/constants'
import { api, ApiError } from '@/lib/client-api'
import { profileChangeSchema, type ProfileChangeInput } from '@/lib/schemas'
import type { SelfProfile } from '@/lib/view-models'
import { Avatar } from '../ui/Badges'
import { Button } from '../ui/Button'
import { Dialog } from '../ui/Dialog'
import { Alert } from '../ui/Feedback'
import { Field, Input, Select, Textarea } from '../ui/Field'
import { useToast } from '../ui/Toast'

type FormState = Record<keyof ProfileChangeInput, string>

const fromProfile = (p: SelfProfile, pending: Record<string, string> | null): FormState => {
  const base: FormState = {
    fullName: p.fullName,
    phone: p.phone,
    whatsapp: p.whatsapp ?? '',
    city: p.city,
    businessName: p.businessName,
    businessCategory: p.businessCategory,
    websiteUrl: p.websiteUrl ?? '',
    whatWeDo: p.whatWeDo ?? p.bio ?? '',
    keyProductService: p.keyProductService ?? '',
    idealClient: p.idealClient ?? '',
    opportunityLookingFor: p.opportunityLookingFor ?? '',
    targetConnections: p.targetConnections ?? '',
    preferredCallDay: p.preferredCallDay ?? '',
    preferredCallTime: p.preferredCallTime ?? '',
    additionalNotes: p.additionalNotes ?? '',
  }
  return { ...base, ...(pending ?? {}) }
}

export function EditProfileDialog({
  open,
  onClose,
  profile,
  currentAvatarUrl,
  onAvatarUpdated,
  pendingChanges,
}: {
  open: boolean
  onClose: () => void
  profile: SelfProfile
  currentAvatarUrl: string | null
  onAvatarUpdated: (url: string | null) => void
  pendingChanges: Record<string, string> | null
}) {
  const router = useRouter()
  const toast = useToast()
  const [form, setForm] = useState<FormState>(() => fromProfile(profile, pendingChanges))
  const [sameWhatsapp, setSameWhatsapp] = useState(() => {
    const w = pendingChanges?.whatsapp ?? profile.whatsapp ?? ''
    return !w || w === profile.phone
  })
  const [avatarUrl, setAvatarUrl] = useState<string | null>(currentAvatarUrl)
  const [uploadingPhoto, setUploadingPhoto] = useState(false)
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [formError, setFormError] = useState<string | null>(null)
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    if (open) {
      setForm(fromProfile(profile, pendingChanges))
      const w = pendingChanges?.whatsapp ?? profile.whatsapp ?? ''
      setSameWhatsapp(!w || w === profile.phone)
      setAvatarUrl(currentAvatarUrl)
      setErrors({})
      setFormError(null)
    }
  }, [open, profile, pendingChanges, currentAvatarUrl])

  const handlePhotoUpload = (file: File) => {
    if (!file.type.startsWith('image/')) {
      toast('Please choose a valid image file (JPG, PNG, or WebP).', 'error')
      return
    }
    setUploadingPhoto(true)
    const reader = new FileReader()
    reader.onload = (e) => {
      const img = new Image()
      img.onload = async () => {
        const canvas = document.createElement('canvas')
        const MAX_SIZE = 360
        let w = img.width
        let h = img.height
        if (w > h) {
          if (w > MAX_SIZE) {
            h = Math.round((h * MAX_SIZE) / w)
            w = MAX_SIZE
          }
        } else {
          if (h > MAX_SIZE) {
            w = Math.round((w * MAX_SIZE) / h)
            h = MAX_SIZE
          }
        }
        canvas.width = w
        canvas.height = h
        const ctx = canvas.getContext('2d')
        if (!ctx) {
          setUploadingPhoto(false)
          return
        }
        ctx.drawImage(img, 0, 0, w, h)
        const dataUrl = canvas.toDataURL('image/jpeg', 0.85)
        setAvatarUrl(dataUrl)
        onAvatarUpdated(dataUrl)
        try {
          await api('/api/app/profile/avatar', { body: { avatarUrl: dataUrl } })
          toast('Profile picture updated successfully!')
          router.refresh()
        } catch (err) {
          toast((err as Error).message || 'Failed to update photo.', 'error')
          setAvatarUrl(currentAvatarUrl)
          onAvatarUpdated(currentAvatarUrl)
        } finally {
          setUploadingPhoto(false)
        }
      }
      img.src = e.target?.result as string
    }
    reader.readAsDataURL(file)
  }

  const handleRemovePhoto = async () => {
    setUploadingPhoto(true)
    try {
      await api('/api/app/profile/avatar', { body: { remove: true } })
      setAvatarUrl(null)
      onAvatarUpdated(null)
      toast('Profile photo removed.')
      router.refresh()
    } catch (err) {
      toast((err as Error).message || 'Failed to remove photo.', 'error')
    } finally {
      setUploadingPhoto(false)
    }
  }

  const set = (k: keyof FormState) => (e: { target: { value: string } }) => {
    setForm((f) => ({ ...f, [k]: e.target.value }))
    if (errors[k]) setErrors(({ [k]: _, ...rest }) => rest)
  }

  const save = async () => {
    setFormError(null)
    const parsed = profileChangeSchema.safeParse(form)
    if (!parsed.success) {
      const errs: Record<string, string> = {}
      for (const i of parsed.error.issues) errs[String(i.path[0])] ??= i.message
      setErrors(errs)
      setFormError('Please fix the highlighted fields.')
      document.getElementById(`pf-${Object.keys(errs)[0]}`)?.focus()
      return
    }
    setSaving(true)
    try {
      await api('/api/app/profile-change', { body: parsed.data })
      toast('Sent for review. Your profile updates once MNI approves.')
      onClose()
      router.refresh()
    } catch (err) {
      const apiErr = err as ApiError
      setFormError(apiErr.message)
      setErrors(apiErr.fieldErrors ?? {})
    } finally {
      setSaving(false)
    }
  }

  const count = (k: keyof FormState, max: number) => ({ value: form[k].length, max })

  return (
    <Dialog
      open={open}
      onClose={onClose}
      busy={saving}
      size="lg"
      title="Edit profile"
      description="Changes are reviewed by MNI before other members see them."
      footer={
        <>
          <Button variant="ghost" onClick={onClose} disabled={saving}>Cancel</Button>
          <Button onClick={save} loading={saving} loadingText="Sending…">Send for review</Button>
        </>
      }
    >
      <div className="space-y-6">
        {formError && <Alert tone="danger">{formError}</Alert>}

        {/* Profile Picture Upload Section */}
        <div className="flex items-center gap-4 rounded-2xl border border-black/[0.06] bg-[#F7F8FA] p-4">
          <Avatar initials={profile.avatarInitials} src={avatarUrl} size="lg" />
          <div className="min-w-0 flex-1 space-y-1.5">
            <p className="text-[14px] font-semibold text-navy">Profile Picture</p>
            <p className="text-caption text-muted">Upload a clear photo of yourself for your member card.</p>
            <div className="flex flex-wrap items-center gap-2 pt-1">
              <label className="inline-flex h-8 cursor-pointer items-center gap-1.5 rounded-full bg-[#007AFF] px-3.5 text-[12.5px] font-semibold text-white shadow-sm transition-all hover:bg-[#0066E0] active:scale-95">
                <Camera className="size-3.5" />
                {uploadingPhoto ? 'Uploading…' : avatarUrl ? 'Change photo' : 'Upload photo'}
                <input
                  type="file"
                  accept="image/*"
                  disabled={uploadingPhoto}
                  className="sr-only"
                  onChange={(e) => {
                    const f = e.target.files?.[0]
                    if (f) handlePhotoUpload(f)
                  }}
                />
              </label>
              {avatarUrl && (
                <button
                  type="button"
                  onClick={handleRemovePhoto}
                  disabled={uploadingPhoto}
                  className="inline-flex h-8 items-center gap-1.5 rounded-full border border-black/10 bg-white px-3 text-[12.5px] font-medium text-danger hover:bg-danger-bg/40 active:scale-95"
                >
                  <Trash2 className="size-3.5" />
                  Remove
                </button>
              )}
            </div>
          </div>
        </div>

        <fieldset className="space-y-4">
          <legend className="mb-1 text-caption font-bold uppercase tracking-wider text-muted">Basics</legend>
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Full name" required error={errors.fullName}><Input id="pf-fullName" autoComplete="name" value={form.fullName} onChange={set('fullName')} /></Field>
            <Field label="Phone" required error={errors.phone}><Input id="pf-phone" type="tel" inputMode="tel" autoComplete="tel" value={form.phone} onChange={set('phone')} /></Field>
            <div className="flex items-center justify-between rounded-xl bg-[#F4F5F8] px-3.5 py-2.5 border border-black/[0.06] self-end">
              <span className="text-[13px] font-medium text-[#1C1C1E]">WhatsApp is same</span>
              <button
                type="button"
                role="switch"
                aria-checked={sameWhatsapp}
                onClick={() => {
                  const next = !sameWhatsapp
                  setSameWhatsapp(next)
                  if (next) setForm((f) => ({ ...f, whatsapp: '' }))
                }}
                className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
                  sameWhatsapp ? 'bg-[#007AFF]' : 'bg-[#D1D1D6]'
                }`}
              >
                <span
                  className={`pointer-events-none inline-block size-5 transform rounded-full bg-white shadow-[0_2px_4px_rgba(0,0,0,0.2)] ring-0 transition duration-200 ease-in-out ${
                    sameWhatsapp ? 'translate-x-5' : 'translate-x-0'
                  }`}
                />
              </button>
            </div>
            {!sameWhatsapp && (
              <Field label="WhatsApp contact" error={errors.whatsapp} className="sm:col-span-2">
                <Input id="pf-whatsapp" type="tel" inputMode="tel" value={form.whatsapp} onChange={set('whatsapp')} placeholder="+91 98765 43210" />
              </Field>
            )}
            <Field label="Business name" required error={errors.businessName}><Input id="pf-businessName" autoComplete="organization" value={form.businessName} onChange={set('businessName')} /></Field>
            <Field label="Business category" required error={errors.businessCategory}><Input id="pf-businessCategory" value={form.businessCategory} onChange={set('businessCategory')} placeholder="e.g. Commercial print & packaging" /></Field>
            <Field label="Chapter city" required error={errors.city}><Input id="pf-city" autoComplete="address-level2" value={form.city} onChange={set('city')} /></Field>
            <Field label="Website" optional error={errors.websiteUrl}><Input id="pf-websiteUrl" type="url" inputMode="url" value={form.websiteUrl} onChange={set('websiteUrl')} placeholder="www.yourcompany.com" /></Field>
          </div>
        </fieldset>

        <fieldset className="space-y-4">
          <legend className="mb-1 text-caption font-bold uppercase tracking-wider text-muted">Your business</legend>
          <Field label="What do you do?" required error={errors.whatWeDo} hint="Your expertise and what you offer, in a few sentences." counter={count('whatWeDo', 1500)}>
            <Textarea id="pf-whatWeDo" rows={4} maxLength={1500} value={form.whatWeDo} onChange={set('whatWeDo')} />
          </Field>
          <Field label="Key product or service" optional error={errors.keyProductService} counter={count('keyProductService', 800)}>
            <Textarea id="pf-keyProductService" rows={2} maxLength={800} value={form.keyProductService} onChange={set('keyProductService')} />
          </Field>
        </fieldset>

        <fieldset className="space-y-4">
          <legend className="mb-1 text-caption font-bold uppercase tracking-wider text-muted">Networking</legend>
          <Field label="Ideal client" optional error={errors.idealClient} counter={count('idealClient', 500)}>
            <Textarea id="pf-idealClient" rows={2} maxLength={500} value={form.idealClient} onChange={set('idealClient')} placeholder="Who should members introduce you to?" />
          </Field>
          <Field label="Opportunity you’re looking for right now" optional error={errors.opportunityLookingFor} counter={count('opportunityLookingFor', 500)}>
            <Textarea id="pf-opportunityLookingFor" rows={2} maxLength={500} value={form.opportunityLookingFor} onChange={set('opportunityLookingFor')} />
          </Field>
          <Field label="People you’d like to meet" optional error={errors.targetConnections} counter={count('targetConnections', 300)}>
            <Input id="pf-targetConnections" maxLength={300} value={form.targetConnections} onChange={set('targetConnections')} placeholder="e.g. Procurement heads at FMCG companies" />
          </Field>
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Best day to call" optional>
              <Select id="pf-preferredCallDay" value={form.preferredCallDay} onChange={set('preferredCallDay')}>
                <option value="">No preference</option>
                {CALL_DAYS.map((d) => <option key={d} value={d}>{d}</option>)}
              </Select>
            </Field>
            <Field label="Best time to call" optional>
              <Select id="pf-preferredCallTime" value={form.preferredCallTime} onChange={set('preferredCallTime')}>
                <option value="">No preference</option>
                {CALL_TIME_SLOTS.map((t) => <option key={t} value={t}>{t}</option>)}
              </Select>
            </Field>
          </div>
          <Field label="Anything else members should know?" optional error={errors.additionalNotes} counter={count('additionalNotes', 500)}>
            <Textarea id="pf-additionalNotes" rows={2} maxLength={500} value={form.additionalNotes} onChange={set('additionalNotes')} />
          </Field>
        </fieldset>
      </div>
    </Dialog>
  )
}
