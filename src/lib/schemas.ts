// Request schemas shared by API routes (authoritative) and forms (instant feedback).
import { z } from 'zod'
import { CALL_DAYS, CALL_TIME_SLOTS, SUBMISSION_CATEGORIES } from './constants'

const trimmed = (min: number, max: number, label: string) =>
  z
    .string({ required_error: `${label} is required` })
    .trim()
    .min(min, min <= 1 ? `${label} is required` : `${label} must be at least ${min} characters`)
    .max(max, `${label} must be ${max} characters or fewer`)

const optionalText = (max: number, label: string) =>
  z.string().trim().max(max, `${label} must be ${max} characters or fewer`).optional().default('')

export const phoneSchema = z
  .string({ required_error: 'Phone number is required' })
  .trim()
  .regex(/^\+?[0-9][0-9\s-]{7,18}$/, 'Enter a valid phone number, e.g. +91 98765 43210')

export const emailSchema = z
  .string({ required_error: 'Email is required' })
  .trim()
  .toLowerCase()
  .email('Enter a valid email address')
  .max(254)

export const loginSchema = z.object({
  identifier: trimmed(3, 254, 'Email or Member ID'),
  password: z.string().min(1, 'Password is required').max(200),
})

export const loginHelpSchema = z.object({
  fullName: trimmed(2, 120, 'Full name'),
  email: emailSchema,
  phone: phoneSchema,
  whatsapp: z.union([phoneSchema, z.literal('')]).optional().default(''),
  businessName: optionalText(160, 'Business name'),
  issueType: z.enum(['new_credentials', 'forgot_password', 'verification_status', 'account_locked', 'other']),
  details: optionalText(1000, 'Notes'),
  /** Honeypot — real users never fill this. */
  website: z.string().max(0).optional().default(''),
})

export const contactRequestSchema = z.object({
  targetMemberId: z.union([z.number().int().positive(), z.string().min(1)]),
  postId: z.union([z.number().int().positive(), z.string().min(1)]).optional().nullable(),
  agendaNote: optionalText(1000, 'Agenda'),
})

export const followUpSchema = z.object({
  calledContact: z.boolean(),
  conversationTookPlace: z.boolean(),
  businessGenerated: z.boolean(),
  gaveBusiness: z.enum(['gave', 'did_not_give']),
  remarks: optionalText(1000, 'Remarks'),
})

export const submissionSchema = z.object({
  title: trimmed(5, 160, 'Title'),
  category: z.enum(SUBMISSION_CATEGORIES),
  description: trimmed(20, 4000, 'Details'),
  supportingImageId: z.union([z.number().int().positive(), z.string().min(1)]).optional().nullable(),
})

export const referralSchema = z.object({
  candidateName: trimmed(2, 120, 'Full name'),
  candidatePhone: phoneSchema,
  candidateEmail: emailSchema,
  context: optionalText(1000, 'Context'),
})

const websiteSchema = z
  .string()
  .trim()
  .max(200)
  .refine((v) => !v || /^(https?:\/\/)?([a-z0-9-]+\.)+[a-z]{2,}(\/\S*)?$/i.test(v), 'Enter a valid website, e.g. www.company.com')
  .optional()
  .default('')

export const profileChangeSchema = z.object({
  fullName: trimmed(2, 120, 'Full name'),
  phone: phoneSchema,
  city: trimmed(2, 120, 'City'),
  businessName: trimmed(2, 160, 'Business name'),
  businessCategory: trimmed(2, 160, 'Business category'),
  websiteUrl: websiteSchema,
  whatWeDo: trimmed(20, 1500, 'What you do'),
  keyProductService: optionalText(800, 'Key product or service'),
  idealClient: optionalText(500, 'Ideal client'),
  opportunityLookingFor: optionalText(500, 'Opportunity'),
  targetConnections: optionalText(300, 'Target connections'),
  preferredCallDay: z.enum(CALL_DAYS).or(z.literal('')).optional().default(''),
  preferredCallTime: z.enum(CALL_TIME_SLOTS).or(z.literal('')).optional().default(''),
  additionalNotes: optionalText(500, 'Notes'),
})
export type ProfileChangeInput = z.infer<typeof profileChangeSchema>
