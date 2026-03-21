import { tiktokFetch, getTokenFromRequest, errorResponse } from '../_lib/tiktok.js'

export const config = { runtime: 'edge' }

export default async function handler(req) {
  const token = getTokenFromRequest(req)
  if (!token) return errorResponse('Unauthorized', 401)

  const { searchParams } = new URL(req.url)
  const advertiserId = searchParams.get('advertiser_id')
  if (!advertiserId) return errorResponse('advertiser_id required')

  const data = await tiktokFetch(`/pixel/list/?advertiser_id=${advertiserId}`, token)

  return new Response(JSON.stringify(data), {
    headers: { 'Content-Type': 'application/json' },
  })
}
