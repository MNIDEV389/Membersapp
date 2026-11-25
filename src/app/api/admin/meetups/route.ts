import { z } from 'zod'
import { getPgPool } from '@/lib/db'
import { assertSameOrigin, handler, ok, parseJson, requireApiAdmin } from '@/lib/http'

const createMeetupSchema = z.object({
  title: z.string().trim().min(3).max(160),
  description: z.string().trim().max(600).optional(),
  mode: z.enum(['Online', 'NCR']),
  venue: z.string().trim().min(3).max(200),
  startsAt: z.string().trim().min(4),
  hostName: z.string().trim().max(100).optional(),
})

const patchMeetupSchema = z.object({
  id: z.number(),
  title: z.string().trim().min(3).max(160).optional(),
  description: z.string().trim().max(600).optional().nullable(),
  mode: z.enum(['Online', 'NCR']).optional(),
  venue: z.string().trim().min(3).max(200).optional(),
  startsAt: z.string().trim().min(4).optional(),
  hostName: z.string().trim().max(100).optional(),
})

export const POST = handler(async (req) => {
  assertSameOrigin(req)
  await requireApiAdmin(req)
  const data = await parseJson(req, createMeetupSchema)
  const pool = getPgPool()

  const res = await pool.query(
    `INSERT INTO meetups (title, description, city, venue, starts_at, host_name)
     VALUES ($1, $2, $3, $4, $5::timestamptz, $6)
     RETURNING id, title, description, city, venue, starts_at, host_name`,
    [
      data.title,
      data.description || null,
      data.mode,
      data.venue,
      new Date(data.startsAt).toISOString(),
      data.hostName || 'MNI Admin',
    ],
  )
  return ok({ ok: true, meetup: res.rows[0] })
})

export const PATCH = handler(async (req) => {
  assertSameOrigin(req)
  await requireApiAdmin(req)
  const data = await parseJson(req, patchMeetupSchema)
  const pool = getPgPool()

  const sets: string[] = []
  const values: unknown[] = []
  let idx = 1

  if (data.title !== undefined) {
    sets.push(`title = $${idx++}`)
    values.push(data.title)
  }
  if (data.description !== undefined) {
    sets.push(`description = $${idx++}`)
    values.push(data.description || null)
  }
  if (data.mode !== undefined) {
    sets.push(`city = $${idx++}`)
    values.push(data.mode)
  }
  if (data.venue !== undefined) {
    sets.push(`venue = $${idx++}`)
    values.push(data.venue)
  }
  if (data.startsAt !== undefined) {
    sets.push(`starts_at = $${idx++}::timestamptz`)
    values.push(new Date(data.startsAt).toISOString())
  }
  if (data.hostName !== undefined) {
    sets.push(`host_name = $${idx++}`)
    values.push(data.hostName)
  }

  if (sets.length === 0) return ok({ ok: true })

  values.push(data.id)
  const res = await pool.query(
    `UPDATE meetups SET ${sets.join(', ')} WHERE id = $${idx} RETURNING id, title, description, city, venue, starts_at, host_name`,
    values,
  )

  return ok({ ok: true, meetup: res.rows[0] })
})

export const DELETE = handler(async (req) => {
  assertSameOrigin(req)
  await requireApiAdmin(req)
  const { type, id } = await parseJson(req, z.object({ type: z.enum(['meetup', 'celebration']), id: z.number() }))
  const pool = getPgPool()

  if (type === 'meetup') {
    await pool.query(`DELETE FROM meetups WHERE id = $1`, [id])
  } else {
    await pool.query(`DELETE FROM closed_business_celebrations WHERE id = $1`, [id])
  }
  return ok({ ok: true })
})
