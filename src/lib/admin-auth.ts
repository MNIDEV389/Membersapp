import 'server-only'
import { headers as nextHeaders } from 'next/headers'
import { redirect } from 'next/navigation'
import { cache } from 'react'
import type { Admin } from '@/payload-types'
import { getPayloadClient } from './payload'

export type SessionAdmin = Admin & { collection: 'admins' }

/**
 * Resolve the signed-in admin from the HTTP-only session cookie.
 * Member sessions are ignored: this portal is for MNI admins only.
 */
export const getCurrentAdmin = cache(async (): Promise<SessionAdmin | null> => {
  const payload = await getPayloadClient()
  const { user } = await payload.auth({ headers: await nextHeaders() })
  if (!user || user.collection !== 'admins') return null
  return user as SessionAdmin
})

/** For protected admin pages: redirect to /admin/login when there is no admin session. */
export async function requireAdmin(): Promise<SessionAdmin> {
  const admin = await getCurrentAdmin()
  if (!admin) redirect('/admin/login')
  return admin
}
