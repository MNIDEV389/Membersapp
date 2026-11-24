import type { CollectionAfterChangeHook } from 'payload'

/** Credit the referrer exactly once, when an admin moves a referral to `confirmed`. */
export const creditConfirmedReferral: CollectionAfterChangeHook = async ({ doc, req }) => {
  if (doc.status !== 'confirmed' || doc.coinsCredited) return doc

  const referrerId = typeof doc.referrer === 'object' ? doc.referrer?.id : doc.referrer
  if (!referrerId) return doc

  const referrer = await req.payload.findByID({
    collection: 'members',
    id: referrerId,
    depth: 0,
    overrideAccess: true,
    req,
  })

  await req.payload.update({
    collection: 'members',
    id: referrerId,
    overrideAccess: true,
    req,
    data: {
      mniCoins: (referrer.mniCoins ?? 0) + (doc.coinsAwarded ?? 0),
      referralCount: (referrer.referralCount ?? 0) + 1,
    },
  })

  await req.payload.update({
    collection: 'referrals',
    id: doc.id,
    overrideAccess: true,
    req,
    data: { coinsCredited: true },
  })

  return { ...doc, coinsCredited: true }
}
