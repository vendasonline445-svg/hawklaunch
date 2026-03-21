import { tiktokFetch, getTokenFromRequest, errorResponse } from '../_lib/tiktok.js'

export const config = { runtime: 'edge' }

export default async function handler(req) {
  const token = getTokenFromRequest(req)
  if (!token) return errorResponse('Unauthorized', 401)

  if (req.method === 'POST') {
    const body = await req.json()
    const data = await tiktokFetch('/campaign/create/', token, {
      method: 'POST',
      body: JSON.stringify(body),
    })
    return new Response(JSON.stringify(data), {
      headers: { 'Content-Type': 'application/json' },
    })
  }

  if (req.method === 'GET') {
    const { searchParams } = new URL(req.url)
    const advertiserId = searchParams.get('advertiser_id')
    if (!advertiserId) return errorResponse('advertiser_id required')

    const data = await tiktokFetch(`/campaign/get/?advertiser_id=${advertiserId}&page_size=100`, token)
    return new Response(JSON.stringify(data), {
      headers: { 'Content-Type': 'application/json' },
    })
  }

  return errorResponse('Method not allowed', 405)
}
