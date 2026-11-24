import { NextResponse } from 'next/server'
import { assertSameOrigin, handler, HttpError, parseJson } from '@/lib/http'
import { getPayloadClient } from '@/lib/payload'
import { getCurrentMember } from '@/lib/auth'
import { z } from 'zod'

const changePasswordSchema = z.object({
  currentPassword: z.string().min(1, 'Current password is required'),
  newPassword: z.string().min(8, 'Password must be at least 8 characters'),
})

/** Change password for the currently authenticated member. */
export const POST = handler(async (req) => {
  assertSameOrigin(req)
  const member = await getCurrentMember()
  if (!member) throw new HttpError(401, 'Not authenticated')

  const { currentPassword, newPassword } = await parseJson(req, changePasswordSchema)
  const payload = await getPayloadClient()

  // Verify current password by attempting a login
  try {
    await payload.login({
      collection: 'members',
      data: { email: member.email, password: currentPassword },
    })
  } catch {
    throw new HttpError(400, 'Current password is incorrect', { currentPassword: 'Incorrect password' })
  }

  // Update the password
  await payload.update({
    collection: 'members',
    id: member.id,
    data: { password: newPassword },
    overrideAccess: true,
  })

  return NextResponse.json({ ok: true })
})
