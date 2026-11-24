import { Skeleton } from '@/components/ui/Feedback'

export default function Loading() {
  return (
    <div className="space-y-5" aria-busy="true" aria-label="Loading">
      <Skeleton className="h-8 w-2/3" />
      <Skeleton className="h-44 rounded-[var(--radius-panel)]" />
      <Skeleton className="h-10" />
      <Skeleton className="h-64 rounded-[var(--radius-card)]" />
    </div>
  )
}
