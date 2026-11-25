'use client'

import {
  Calendar,
  ExternalLink,
  FileCheck2,
  Gift,
  HelpCircle,
  Image as ImageIcon,
  LayoutDashboard,
  LogOut,
  Menu,
  Newspaper,
  UserCheck,
  Users,
  X,
} from 'lucide-react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useState, type ReactNode } from 'react'
import { api } from '@/lib/client-api'
import { cn } from '@/components/ui/cn'

const NAV_ITEMS = [
  { href: '/admin', label: 'Overview', icon: LayoutDashboard },
  { href: '/admin/members', label: 'Members', icon: Users },
  { href: '/admin/requests', label: 'Contact Requests', icon: UserCheck },
  { href: '/admin/posts', label: 'Posts & Feed', icon: Newspaper },
  { href: '/admin/banners', label: 'Banners', icon: ImageIcon },
  { href: '/admin/submissions', label: 'Submissions', icon: FileCheck2 },
  { href: '/admin/referrals', label: 'Referrals & Coins', icon: Gift },
  { href: '/admin/meetups', label: 'Meetups & Wins', icon: Calendar },
  { href: '/admin/support', label: 'Support Queue', icon: HelpCircle },
]

export function AdminShell({
  adminName,
  adminEmail,
  children,
}: {
  adminName: string
  adminEmail: string
  children: ReactNode
}) {
  const pathname = usePathname()
  const [mobileOpen, setMobileOpen] = useState(false)
  const [loggingOut, setLoggingOut] = useState(false)

  const isActive = (href: string) => (href === '/admin' ? pathname === '/admin' : pathname.startsWith(href))

  const handleLogout = async () => {
    setLoggingOut(true)
    try {
      await api('/api/admin/auth/logout', { body: {} })
    } finally {
      window.location.assign('/admin/login')
    }
  }

  const sidebarContent = (
    <div className="flex h-full flex-col bg-[#0B224E] text-white">
      <div className="flex items-center justify-between border-b border-white/10 px-5 py-4">
        <Link href="/admin" className="flex items-center gap-2.5" onClick={() => setMobileOpen(false)}>
          <img src="/brand/mni-logo.webp" alt="MNI" className="size-8 rounded-lg object-cover" />
          <div>
            <p className="text-[15px] font-extrabold leading-none tracking-tight">MNI Admin</p>
            <p className="mt-0.5 text-[10px] font-semibold uppercase tracking-[0.16em] text-white/60">
              Operations Console
            </p>
          </div>
        </Link>
        <button
          type="button"
          onClick={() => setMobileOpen(false)}
          className="grid size-8 place-items-center rounded-lg text-white/70 hover:bg-white/10 lg:hidden"
          aria-label="Close navigation"
        >
          <X className="size-5" />
        </button>
      </div>

      <nav aria-label="Admin Navigation" className="flex-1 space-y-1 overflow-y-auto px-3 py-4">
        {NAV_ITEMS.map(({ href, label, icon: Icon }) => {
          const active = isActive(href)
          return (
            <Link
              key={href}
              href={href}
              onClick={() => setMobileOpen(false)}
              className={cn(
                'flex items-center gap-3 rounded-xl px-3 py-2.5 text-[13.5px] font-semibold transition-colors',
                active ? 'bg-white text-[#0B224E] shadow-sm' : 'text-white/80 hover:bg-white/10 hover:text-white',
              )}
            >
              <Icon className="size-4 shrink-0" aria-hidden="true" />
              <span>{label}</span>
            </Link>
          )
        })}
      </nav>

      <div className="border-t border-white/10 p-4 space-y-3">
        <Link
          href="/"
          target="_blank"
          className="flex items-center justify-between rounded-xl bg-white/10 px-3 py-2 text-[12.5px] font-semibold text-white hover:bg-white/15"
        >
          <span>Open Member App</span>
          <ExternalLink className="size-3.5" />
        </Link>

        <div className="flex items-center justify-between gap-2 pt-1">
          <div className="min-w-0">
            <p className="truncate text-[13px] font-bold text-white">{adminName}</p>
            <p className="truncate text-[11px] text-white/60">{adminEmail}</p>
          </div>
          <button
            type="button"
            onClick={handleLogout}
            disabled={loggingOut}
            title="Sign out"
            className="grid size-9 shrink-0 place-items-center rounded-xl text-white/70 hover:bg-white/10 hover:text-white"
            aria-label="Sign out"
          >
            <LogOut className="size-4" />
          </button>
        </div>
      </div>
    </div>
  )

  return (
    <div className="flex min-h-dvh bg-[#F4F6FA] text-ink">
      {/* Desktop Sidebar */}
      <aside className="hidden w-64 shrink-0 lg:block">
        <div className="sticky top-0 h-dvh">{sidebarContent}</div>
      </aside>

      {/* Mobile Drawer */}
      {mobileOpen && (
        <div className="fixed inset-0 z-50 flex lg:hidden">
          <div className="fixed inset-0 bg-black/50" onClick={() => setMobileOpen(false)} />
          <aside className="relative z-10 w-64 max-w-[80vw]">{sidebarContent}</aside>
        </div>
      )}

      {/* Main Content */}
      <div className="flex min-w-0 flex-1 flex-col">
        <header className="sticky top-0 z-30 flex h-14 items-center justify-between border-b border-line bg-surface/95 px-4 backdrop-blur lg:hidden">
          <button
            type="button"
            onClick={() => setMobileOpen(true)}
            className="grid size-9 place-items-center rounded-xl text-navy hover:bg-subtle"
            aria-label="Open menu"
          >
            <Menu className="size-5" />
          </button>
          <span className="text-label font-extrabold text-navy">MNI Admin Console</span>
          <span className="size-9" />
        </header>

        <main className="mx-auto w-full max-w-6xl flex-1 px-4 py-6 sm:px-6 lg:px-8">{children}</main>
      </div>
    </div>
  )
}
