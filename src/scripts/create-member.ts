/**
 * Provision a member account (until the MNI Admin app is live).
 *
 *   pnpm payload run src/scripts/create-member.ts -- \
 *     --email jane@acme.com --name "Jane Doe" --phone "+91 98765 00000" \
 *     --city Bengaluru --member-id MNI-003001 --business "Acme Pvt Ltd" \
 *     --category "Industrial supplies"
 *
 * A strong temporary password is generated and printed once. Share it with the
 * member over a trusted channel and ask them to change it via support.
 */
import { randomBytes } from 'crypto'
import config from '@payload-config'
import { getPayload } from 'payload'

const args = process.argv.slice(2)
const arg = (name: string) => {
  const i = args.indexOf(`--${name}`)
  return i >= 0 ? args[i + 1] : undefined
}
const required = ['email', 'name', 'phone', 'city', 'member-id', 'business', 'category']
const missing = required.filter((k) => !arg(k))
if (missing.length) {
  console.error(`Missing: ${missing.map((m) => `--${m}`).join(', ')}`)
  process.exit(1)
}

const password = randomBytes(12).toString('base64url')
const payload = await getPayload({ config })
const member = await payload.create({
  collection: 'members',
  overrideAccess: true,
  data: {
    email: arg('email')!.toLowerCase(),
    password,
    fullName: arg('name')!,
    phone: arg('phone')!,
    city: arg('city')!,
    memberId: arg('member-id')!.toUpperCase(),
    businessName: arg('business')!,
    businessCategory: arg('category')!,
    memberSince: new Date().toLocaleDateString('en-IN', { month: 'long', year: 'numeric' }),
    tier: (arg('tier') as 'free' | 'pro' | 'premium') ?? 'free',
    accountStatus: 'active',
  },
})
console.log(`Created ${member.fullName} (${member.memberId}). Temporary password: ${password}`)
process.exit(0)
