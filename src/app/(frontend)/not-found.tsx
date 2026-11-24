import { Compass } from 'lucide-react'
import { ButtonLink } from '@/components/ui/Button'

export default function NotFound() {
  return (
    <main id="main" className="mx-auto flex min-h-dvh max-w-md flex-col items-center justify-center px-6 text-center">
      <div className="mb-4 grid size-14 place-items-center rounded-2xl bg-pale text-brand">
        <Compass className="size-6" aria-hidden="true" />
      </div>
      <h1 className="text-title font-bold text-navy">Page not found</h1>
      <p className="mt-2 text-body text-muted">This page doesn’t exist or may have moved.</p>
      <ButtonLink href="/" className="mt-6">
        Back to home
      </ButtonLink>
    </main>
  )
}
