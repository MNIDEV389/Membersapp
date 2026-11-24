import { generatePayloadCookie } from 'payload'
import { NextResponse } from 'next/server'
import { assertSameOrigin, clientIp, handler, HttpError, parseJson } from '@/lib/http'
import { getPayloadClient } from '@/lib/payload'
import { rateLimit } from '@/lib/rate-limit'
import { loginSchema } from '@/lib/schemas'

const GENERIC = 'Those details don’t match our records. Check your email/Member ID and password.'

/** Member sign-in with email or Member ID. Sets the HTTP-only session cookie. */
export const POST = handler(async (req) => {
  assertSameOrigin(req)
  rateLimit(`login:${clientIp(req)}`, 10, 10 * 60 * 1000)
  const { identifier, password } = await parseJson(req, loginSchema)
  const payload = await getPayloadClient()

  let email = identifier.toLowerCase()
  if (!email.includes('@')) {
    const found = await payload.find({
      collection: 'members',
      where: { memberId: { equals: identifier.toUpperCase() } },
      overrideAccess: true,
      limit: 1,
      depth: 0,
      select: { email: true },
    })
    if (!found.docs[0]) throw new HttpError(401, GENERIC)
    email = found.docs[0].email
  }

  try {
    const result = await payload.login({ collection: 'members', data: { email, password } })
    if (!result.token || !result.user) throw new HttpError(401, GENERIC)

    const cookie = generatePayloadCookie({
      collectionAuthConfig: payload.collections.members.config.auth,
      cookiePrefix: payload.config.cookiePrefix,
      token: result.token,
      returnCookieAsObject: true,
    })
    const res = NextResponse.json({ ok: true, member: { fullName: result.user.fullName } })
    res.cookies.set(cookie.name, cookie.value ?? '', {
      httpOnly: true,
      secure: Boolean(cookie.secure),
      sameSite: 'lax',
      path: cookie.path ?? '/',
      expires: cookie.expires ? new Date(cookie.expires) : undefined,
      domain: cookie.domain,
    })
    return res
  } catch (err) {
    if (err instanceof HttpError) throw err
    const status = (err as { status?: number }).status
    if (status === 423) {
      throw new HttpError(423, 'Too many failed attempts. Your account is locked for 15 minutes.')
    }
    if (status === 403) throw new HttpError(403, (err as Error).message)
    throw new HttpError(401, GENERIC)
  }
})
