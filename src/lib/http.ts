import 'server-only'
import { NextResponse } from 'next/server'
import { headers as nextHeaders } from 'next/headers'
import type { ZodSchema } from 'zod'
import type { Member } from '@/payload-types'
import { getPayloadClient } from './payload'

export class HttpError extends Error {
  constructor(
    public status: number,
    message: string,
    public fieldErrors?: Record<string, string>,
  ) {
    super(message)
  }
}

export const ok = <T>(data: T, init?: ResponseInit) => NextResponse.json(data, init)

const trustedOrigins = () => {
  const site = process.env.NEXT_PUBLIC_SITE_URL || 'https://mni-members-app.vercel.app'
  const vercel = process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : null
  const extra = (process.env.ALLOWED_ORIGINS || '').split(',').map((o) => o.trim()).filter(Boolean)
  const set = new Set([
    'https://mni-members-app.vercel.app',
    'http://localhost:3000',
    new URL(site.startsWith('http') ? site : `https://${site}`).origin,
    ...extra.map((o) => new URL(o).origin),
  ])
  if (vercel) set.add(vercel.startsWith('http') ? vercel : `https://${vercel}`)
  return set
}

/**
 * CSRF defence for cookie-authenticated mutations: the browser always sends
 * `Origin` on cross-site POSTs, so we only accept our own origin(s).
 */
export function assertSameOrigin(req: Request) {
  const origin = req.headers.get('origin')
  if (!origin) return // same-origin fetches from older browsers / server-to-server
  const host = req.headers.get('x-forwarded-host') || req.headers.get('host')
  const proto = req.headers.get('x-forwarded-proto') || 'http'
  const requestOrigin = host ? `${proto}://${host}` : null
  if (origin === requestOrigin || trustedOrigins().has(origin)) return
  throw new HttpError(403, 'Request origin not allowed.')
}

export async function parseJson<T>(req: Request, schema: ZodSchema<T>): Promise<T> {
  if (!req.headers.get('content-type')?.includes('application/json')) {
    throw new HttpError(415, 'Expected application/json.')
  }
  let body: unknown
  try {
    body = await req.json()
  } catch {
    throw new HttpError(400, 'Invalid JSON body.')
  }
  const result = schema.safeParse(body)
  if (!result.success) {
    const fieldErrors: Record<string, string> = {}
    for (const issue of result.error.issues) {
      const key = issue.path.join('.') || '_'
      if (!fieldErrors[key]) fieldErrors[key] = issue.message
    }
    throw new HttpError(422, 'Please check the highlighted fields.', fieldErrors)
  }
  return result.data
}

/** Authenticate the request as a member (cookie or `Authorization: JWT …`). */
export async function requireApiMember(req: Request) {
  const payload = await getPayloadClient()
  let authResult: { user?: unknown } | null = null
  try {
    const nh = await nextHeaders()
    authResult = await payload.auth({ headers: nh })
  } catch {
    // nextHeaders may not be available in all contexts; fallback to req.headers
  }
  if (!authResult?.user) {
    authResult = await payload.auth({ headers: req.headers }).catch(() => null)
  }
  const user = authResult?.user as Member | null
  if (!user || (user as { collection?: string }).collection !== 'members' || user.accountStatus === 'suspended') {
    throw new HttpError(401, 'Please sign in to continue.')
  }
  return { payload, member: user as Member & { collection: 'members' } }
}

export function clientIp(req: Request) {
  return (req.headers.get('x-forwarded-for')?.split(',')[0] || req.headers.get('x-real-ip') || 'unknown').trim()
}

/** Wrap a route handler with uniform error handling (no internals leak to clients). */
export function handler(fn: (req: Request, ctx: { params: Promise<Record<string, string>> }) => Promise<Response>) {
  return async (req: Request, ctx: { params: Promise<Record<string, string>> }) => {
    try {
      return await fn(req, ctx)
    } catch (err) {
      if (err instanceof HttpError) {
        return NextResponse.json({ error: err.message, fieldErrors: err.fieldErrors }, { status: err.status })
      }
      console.error('[api] unhandled error', err)
      return NextResponse.json({ error: 'Something went wrong. Please try again.' }, { status: 500 })
    }
  }
}
