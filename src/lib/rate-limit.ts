import 'server-only'
import { createHash } from 'crypto'
import { HttpError } from './http'

type Bucket = { count: number; resetAt: number }
const buckets = new Map<string, Bucket>()

/**
 * Fixed-window limiter. In-memory, so limits are per server instance — fine
 * for a single Node deployment. For multi-instance/serverless, swap this for a
 * shared store (e.g. Upstash Redis) behind the same function signature.
 */
export function rateLimit(key: string, limit: number, windowMs: number) {
  const now = Date.now()
  const bucket = buckets.get(key)
  if (!bucket || bucket.resetAt <= now) {
    buckets.set(key, { count: 1, resetAt: now + windowMs })
    if (buckets.size > 10_000) {
      for (const [k, b] of buckets) if (b.resetAt <= now) buckets.delete(k)
    }
    return
  }
  bucket.count += 1
  if (bucket.count > limit) {
    const retry = Math.ceil((bucket.resetAt - now) / 60000)
    throw new HttpError(429, `Too many attempts. Please try again in ${retry} minute${retry === 1 ? '' : 's'}.`)
  }
}

export const hashIp = (ip: string) =>
  createHash('sha256').update(`${ip}:${process.env.PAYLOAD_SECRET ?? ''}`).digest('hex').slice(0, 24)
