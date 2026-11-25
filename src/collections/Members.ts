import { APIError, type CollectionConfig } from 'payload'
import { adminFieldOnly, adminOrSelfField, adminsOnly, adminsOnlyBool, isAdminUser, isMemberUser } from '@/access'
import { CALL_DAYS, CALL_TIME_SLOTS, MEMBER_TIERS } from '@/lib/constants'

const TOKEN_TTL_SECONDS = 60 * 60 * 24 * 14 // 14 days

const initialsFrom = (name: string) =>
  name
    .trim()
    .split(/\s+/)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase() ?? '')
    .join('')

export const Members: CollectionConfig = {
  slug: 'members',
  labels: { singular: 'Member', plural: 'Members' },
  admin: {
    useAsTitle: 'fullName',
    defaultColumns: ['fullName', 'email', 'businessName', 'city', 'accountStatus'],
  },
  auth: {
    tokenExpiration: TOKEN_TTL_SECONDS,
    maxLoginAttempts: 5,
    lockTime: 15 * 60 * 1000,
    useAPIKey: false,
    cookies: {
      sameSite: 'Lax',
      secure: process.env.NODE_ENV === 'production',
    },
  },
  access: {
    // Members may only ever read their own record through the API.
    // Public member cards (timeline, leaderboard) are served by server code that
    // projects an explicit allow-list of public fields — see `lib/public-member.ts`.
    read: ({ req }) => {
      if (isAdminUser(req)) return true
      if (isMemberUser(req) && req.user) return { id: { equals: req.user.id } }
      return false
    },
    // Accounts are provisioned by MNI administration only. No self sign-up.
    create: adminsOnly,
    // Members request profile changes through the review workflow; they never
    // write to their record directly.
    update: adminsOnly,
    delete: adminsOnly,
    unlock: adminsOnly,
    admin: adminsOnlyBool,
  },
  hooks: {
    beforeLogin: [
      ({ user }) => {
        if (user?.accountStatus === 'suspended') {
          throw new APIError(
            'This account is inactive. Please contact MNI administration.',
            403,
            undefined,
            true,
          )
        }
        return user
      },
    ],
    beforeChange: [
      ({ data }) => {
        if (data.fullName && !data.avatarInitials) data.avatarInitials = initialsFrom(data.fullName)
        if (data.memberId && !data.referralCode) {
          data.referralCode = `MNI-${initialsFrom(data.fullName ?? '')}${String(data.memberId).slice(-3)}`
        }
        return data
      },
    ],
  },
  fields: [
    // `email` and `password` are added by `auth: true`.
    { name: 'fullName', type: 'text', required: true, maxLength: 120 },
    {
      name: 'phone',
      type: 'text',
      required: true,
      maxLength: 32,
      access: { read: adminOrSelfField },
    },
    {
      name: 'whatsapp',
      type: 'text',
      maxLength: 32,
      access: { read: adminOrSelfField },
    },
    { name: 'city', type: 'text', required: true, maxLength: 120 },
    {
      name: 'memberId',
      type: 'text',
      required: true,
      unique: true,
      index: true,
      access: { update: adminFieldOnly },
      admin: { description: 'e.g. MNI-002184. Members can sign in with this or their email.' },
    },
    { name: 'memberSince', type: 'text', maxLength: 40 },
    { name: 'businessName', type: 'text', required: true, maxLength: 160 },
    { name: 'businessCategory', type: 'text', required: true, maxLength: 160 },
    { name: 'bio', type: 'textarea', maxLength: 1200 },
    {
      name: 'tier',
      type: 'select',
      defaultValue: 'freemium',
      options: MEMBER_TIERS.map((t) => ({ label: t.label, value: t.value })),
      access: { update: adminFieldOnly },
    },
    { name: 'avatarInitials', type: 'text', maxLength: 3 },
    { name: 'avatarImage', type: 'upload', relationTo: 'media' },
    {
      name: 'isVerified',
      type: 'checkbox',
      defaultValue: true,
      access: { update: adminFieldOnly },
    },
    {
      name: 'accountStatus',
      type: 'select',
      defaultValue: 'active',
      options: [
        { label: 'Active', value: 'active' },
        { label: 'Suspended', value: 'suspended' },
      ],
      access: { update: adminFieldOnly },
    },
    {
      name: 'mniCoins',
      type: 'number',
      defaultValue: 0,
      min: 0,
      access: { update: adminFieldOnly },
      admin: { description: 'Credited automatically when an admin confirms a referral.' },
    },
    { name: 'referralCount', type: 'number', defaultValue: 0, min: 0, access: { update: adminFieldOnly } },
    { name: 'referralCode', type: 'text', unique: true, access: { update: adminFieldOnly } },

    // ── Business profile (what other members see) ─────────────────────────────
    { name: 'whatWeDo', type: 'textarea', maxLength: 1500 },
    { name: 'keyProductService', type: 'textarea', maxLength: 800 },
    { name: 'idealClient', type: 'textarea', maxLength: 500 },
    { name: 'opportunityLookingFor', type: 'textarea', maxLength: 500 },
    { name: 'targetConnections', type: 'text', maxLength: 300 },
    {
      name: 'preferredCallDay',
      type: 'select',
      options: CALL_DAYS.map((d) => ({ label: d, value: d })),
    },
    {
      name: 'preferredCallTime',
      type: 'select',
      options: CALL_TIME_SLOTS.map((t) => ({ label: t, value: t })),
    },
    { name: 'websiteUrl', type: 'text', maxLength: 200 },
    { name: 'additionalNotes', type: 'textarea', maxLength: 500 },

    // ── App state ─────────────────────────────────────────────────────────────
    {
      name: 'notificationsSeenAt',
      type: 'date',
      access: { read: adminOrSelfField, update: adminFieldOnly },
      admin: { readOnly: true },
    },
  ],
}
