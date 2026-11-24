import { assertSameOrigin, clientIp, handler, ok, parseJson } from '@/lib/http'
import { getPayloadClient } from '@/lib/payload'
import { hashIp, rateLimit } from '@/lib/rate-limit'
import { loginHelpSchema } from '@/lib/schemas'

/** Public: request login details / access help from MNI administration. */
export const POST = handler(async (req) => {
  assertSameOrigin(req)
  const ip = clientIp(req)
  rateLimit(`login-help:${ip}`, 5, 60 * 60 * 1000)
  const input = await parseJson(req, loginHelpSchema)

  // Honeypot tripped: pretend success, store nothing.
  if (input.website) return ok({ ok: true })

  const payload = await getPayloadClient()
  await payload.create({
    collection: 'login-help-requests',
    overrideAccess: true,
    data: {
      fullName: input.fullName,
      email: input.email,
      phone: input.phone,
      whatsapp: input.whatsapp || input.phone,
      businessName: input.businessName,
      issueType: input.issueType,
      details: input.details,
      status: 'pending',
      ipHash: hashIp(ip),
    },
  })
  return ok({ ok: true }, { status: 201 })
})
