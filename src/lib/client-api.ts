// Small typed fetch helper for client components.

export class ApiError extends Error {
  constructor(
    public status: number,
    message: string,
    public fieldErrors: Record<string, string> = {},
  ) {
    super(message)
  }
}

export async function api<T = unknown>(url: string, init: { method?: string; body?: unknown } = {}): Promise<T> {
  let res: Response
  try {
    res = await fetch(url, {
      method: init.method ?? (init.body ? 'POST' : 'GET'),
      headers: init.body ? { 'Content-Type': 'application/json' } : undefined,
      body: init.body ? JSON.stringify(init.body) : undefined,
      credentials: 'same-origin',
    })
  } catch {
    throw new ApiError(0, 'You appear to be offline. Check your connection and try again.')
  }
  const data = await res.json().catch(() => ({}))
  if (!res.ok) {
    if (res.status === 401 && typeof window !== 'undefined' && !url.includes('/auth/')) {
      window.location.href = `/login?next=${encodeURIComponent(window.location.pathname)}`
    }
    throw new ApiError(res.status, data.error || 'Something went wrong. Please try again.', data.fieldErrors || {})
  }
  return data as T
}

/** Upload an image to the shared media library (owned by the signed-in member). */
export async function uploadImage(file: File, alt: string): Promise<{ id: number; url: string }> {
  const form = new FormData()
  form.append('file', file)
  form.append('_payload', JSON.stringify({ alt: alt.slice(0, 200) || file.name }))
  let res: Response
  try {
    res = await fetch('/api/media', { method: 'POST', body: form, credentials: 'same-origin' })
  } catch {
    throw new ApiError(0, 'Upload failed — you appear to be offline.')
  }
  const data = await res.json().catch(() => ({}))
  if (!res.ok) throw new ApiError(res.status, data?.errors?.[0]?.message || 'Image upload failed. Try a smaller JPG, PNG or WebP.')
  return { id: data.doc.id, url: data.doc.url }
}
