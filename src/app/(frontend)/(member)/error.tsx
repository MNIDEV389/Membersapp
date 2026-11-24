'use client'

import { RefreshCw, TriangleAlert } from 'lucide-react'
import { Button } from '@/components/ui/Button'

export default function MemberError({ reset }: { error: Error; reset: () => void }) {
  return (
    <div className="mx-auto max-w-sm py-16 text-center">
      <div className="mx-auto mb-4 grid size-14 place-items-center rounded-2xl bg-warning-bg text-warning">
        <TriangleAlert className="size-6" aria-hidden="true" />
      </div>
      <h1 className="text-section font-bold text-navy">We couldn’t load this page</h1>
      <p className="mt-2 text-body text-muted">Check your connection and try again. If it keeps happening, contact MNI support.</p>
      <Button onClick={reset} className="mt-6" icon={<RefreshCw className="size-4" aria-hidden="true" />}>
        Try again
      </Button>
    </div>
  )
}
