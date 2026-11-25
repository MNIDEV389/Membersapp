import { assertSameOrigin, handler, HttpError, ok, requireApiAdmin } from '@/lib/http'

export const POST = handler(async (req) => {
  assertSameOrigin(req)
  await requireApiAdmin(req)

  const formData = await req.formData()
  const file = formData.get('file') as File | null
  if (!file) {
    throw new HttpError(400, 'No file uploaded.')
  }

  const bytes = await file.arrayBuffer()
  const buffer = Buffer.from(bytes)
  const base64 = buffer.toString('base64')
  const mimeType = file.type || 'image/jpeg'
  const dataUrl = `data:${mimeType};base64,${base64}`

  return ok({
    ok: true,
    url: dataUrl,
    filename: file.name,
    mimeType,
    size: file.size,
  })
})
