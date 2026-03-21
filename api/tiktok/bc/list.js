import { tiktokFetch, getTokenFromRequest, errorResponse } from '../_lib/tiktok.js'

export const config = { runtime: 'edge' }

export default async function handler(req) {
  const token = getTokenFromRequest(req)
  if (!token) return errorResponse('Unauthorized', 401)

  const data = await tiktokFetch('/bc/get/', token, {
    method: 'GET',
  })

  return new Response(JSON.stringify(data), {
    headers: { 'Content-Type': 'application/json' },
  })
}
