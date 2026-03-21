import { tiktokFetch, getTokenFromRequest, errorResponse } from '../_lib/tiktok.js'

export const config = { runtime: 'edge' }

export default async function handler(req) {
  const token = getTokenFromRequest(req)
  if (!token) return errorResponse('Unauthorized', 401)

  if (req.method !== 'POST') return errorResponse('Method not allowed', 405)

  const body = await req.json()

  // Ensure identity_type is set for Spark Ads
  // Valid types: CUSTOMIZED_USER, TT_USER, BC_AUTH_TT, AUTH_CODE
  if (!body.identity_type) {
    body.identity_type = 'CUSTOMIZED_USER'
  }

  const data = await tiktokFetch('/ad/create/', token, {
    method: 'POST',
    body: JSON.stringify(body),
  })

  return new Response(JSON.stringify(data), {
    headers: { 'Content-Type': 'application/json' },
  })
}
