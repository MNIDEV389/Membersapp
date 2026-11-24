'use client'

import { Gift, Home, Plus, User, Users } from 'lucide-react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { cn } from '../ui/cn'

const items = [
  { label: 'Home', href: '/', icon: Home },
  { label: 'Requests', href: '/requests', icon: Users },
  { label: 'Submit', href: '/submit', icon: Plus, primary: true },
  { label: 'Refer', href: '/refer', icon: Gift },
  { label: 'Profile', href: '/profile', icon: User },
]

export function BottomNav() {
  const pathname = usePathname()
  const isActive = (href: string) => (href === '/' ? pathname === '/' : pathname.startsWith(href))

  return (
    <nav aria-label="Main" className="safe-bottom fixed inset-x-0 bottom-0 z-40 border-t border-line bg-surface/95 backdrop-blur-xl">
      <ul className="mx-auto grid max-w-xl grid-cols-5 px-2 pt-1.5">
        {items.map(({ label, href, icon: Icon, primary }) => {
          const active = isActive(href) || (href === '/refer' && pathname.startsWith('/rewards'))
          return (
            <li key={href} className="flex justify-center">
              <Link
                href={href}
                aria-current={active ? 'page' : undefined}
                className={cn(
                  'group flex min-h-12 w-full flex-col items-center justify-center gap-0.5 rounded-xl text-caption font-medium transition-colors',
                  primary ? 'text-brand' : active ? 'text-brand' : 'text-muted hover:text-navy',
                )}
              >
                {primary ? (
                  <span className="-mt-5 grid size-12 place-items-center rounded-full border-4 border-surface bg-brand text-white shadow-[0_8px_18px_-6px_rgb(33_92_229/0.7)] transition-colors group-hover:bg-brand-strong">
                    <Icon className="size-6" strokeWidth={2.5} aria-hidden="true" />
                  </span>
                ) : (
                  <Icon className="size-[22px]" strokeWidth={active ? 2.4 : 1.9} aria-hidden="true" />
                )}
                <span className={cn(active && 'font-semibold')}>{label}</span>
              </Link>
            </li>
          )
        })}
      </ul>
    </nav>
  )
}
