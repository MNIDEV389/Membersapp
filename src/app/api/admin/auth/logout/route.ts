import { NextResponse } from 'next/server'
import { assertSameOrigin, handler } from '@/lib/http'
import { getPayloadClient } from '@/lib/payload'

export const POST = handler(async (req) => {
  assertSameOrigin(req)
  const payload = await getPayloadClient()
  const cookieName = `${payload.config.cookiePrefix}-token`
  const res = NextResponse.json({ ok: true })
  res.cookies.set(cookieName, '', {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    path: '/',
    maxAge: 0,
  })
  return res
})
