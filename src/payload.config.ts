import path from 'path'
import { fileURLToPath } from 'url'
import { buildConfig, type Plugin } from 'payload'
import { postgresAdapter } from '@payloadcms/db-postgres'
import { sqliteAdapter } from '@payloadcms/db-sqlite'
import { s3Storage } from '@payloadcms/storage-s3'
import sharp from 'sharp'

import { Admins } from './collections/Admins'
import { Banners } from './collections/Banners'
import { ContactRequests } from './collections/ContactRequests'
import { LoginHelpRequests } from './collections/LoginHelpRequests'
import { Media } from './collections/Media'
import { Members } from './collections/Members'
import { Posts } from './collections/Posts'
import { Referrals } from './collections/Referrals'
import { Submissions } from './collections/Submissions'

const filename = fileURLToPath(import.meta.url)
const dirname = path.dirname(filename)

const secret = process.env.PAYLOAD_SECRET
if (!secret || secret.length < 32) {
  throw new Error('PAYLOAD_SECRET must be set to a random string of at least 32 characters.')
}

const siteURL = process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000'
const extraOrigins = (process.env.ALLOWED_ORIGINS || '')
  .split(',')
  .map((o) => o.trim())
  .filter(Boolean)
const trustedOrigins = [siteURL, ...extraOrigins]

const databaseURI = process.env.DATABASE_URI || ''
const db = databaseURI.startsWith('postgres')
  ? postgresAdapter({
      pool: { connectionString: databaseURI, max: 10 },
      push: true,
    })
  : sqliteAdapter({ client: { url: databaseURI || 'file:./mni-dev.db' } })

const plugins: Plugin[] = []
if (process.env.S3_BUCKET) {
  plugins.push(
    s3Storage({
      collections: { media: true },
      bucket: process.env.S3_BUCKET,
      config: {
        region: process.env.S3_REGION,
        endpoint: process.env.S3_ENDPOINT || undefined,
        forcePathStyle: process.env.S3_FORCE_PATH_STYLE === 'true',
        credentials: {
          accessKeyId: process.env.S3_ACCESS_KEY_ID || '',
          secretAccessKey: process.env.S3_SECRET_ACCESS_KEY || '',
        },
      },
    }),
  )
}

export default buildConfig({
  secret,
  serverURL: siteURL,
  // The Payload admin UI is intentionally NOT mounted in this app (there is no
  // `app/(payload)/admin` route). Administration lives in the separate MNI
  // Admin app, which authenticates as `admins` against this API.
  admin: { user: Admins.slug },
  collections: [Members, Admins, Posts, Banners, Submissions, ContactRequests, Referrals, LoginHelpRequests, Media],
  db,
  sharp,
  plugins,
  graphQL: { disable: true },
  cors: trustedOrigins,
  csrf: trustedOrigins,
  maxDepth: 3,
  defaultDepth: 1,
  upload: { limits: { fileSize: 5 * 1024 * 1024 } },
  typescript: { outputFile: path.resolve(dirname, 'payload-types.ts') },
  telemetry: false,
})
