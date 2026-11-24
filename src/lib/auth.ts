import 'server-only'
import { headers as nextHeaders } from 'next/headers'
import { redirect } from 'next/navigation'
import { cache } from 'react'
import type { Member } from '@/payload-types'
import { getPayloadClient } from './payload'

export type SessionMember = Member & { collection: 'members' }

/**
 * Resolve the signed-in member from the HTTP-only session cookie.
 * Admin sessions are ignored: this app is for members only.
 * Cached per request so layouts and pages share one lookup.
 */
export const getCurrentMember = cache(async (): Promise<SessionMember | null> => {
  const payload = await getPayloadClient()
  const { user } = await payload.auth({ headers: await nextHeaders() })
  if (!user || user.collection !== 'members') return null
  if ((user as Member).accountStatus === 'suspended') return null
  return user as SessionMember
})

/** For protected pages: redirect to sign-in when there is no member session. */
export async function requireMember(): Promise<SessionMember> {
  const member = await getCurrentMember()
  if (!member) redirect('/login')
  return member
}
