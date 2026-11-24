import type { Access, FieldAccess, PayloadRequest, Where } from 'payload'

/**
 * Role model
 * ──────────
 * - `admins`  : MNI administrators. Authenticate against the shared API from the
 *               separate MNI Admin app. Full control over content and members.
 * - `members` : network members. Authenticate in this app. Can only read curated
 *               content and create/read their *own* records. Never publish.
 *
 * Everything is deny-by-default: an anonymous request gets nothing unless a
 * collection explicitly opens a door (only `login-help-requests.create`).
 */

export const isAdminUser = (req: PayloadRequest): boolean => req.user?.collection === 'admins'
export const isMemberUser = (req: PayloadRequest): boolean => req.user?.collection === 'members'

export const adminsOnly: Access = ({ req }) => isAdminUser(req)
export const signedIn: Access = ({ req }) => Boolean(req.user)
export const adminsOrMembers: Access = ({ req }) => isAdminUser(req) || isMemberUser(req)
export const nobody: Access = () => false

/** Admins see everything; members only see documents where `field` points at them. */
export const adminsOrOwner =
  (field: string): Access =>
  ({ req }) => {
    if (isAdminUser(req)) return true
    if (isMemberUser(req) && req.user) return { [field]: { equals: req.user.id } }
    return false
  }

/** Admins see everything; members only see published, non-archived records. */
export const adminsOrPublished: Access = ({ req }) => {
  if (isAdminUser(req)) return true
  if (isMemberUser(req)) {
    const published: Where = {
      and: [{ isPublished: { equals: true } }, { isArchived: { not_equals: true } }],
    }
    return published
  }
  return false
}

export const adminFieldOnly: FieldAccess = ({ req }) => isAdminUser(req)

/** Field readable by admins and by the member who owns the document (self). */
export const adminOrSelfField: FieldAccess = ({ req, doc }) => {
  if (isAdminUser(req)) return true
  return Boolean(isMemberUser(req) && req.user && doc && String(doc.id) === String(req.user.id))
}

/** Boolean-only variant for `admin` / `unlock` access, which cannot return a query. */
export const adminsOnlyBool = ({ req }: { req: PayloadRequest }): boolean => isAdminUser(req)
