import { tiktokFetch, getTokenFromRequest, errorResponse } from '../_lib/tiktok.js'

export const config = { runtime: 'edge' }

export default async function handler(req) {
  const token = getTokenFromRequest(req)
  if (!token) return errorResponse('Unauthorized', 401)

  if (req.method !== 'POST') return errorResponse('Method not allowed', 405)

  const body = await req.json()
  const data = await tiktokFetch('/adgroup/create/', token, {
    method: 'POST',
    body: JSON.stringify(body),
  })

  return new Response(JSON.stringify(data), {
    headers: { 'Content-Type': 'application/json' },
  })
}
