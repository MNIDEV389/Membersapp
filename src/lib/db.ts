import 'server-only'
import pg from 'pg'

const { Pool } = pg

const globalForDb = globalThis as unknown as { pgPool?: pg.Pool }

export const getPgPool = (): pg.Pool => {
  if (!globalForDb.pgPool) {
    const connectionString =
      process.env.DATABASE_URI ||
      'postgresql://postgres.qqokxbekwplhwdgwxlcv:v56esqPaZuew5L2L@aws-1-ap-southeast-1.pooler.supabase.com:6543/postgres'
    globalForDb.pgPool = new Pool({
      connectionString,
      max: process.env.NODE_ENV === 'production' ? 2 : 5,
      idleTimeoutMillis: 10000,
      connectionTimeoutMillis: 10000,
    })
  }
  return globalForDb.pgPool
}
