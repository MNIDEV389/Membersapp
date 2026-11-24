import type { CollectionConfig } from 'payload'
import { adminFieldOnly, adminsOnly, adminsOrMembers, adminsOrOwner, isMemberUser } from '@/access'
import { COINS_PER_REFERRAL, REFERRAL_STATUSES } from '@/lib/constants'
import { creditConfirmedReferral } from '@/hooks/referrals'

/** Member referrals. Coins are credited only when an admin confirms the referral. */
export const Referrals: CollectionConfig = {
  slug: 'referrals',
  admin: {
    useAsTitle: 'candidateName',
    defaultColumns: ['candidateName', 'candidateEmail', 'referrer', 'status', 'createdAt'],
  },
  access: {
    read: adminsOrOwner('referrer'),
    create: adminsOrMembers,
    update: adminsOnly,
    delete: adminsOnly,
  },
  defaultSort: '-createdAt',
  hooks: {
    beforeChange: [
      ({ req, data, operation }) => {
        if (operation === 'create' && isMemberUser(req) && req.user) {
          data.referrer = req.user.id
          data.status = 'pending_review'
        }
        if (data.candidateEmail) data.candidateEmail = String(data.candidateEmail).trim().toLowerCase()
        return data
      },
    ],
    afterChange: [creditConfirmedReferral],
  },
  fields: [
    { name: 'candidateName', type: 'text', required: true, maxLength: 120 },
    { name: 'candidatePhone', type: 'text', required: true, maxLength: 32 },
    { name: 'candidateEmail', type: 'email', required: true, index: true },
    { name: 'context', type: 'textarea', maxLength: 1000 },
    {
      name: 'referrer',
      type: 'relationship',
      relationTo: 'members',
      required: true,
      index: true,
      access: { update: adminFieldOnly },
    },
    {
      name: 'status',
      type: 'select',
      required: true,
      defaultValue: 'pending_review',
      index: true,
      options: REFERRAL_STATUSES.map((s) => ({ label: s.label, value: s.value })),
      access: { create: adminFieldOnly, update: adminFieldOnly },
    },
    {
      name: 'coinsAwarded',
      type: 'number',
      defaultValue: COINS_PER_REFERRAL,
      min: 0,
      access: { create: adminFieldOnly, update: adminFieldOnly },
    },
    {
      name: 'coinsCredited',
      type: 'checkbox',
      defaultValue: false,
      admin: { readOnly: true, description: 'Set automatically once coins are added to the referrer.' },
      access: { create: adminFieldOnly, update: adminFieldOnly },
    },
  ],
}
