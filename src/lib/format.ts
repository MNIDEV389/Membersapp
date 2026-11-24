const rtf = new Intl.RelativeTimeFormat('en-IN', { numeric: 'auto' })

export function timeAgo(iso: string, now = Date.now()) {
  const diff = (new Date(iso).getTime() - now) / 1000
  const abs = Math.abs(diff)
  if (abs < 60) return 'just now'
  if (abs < 3600) return rtf.format(Math.round(diff / 60), 'minute')
  if (abs < 86400) return rtf.format(Math.round(diff / 3600), 'hour')
  if (abs < 604800) return rtf.format(Math.round(diff / 86400), 'day')
  return formatDate(iso)
}

export function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric', timeZone: 'Asia/Kolkata' })
}

export const formatNumber = (n: number) => n.toLocaleString('en-IN')

export function websiteHref(url: string | null | undefined) {
  if (!url) return null
  return /^https?:\/\//i.test(url) ? url : `https://${url}`
}
