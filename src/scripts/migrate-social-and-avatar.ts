import pg from 'pg'
const { Pool } = pg

const pool = new Pool({
  connectionString: 'postgresql://postgres.qqokxbekwplhwdgwxlcv:v56esqPaZuew5L2L@aws-1-ap-southeast-1.pooler.supabase.com:6543/postgres',
})

async function migrate() {
  console.log('Running social interactions and avatar schema migration...')

  await pool.query(`
    CREATE TABLE IF NOT EXISTS post_likes (
      id SERIAL PRIMARY KEY,
      post_id INTEGER NOT NULL REFERENCES posts(id) ON DELETE CASCADE,
      member_id INTEGER NOT NULL REFERENCES members(id) ON DELETE CASCADE,
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      UNIQUE (post_id, member_id)
    );
    CREATE INDEX IF NOT EXISTS idx_post_likes_post_id ON post_likes(post_id);
    CREATE INDEX IF NOT EXISTS idx_post_likes_member_id ON post_likes(member_id);

    CREATE TABLE IF NOT EXISTS post_views (
      id SERIAL PRIMARY KEY,
      post_id INTEGER NOT NULL REFERENCES posts(id) ON DELETE CASCADE,
      member_id INTEGER NOT NULL REFERENCES members(id) ON DELETE CASCADE,
      viewed_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      UNIQUE (post_id, member_id)
    );
    CREATE INDEX IF NOT EXISTS idx_post_views_post_id ON post_views(post_id);
    CREATE INDEX IF NOT EXISTS idx_post_views_member_id ON post_views(member_id);

    ALTER TABLE members ADD COLUMN IF NOT EXISTS custom_avatar TEXT;
  `)

  console.log('Migration successful!')
  await pool.end()
}

migrate().catch((err) => {
  console.error('Migration failed:', err)
  process.exit(1)
})
