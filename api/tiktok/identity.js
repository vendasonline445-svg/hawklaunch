import { tiktokFetch, getTokenFromRequest, errorResponse } from '../_lib/tiktok.js'

export const config = { runtime: 'edge' }

export default async function handler(req) {
  const token = getTokenFromRequest(req)
  if (!token) return errorResponse('Unauthorized', 401)

  if (req.method === 'GET') {
    const { searchParams } = new URL(req.url)
    const advertiserId = searchParams.get('advertiser_id')
    const identityType = searchParams.get('identity_type')
    if (!advertiserId) return errorResponse('advertiser_id required')

    let url = `/identity/get/?advertiser_id=${advertiserId}`
    if (identityType) url += `&identity_type=${identityType}`

    const data = await tiktokFetch(url, token)
    return new Response(JSON.stringify(data), {
      headers: { 'Content-Type': 'application/json' },
    })
  }

  if (req.method === 'POST') {
    const body = await req.json()
    const data = await tiktokFetch('/identity/create/', token, {
      method: 'POST',
      body: JSON.stringify(body),
    })
    return new Response(JSON.stringify(data), {
      headers: { 'Content-Type': 'application/json' },
    })
  }

  return errorResponse('Method not allowed', 405)
}
