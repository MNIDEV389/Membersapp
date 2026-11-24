import type { Metadata } from 'next'
import { requireMember } from '@/lib/auth'
import { getMySubmissions } from '@/lib/data'
import { SubmitView } from '@/components/submit/SubmitView'

export const metadata: Metadata = { title: 'Submit a requirement' }

export default async function SubmitPage() {
  const me = await requireMember()
  const submissions = await getMySubmissions(me)
  return <SubmitView submissions={submissions} />
}
