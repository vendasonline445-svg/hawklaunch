import { tiktokFetch, getTokenFromRequest, errorResponse } from '../_lib/tiktok.js'

export const config = { runtime: 'edge' }

export default async function handler(req) {
  const token = getTokenFromRequest(req)
  if (!token) return errorResponse('Unauthorized', 401)

  const { searchParams } = new URL(req.url)
  const bcId = searchParams.get('bc_id')
  if (!bcId) return errorResponse('bc_id required')

  const data = await tiktokFetch(`/bc/advertiser/get/?bc_id=${bcId}&page=1&page_size=100`, token)

  return new Response(JSON.stringify(data), {
    headers: { 'Content-Type': 'application/json' },
  })
}
