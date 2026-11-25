import type { Metadata } from 'next'
import { requireMember } from '@/lib/auth'
import { getDirectoryMembers } from '@/lib/data'
import { DirectoryView } from '@/components/directory/DirectoryView'

export const metadata: Metadata = { title: 'Directory' }

export default async function DirectoryPage() {
  const me = await requireMember()
  const members = await getDirectoryMembers(me)
  return <DirectoryView initialMembers={members} myCity={me.city} />
}
