import type { Metadata } from 'next'
import { requireMember } from '@/lib/auth'
import { getMyContactRequests } from '@/lib/data'
import { RequestsView } from '@/components/requests/RequestsView'

export const metadata: Metadata = { title: 'Requests' }

export default async function RequestsPage() {
  const me = await requireMember()
  const requests = await getMyContactRequests(me)
  return <RequestsView requests={requests} />
}
