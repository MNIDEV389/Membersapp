// Plain, serialisable shapes passed from server components to client
// components. These are deliberate projections — never pass raw Payload docs
// to the client, so private fields cannot leak by accident.
import type {
  ContactRequestStatus,
  MemberTier,
  PostCategory,
  PostType,
  ReferralStatus,
  SubmissionStatus,
} from './constants'

export type ID = string | number

export interface PublicMember {
  id: ID
  fullName: string
  avatarInitials: string
  avatarUrl: string | null
  businessName: string
  businessCategory: string
  city: string
  memberSince: string | null
  memberId: string
  tier: MemberTier
  isVerified: boolean
  bio: string | null
  whatWeDo: string | null
  keyProductService: string | null
  idealClient: string | null
  opportunityLookingFor: string | null
  targetConnections: string | null
  preferredCallDay: string | null
  preferredCallTime: string | null
  websiteUrl: string | null
}

export interface SelfProfile extends PublicMember {
  email: string
  phone: string
  whatsapp?: string | null
  additionalNotes: string | null
  mniCoins: number
  referralCount: number
  referralCode: string | null
}

export interface ImageVM {
  url: string
  alt: string
  width?: number | null
  height?: number | null
}

export interface PostSeenByMember {
  id: ID
  fullName: string
  avatarInitials: string
  avatarUrl: string | null
  businessName: string
  viewedAt: string
}

export interface PostVM {
  id: ID
  title: string
  postType: PostType
  category: PostCategory
  badgeText: string | null
  content: string | null
  image: ImageVM | null
  taggedMember: PublicMember | null
  publishedAt: string | null
  likesCount: number
  isLikedByMe: boolean
  viewsCount: number
  isViewedByMe: boolean
  seenBy?: PostSeenByMember[]
}

export interface BannerVM {
  id: ID
  title: string
  subtitle: string
  category: string
  image: ImageVM | null
  actionLabel: string
  actionLink: string | null
}

export interface ContactRequestVM {
  id: ID
  status: ContactRequestStatus
  agendaNote: string | null
  adminNote: string | null
  createdAt: string
  postTitle: string | null
  target: Pick<PublicMember, 'id' | 'fullName' | 'avatarInitials' | 'businessName' | 'businessCategory'>
  /** Only present once MNI has shared the contact (status ≠ pending/declined). */
  contact: { email: string; phone: string } | null
  followUp: {
    calledContact: boolean
    conversationTookPlace: boolean
    businessGenerated: boolean
    gaveBusiness: 'gave' | 'did_not_give' | null
    remarks: string | null
    recordedAt: string | null
  } | null
}

export interface SubmissionVM {
  id: ID
  title: string
  category: string
  description: string
  status: SubmissionStatus
  adminFeedback: string | null
  image: ImageVM | null
  createdAt: string
  updatedAt: string
  revision: number
}

export interface ReferralVM {
  id: ID
  candidateName: string
  candidateEmail: string
  status: ReferralStatus
  coinsAwarded: number
  createdAt: string
}

export interface LeaderboardEntry {
  rank: number
  id: ID
  fullName: string
  businessName: string
  avatarInitials: string
  avatarUrl?: string | null
  tier: MemberTier
  mniCoins: number
  referralCount: number
  isYou: boolean
}

export interface NotificationVM {
  id: string
  kind: 'submission' | 'contact' | 'referral' | 'profile'
  title: string
  message: string
  href: string
  at: string
  unread: boolean
}

export interface CelebrationVM {
  id: ID
  fromMember: {
    id: ID
    fullName: string
    avatarInitials: string
    avatarUrl: string | null
    businessName: string
  }
  toMember: {
    id: ID
    fullName: string
    avatarInitials: string
    avatarUrl: string | null
    businessName: string
  }
  amountLabel: string
  story: string
  createdAt: string
}

export interface MeetupAttendeeVM {
  id: ID
  fullName: string
  avatarInitials: string
  avatarUrl: string | null
  businessName: string
  city: string
}

export interface MeetupVM {
  id: ID
  title: string
  description: string | null
  city: string
  venue: string
  startsAt: string
  hostName: string | null
  isGoing: boolean
  attendeesCount: number
  attendees: MeetupAttendeeVM[]
}

export interface CoffeeConnectVM {
  id: ID
  direction: 'incoming' | 'outgoing'
  otherMember: {
    id: ID
    fullName: string
    avatarInitials: string
    avatarUrl: string | null
    businessName: string
    city: string
  }
  proposedTime: string
  note: string | null
  status: 'pending' | 'accepted' | 'declined'
  createdAt: string
}

export interface DirectoryMemberVM extends PublicMember {
  isMatch: boolean
  matchReason: string | null
  isRequested: boolean
  isMine: boolean
}
