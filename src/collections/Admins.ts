import type { CollectionConfig } from 'payload'
import { adminsOnly, adminsOnlyBool } from '@/access'

/**
 * MNI administrators. They sign in from the separate MNI Admin app, which
 * talks to this project's API (`/api/*`). There is no admin UI in this app.
 */
export const Admins: CollectionConfig = {
  slug: 'admins',
  labels: { singular: 'Admin', plural: 'Admins' },
  admin: { useAsTitle: 'email' },
  auth: {
    tokenExpiration: 60 * 60 * 8, // 8h working session
    maxLoginAttempts: 5,
    lockTime: 30 * 60 * 1000,
    useAPIKey: false,
    cookies: { sameSite: 'Lax', secure: process.env.NODE_ENV === 'production' },
  },
  access: {
    create: adminsOnly,
    read: adminsOnly,
    update: adminsOnly,
    delete: adminsOnly,
    unlock: adminsOnly,
    admin: adminsOnlyBool,
  },
  fields: [{ name: 'fullName', type: 'text', maxLength: 120 }],
}
