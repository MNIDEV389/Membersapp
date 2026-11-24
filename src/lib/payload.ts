import 'server-only'
import config from '@payload-config'
import { getPayload } from 'payload'

/** Cached Payload instance for server components and route handlers. */
export const getPayloadClient = () => getPayload({ config })
