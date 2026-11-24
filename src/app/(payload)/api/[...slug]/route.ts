/**
 * Shared Payload REST API (`/api/<collection>`), guarded by collection access
 * control. Used by this app for uploads and by the separate MNI Admin app.
 * GraphQL and the built-in admin UI are intentionally not mounted.
 */
import config from '@payload-config'
import { REST_DELETE, REST_GET, REST_OPTIONS, REST_PATCH, REST_POST, REST_PUT } from '@payloadcms/next/routes'

export const GET = REST_GET(config)
export const POST = REST_POST(config)
export const DELETE = REST_DELETE(config)
export const PATCH = REST_PATCH(config)
export const PUT = REST_PUT(config)
export const OPTIONS = REST_OPTIONS(config)
