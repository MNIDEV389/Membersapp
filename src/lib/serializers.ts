import 'server-only'
import type { Banner, ContactRequest, Media, Member, Post, Referral, Submission } from '@/payload-types'
import type { MemberTier } from './constants'
import type {
  BannerVM,
  ContactRequestVM,
  ImageVM,
  PostVM,
  PublicMember,
  ReferralVM,
  SelfProfile,
  SubmissionVM,
} from './view-models'

const isObj = <T>(v: unknown): v is T => Boolean(v) && typeof v === 'object'

export function toImage(
  media: number | Media | null | undefined,
  fallbackUrl?: string | null,
  fallbackAlt?: string | null,
): ImageVM | null {
  if (isObj<Media>(media) && media.url) {
    const card = media.sizes?.card
    return {
      url: card?.url || media.url,
      alt: media.alt || fallbackAlt || '',
      width: card?.width ?? media.width,
      height: card?.height ?? media.height,
    }
  }
  if (fallbackUrl) return { url: fallbackUrl, alt: fallbackAlt || '' }
  return null
}

/** Allow-listed public projection of a member (no email/phone/coins/notes). */
export function toPublicMember(m: Member): PublicMember {
  return {
    id: m.id,
    fullName: m.fullName,
    avatarInitials: m.avatarInitials || m.fullName.slice(0, 2).toUpperCase(),
    avatarUrl: toImage(m.avatarImage)?.url ?? null,
    businessName: m.businessName,
    businessCategory: m.businessCategory,
    city: m.city,
    memberSince: m.memberSince ?? null,
    memberId: m.memberId,
    tier: (m.tier ?? 'pro') as MemberTier,
    isVerified: m.isVerified !== false,
    bio: m.bio ?? null,
    whatWeDo: m.whatWeDo ?? null,
    keyProductService: m.keyProductService ?? null,
    idealClient: m.idealClient ?? null,
    opportunityLookingFor: m.opportunityLookingFor ?? null,
    targetConnections: m.targetConnections ?? null,
    preferredCallDay: m.preferredCallDay ?? null,
    preferredCallTime: m.preferredCallTime ?? null,
    websiteUrl: m.websiteUrl ?? null,
  }
}

export function toSelfProfile(m: Member): SelfProfile {
  return {
    ...toPublicMember(m),
    email: m.email,
    phone: m.phone ?? '',
    additionalNotes: m.additionalNotes ?? null,
    mniCoins: m.mniCoins ?? 0,
    referralCount: m.referralCount ?? 0,
    referralCode: m.referralCode ?? null,
  }
}

export function toPost(p: Post): PostVM {
  const image = p.postType === 'text_only' ? null : toImage(p.image, p.imageUrl, p.imageAlt || p.title)
  return {
    id: p.id,
    title: p.title,
    // Self-heal: an "image" post without an image renders as text.
    postType: p.postType !== 'text_only' && !image ? 'text_only' : p.postType,
    category: p.category,
    badgeText: p.badgeText ?? null,
    content: p.content ?? null,
    image,
    taggedMember: isObj<Member>(p.taggedMember) ? toPublicMember(p.taggedMember) : null,
    publishedAt: p.publishedAt ?? null,
  }
}

export function toBanner(b: Banner): BannerVM {
  return {
    id: b.id,
    title: b.title,
    subtitle: b.subtitle,
    category: b.category,
    image: toImage(b.image, b.imageUrl, b.title),
    actionLabel: b.actionLabel || 'Learn more',
    actionLink: b.actionLink ?? null,
  }
}

const REVEALED = new Set(['contact_received', 'followup_required', 'outcome_recorded'])

export function toContactRequest(r: ContactRequest): ContactRequestVM {
  const target = isObj<Member>(r.targetMember) ? r.targetMember : null
  const post = isObj<Post>(r.post) ? r.post : null
  const f = r.followUp
  return {
    id: r.id,
    status: r.status,
    agendaNote: r.agendaNote ?? null,
    adminNote: r.adminNote ?? null,
    createdAt: r.createdAt,
    postTitle: post?.title ?? null,
    target: {
      id: target?.id ?? 0,
      fullName: target?.fullName ?? 'MNI member',
      avatarInitials: target?.avatarInitials ?? '··',
      businessName: target?.businessName ?? '',
      businessCategory: target?.businessCategory ?? '',
    },
    contact: target && REVEALED.has(r.status) ? { email: target.email, phone: target.phone ?? '' } : null,
    followUp: f?.recordedAt
      ? {
          calledContact: Boolean(f.calledContact),
          conversationTookPlace: Boolean(f.conversationTookPlace),
          businessGenerated: Boolean(f.businessGenerated),
          gaveBusiness: f.gaveBusiness ?? null,
          remarks: f.remarks ?? null,
          recordedAt: f.recordedAt ?? null,
        }
      : null,
  }
}

export function toSubmission(s: Submission): SubmissionVM {
  return {
    id: s.id,
    title: s.title,
    category: s.category,
    description: s.description,
    status: s.status,
    adminFeedback: s.adminFeedback ?? null,
    image: toImage(s.supportingImage),
    createdAt: s.createdAt,
    updatedAt: s.updatedAt,
    revision: s.revision ?? 1,
  }
}

export function toReferral(r: Referral): ReferralVM {
  return {
    id: r.id,
    candidateName: r.candidateName,
    candidateEmail: r.candidateEmail,
    status: r.status,
    coinsAwarded: r.coinsAwarded ?? 0,
    createdAt: r.createdAt,
  }
}
