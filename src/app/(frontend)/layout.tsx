import '@fontsource-variable/inter'
import './globals.css'
import type { Metadata, Viewport } from 'next'
import type { ReactNode } from 'react'
import { ToastProvider } from '@/components/ui/Toast'

export const metadata: Metadata = {
  metadataBase: new URL(process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000'),
  title: { default: 'MNI Members', template: '%s · MNI Members' },
  description: 'The private member app of MNI — a curated business network for verified introductions and opportunities.',
  applicationName: 'MNI Members',
  // Private network: keep every page out of search engines.
  robots: { index: false, follow: false },
  icons: { icon: '/favicon.svg' },
  manifest: '/manifest.webmanifest',
  appleWebApp: { capable: true, title: 'MNI', statusBarStyle: 'default' },
}

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  viewportFit: 'cover',
  themeColor: '#ffffff',
}

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en-IN">
      <body className="min-h-dvh">
        <a
          href="#main"
          className="fixed left-3 top-3 z-[100] -translate-y-20 rounded-xl bg-navy px-4 py-2 text-label font-semibold text-white focus:translate-y-0"
        >
          Skip to content
        </a>
        <ToastProvider>{children}</ToastProvider>
      </body>
    </html>
  )
}
