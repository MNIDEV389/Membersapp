import type { CollectionConfig } from 'payload'
import { adminsOnly } from '@/access'

/**
 * "Request login details" tickets from the public login screens.
 * Not writable through the generic API: created only by the rate-limited
 * `/api/app/auth/login-help` route.
 */
export const LoginHelpRequests: CollectionConfig = {
  slug: 'login-help-requests',
  admin: { useAsTitle: 'fullName', defaultColumns: ['fullName', 'email', 'issueType', 'status', 'createdAt'] },
  access: {
    read: adminsOnly,
    create: adminsOnly,
    update: adminsOnly,
    delete: adminsOnly,
  },
  defaultSort: '-createdAt',
  fields: [
    { name: 'fullName', type: 'text', required: true, maxLength: 120 },
    { name: 'email', type: 'email', required: true },
    { name: 'phone', type: 'text', required: true, maxLength: 32 },
    { name: 'whatsapp', type: 'text', maxLength: 32 },
    { name: 'businessName', type: 'text', maxLength: 160 },
    {
      name: 'issueType',
      type: 'select',
      required: true,
      defaultValue: 'new_credentials',
      options: [
        { label: 'New member — request login details', value: 'new_credentials' },
        { label: 'Forgot password / reset access', value: 'forgot_password' },
        { label: 'Membership verification status', value: 'verification_status' },
        { label: 'Account locked or inactive', value: 'account_locked' },
        { label: 'Other', value: 'other' },
      ],
    },
    { name: 'details', type: 'textarea', maxLength: 1000 },
    {
      name: 'status',
      type: 'select',
      defaultValue: 'pending',
      options: [
        { label: 'Pending', value: 'pending' },
        { label: 'In progress', value: 'in_progress' },
        { label: 'Resolved', value: 'resolved' },
      ],
    },
    { name: 'ipHash', type: 'text', admin: { readOnly: true } },
  ],
}
