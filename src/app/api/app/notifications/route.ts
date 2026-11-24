import { getNotifications } from '@/lib/data'
import { assertSameOrigin, handler, ok, requireApiMember } from '@/lib/http'

export const dynamic = 'force-dynamic'

export const GET = handler(async (req) => {
  const { member } = await requireApiMember(req)
  return ok(await getNotifications(member))
})

/** Mark all notifications as seen. */
export const POST = handler(async (req) => {
  assertSameOrigin(req)
  const { payload, member } = await requireApiMember(req)
  await payload.update({
    collection: 'members',
    id: member.id,
    overrideAccess: true,
    data: { notificationsSeenAt: new Date().toISOString() },
  })
  return ok({ ok: true })
})
