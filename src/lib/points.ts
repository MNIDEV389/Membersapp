import 'server-only'
import { getPgPool } from './db'
import type { ID } from './view-models'

/**
 * Award Active Contributor Points to a member in Postgres.
 * Safe non-blocking helper so social actions never fail if points logging fails.
 */
export async function awardContributorPoints(memberId: ID, points: number, reason: string): Promise<void> {
  try {
    const pool = getPgPool()
    await pool.query(
      `INSERT INTO member_activity_points (member_id, points, reason) VALUES ($1, $2, $3)`,
      [Number(memberId), points, reason],
    )
  } catch (err) {
    console.error('awardContributorPoints error:', err)
  }
}

export async function getMemberActivityPoints(memberId: ID): Promise<number> {
  try {
    const pool = getPgPool()
    const { rows } = await pool.query(
      `SELECT COALESCE(SUM(points), 0)::int AS total FROM member_activity_points WHERE member_id = $1`,
      [Number(memberId)],
    )
    return Number(rows[0]?.total ?? 0)
  } catch {
    return 0
  }
}
