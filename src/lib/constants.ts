// Shared domain constants — single source of truth for collections, API
// validation and UI copy. Keep values stable: they are persisted in the DB.

export const MEMBER_TIERS = [
  { value: 'free', label: 'Free' },
  { value: 'pro', label: 'Pro' },
  { value: 'premium', label: 'Premium' },
] as const
export type MemberTier = (typeof MEMBER_TIERS)[number]['value']

export const CALL_DAYS = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'] as const

export const CALL_TIME_SLOTS = [
  '9:00 AM - 11:00 AM',
  '11:00 AM - 1:00 PM',
  '1:00 PM - 3:00 PM',
  '3:00 PM - 5:00 PM',
  '5:00 PM - 7:00 PM',
  '7:00 PM - 9:00 PM',
] as const

export const POST_TYPES = [
  { value: 'image_only', label: 'Image only' },
  { value: 'text_only', label: 'Text only' },
  { value: 'image_text', label: 'Image + text' },
] as const
export type PostType = (typeof POST_TYPES)[number]['value']

export const POST_CATEGORIES = [
  'Opportunity',
  'Requirement',
  'Announcement',
  'Promotion',
  'Member Spotlight',
  'Community Meetup',
] as const
export type PostCategory = (typeof POST_CATEGORIES)[number]

/** Timeline filter chips → the post categories each one includes. */
export const TIMELINE_FILTERS: { id: string; label: string; categories: PostCategory[] | null }[] = [
  { id: 'all', label: 'All', categories: null },
  { id: 'opportunities', label: 'Opportunities', categories: ['Opportunity', 'Promotion'] },
  { id: 'requirements', label: 'Requirements', categories: ['Requirement'] },
  { id: 'announcements', label: 'Announcements', categories: ['Announcement'] },
  { id: 'meetups', label: 'Meetups', categories: ['Community Meetup'] },
  { id: 'spotlight', label: 'Spotlight', categories: ['Member Spotlight'] },
]

export const SUBMISSION_CATEGORIES = [
  'Business Requirement',
  'Vendor / Supplier Needed',
  'Business Opportunity',
  'Offer / Announcement',
] as const
/** Internal category for the profile-change review workflow (not member-selectable). */
export const PROFILE_UPDATE_CATEGORY = 'Profile Update'

export const SUBMISSION_STATUSES = [
  { value: 'pending', label: 'Pending review' },
  { value: 'changes_requested', label: 'Changes requested' },
  { value: 'approved', label: 'Approved' },
  { value: 'published', label: 'Published' },
  { value: 'rejected', label: 'Not approved' },
] as const
export type SubmissionStatus = (typeof SUBMISSION_STATUSES)[number]['value']

export const CONTACT_REQUEST_STATUSES = [
  { value: 'pending', label: 'Pending' },
  { value: 'contact_received', label: 'Contact shared' },
  { value: 'followup_required', label: 'Follow-up due' },
  { value: 'outcome_recorded', label: 'Outcome recorded' },
  { value: 'declined', label: 'Not available' },
] as const
export type ContactRequestStatus = (typeof CONTACT_REQUEST_STATUSES)[number]['value']

export const REFERRAL_STATUSES = [
  { value: 'pending_review', label: 'Under review' },
  { value: 'confirmed', label: 'Confirmed' },
  { value: 'declined', label: 'Not eligible' },
  { value: 'meetup_redeemed', label: 'Redeemed at meetup' },
] as const
export type ReferralStatus = (typeof REFERRAL_STATUSES)[number]['value']

export const COINS_PER_REFERRAL = 500

/** Member profile fields a member may propose changes to (reviewed by admin). */
export const EDITABLE_PROFILE_FIELDS = [
  'fullName',
  'phone',
  'whatsapp',
  'city',
  'businessName',
  'businessCategory',
  'websiteUrl',
  'whatWeDo',
  'keyProductService',
  'idealClient',
  'opportunityLookingFor',
  'targetConnections',
  'preferredCallDay',
  'preferredCallTime',
  'additionalNotes',
] as const
export type EditableProfileField = (typeof EDITABLE_PROFILE_FIELDS)[number]

export const MAX_UPLOAD_BYTES = 5 * 1024 * 1024
export const ACCEPTED_IMAGE_TYPES = ['image/jpeg', 'image/png', 'image/webp'] as const
