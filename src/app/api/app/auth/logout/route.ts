import { generateExpiredPayloadCookie } from 'payload'
import { NextResponse } from 'next/server'
import { assertSameOrigin, handler } from '@/lib/http'
import { getPayloadClient } from '@/lib/payload'

export const POST = handler(async (req) => {
  assertSameOrigin(req)
  const payload = await getPayloadClient()
  const cookie = generateExpiredPayloadCookie({
    collectionAuthConfig: payload.collections.members.config.auth,
    cookiePrefix: payload.config.cookiePrefix,
    returnCookieAsObject: true,
  })
  const res = NextResponse.json({ ok: true })
  res.cookies.set(cookie.name, '', {
    httpOnly: true,
    secure: Boolean(cookie.secure),
    sameSite: 'lax',
    path: cookie.path ?? '/',
    expires: new Date(0),
    domain: cookie.domain,
  })
  return res
})
