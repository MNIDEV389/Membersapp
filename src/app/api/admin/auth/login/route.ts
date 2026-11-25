import { generatePayloadCookie } from 'payload'
import { NextResponse } from 'next/server'
import { z } from 'zod'
import { assertSameOrigin, clientIp, handler, HttpError, parseJson } from '@/lib/http'
import { getPayloadClient } from '@/lib/payload'
import { rateLimit } from '@/lib/rate-limit'

const adminLoginSchema = z.object({
  email: z.string().trim().email('Enter a valid admin email'),
  password: z.string().min(1, 'Enter your password'),
})

export const POST = handler(async (req) => {
  assertSameOrigin(req)
  rateLimit(`admin-login:${clientIp(req)}`, 10, 10 * 60 * 1000)
  const { email, password } = await parseJson(req, adminLoginSchema)
  const payload = await getPayloadClient()

  try {
    const result = await payload.login({
      collection: 'admins',
      data: { email: email.toLowerCase(), password },
    })
    if (!result.token || !result.user) {
      throw new HttpError(401, 'Invalid admin email or password.')
    }

    const cookie = generatePayloadCookie({
      collectionAuthConfig: payload.collections.admins.config.auth,
      cookiePrefix: payload.config.cookiePrefix,
      token: result.token,
      returnCookieAsObject: true,
    })

    const res = NextResponse.json({
      ok: true,
      admin: { id: result.user.id, email: result.user.email, fullName: result.user.fullName },
    })
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
      throw new HttpError(423, 'Too many failed attempts. Account locked temporarily.')
    }
    throw new HttpError(401, 'Invalid admin email or password.')
  }
})
