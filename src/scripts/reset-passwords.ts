import config from '@payload-config'
import { getPayload } from 'payload'

const payload = await getPayload({ config })
const members = await payload.find({ collection: 'members', limit: 10, overrideAccess: true })
console.log(`Found ${members.docs.length} members.`)

for (const m of members.docs) {
  console.log(`Resetting password for ${m.email}...`)
  await payload.update({
    collection: 'members',
    id: m.id,
    data: {
      password: 'Member@MNI2026!',
    },
    overrideAccess: true,
  })
}

console.log('Testing login for shivani@example.com...')
try {
  const res = await payload.login({
    collection: 'members',
    data: {
      email: 'shivani@example.com',
      password: 'Member@MNI2026!',
    },
  })
  console.log('SUCCESS! Logged in as:', res.user?.email)
} catch (err: any) {
  console.error('Login test failed:', err.message)
}

process.exit(0)
