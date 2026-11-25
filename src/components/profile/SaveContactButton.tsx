'use client'

import { Download } from 'lucide-react'

interface Props {
  fullName: string
  businessName: string
  businessCategory: string
  city: string
  websiteUrl?: string | null
  memberId: string
  cardUrl: string
}

export function SaveContactButton({
  fullName,
  businessName,
  businessCategory,
  city,
  websiteUrl,
  memberId,
  cardUrl,
}: Props) {
  const downloadVcf = () => {
    const lines = [
      'BEGIN:VCARD',
      'VERSION:3.0',
      `FN:${fullName}`,
      `ORG:${businessName}`,
      `TITLE:${businessCategory}`,
      `ADR;TYPE=WORK:;;;${city};;;India`,
      websiteUrl ? `URL:${websiteUrl.startsWith('http') ? websiteUrl : `https://${websiteUrl}`}` : `URL:${cardUrl}`,
      `NOTE:Verified MNI Member (${memberId}) · ${cardUrl}`,
      'END:VCARD',
    ]
    const blob = new Blob([lines.join('\r\n')], { type: 'text/vcard;charset=utf-8' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `${fullName.replace(/\s+/g, '_')}_MNI.vcf`
    document.body.appendChild(a)
    a.click()
    a.remove()
    URL.revokeObjectURL(url)
  }

  return (
    <button
      type="button"
      onClick={downloadVcf}
      className="inline-flex h-11 w-full items-center justify-center gap-2 rounded-2xl bg-[#007AFF] text-label font-semibold text-white shadow-sm transition-all hover:bg-[#0066E0] active:scale-[0.98]"
    >
      <Download className="size-4" aria-hidden="true" />
      Save Contact (.vcf)
    </button>
  )
}
