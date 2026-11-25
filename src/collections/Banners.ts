import type { CollectionConfig } from 'payload'
import { adminsOnly, isAdminUser, isMemberUser } from '@/access'

/** Top-of-home promotional carousel (2–3 active banners). */
export const Banners: CollectionConfig = {
  slug: 'banners',
  admin: { useAsTitle: 'title', defaultColumns: ['title', 'category', 'isActive', 'sortOrder'] },
  access: {
    read: ({ req }) => {
      if (isAdminUser(req)) return true
      return isMemberUser(req) ? { isActive: { equals: true } } : false
    },
    create: adminsOnly,
    update: adminsOnly,
    delete: adminsOnly,
  },
  defaultSort: 'sortOrder',
  fields: [
    { name: 'title', type: 'text', required: true, maxLength: 90 },
    { name: 'subtitle', type: 'text', required: true, maxLength: 160 },
    { name: 'category', type: 'text', required: true, defaultValue: 'Sponsored', maxLength: 30 },
    { name: 'image', type: 'upload', relationTo: 'media' },
    {
      name: 'imageUrl',
      type: 'text',
      validate: (value: string | null | undefined) =>
        !value || /^(https?:\/\/|data:image\/)/i.test(value) || 'Image URL must start with https:// or be an uploaded image',
    },
    { name: 'actionLabel', type: 'text', defaultValue: 'Learn more', maxLength: 30 },
    {
      name: 'actionLink',
      type: 'text',
      admin: { description: 'Internal path (/rewards) or https link.' },
      validate: (value: string | null | undefined) =>
        !value || /^(\/(?!\/)|https:\/\/)\S*$/i.test(value) || 'Use an internal path or an https link',
    },
    { name: 'isActive', type: 'checkbox', defaultValue: true, index: true },
    { name: 'sortOrder', type: 'number', defaultValue: 0 },
  ],
}
