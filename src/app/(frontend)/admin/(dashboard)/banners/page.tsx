import type { Metadata } from 'next'
import { getPayloadClient } from '@/lib/payload'
import { AdminBannersView, type AdminBannerRow } from '@/components/admin/AdminBannersView'

export const metadata: Metadata = { title: 'Banners · MNI Admin' }

export default async function AdminBannersPage() {
  const payload = await getPayloadClient()
  const res = await payload.find({ collection: 'banners', overrideAccess: true, sort: 'sortOrder', limit: 50, depth: 0 })

  const banners: AdminBannerRow[] = res.docs.map((b) => ({
    id: b.id,
    title: b.title,
    subtitle: b.subtitle,
    category: b.category,
    actionLabel: b.actionLabel ?? 'Learn more',
    actionLink: b.actionLink ?? null,
    sortOrder: b.sortOrder ?? 10,
    isActive: Boolean(b.isActive),
  }))

  return <AdminBannersView initialBanners={banners} />
}
