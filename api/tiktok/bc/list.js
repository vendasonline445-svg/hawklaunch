export default async function handler(req, res) {
  // Get token from Lovable
  let token = null
  const auth = req.headers['authorization']
  if (auth?.startsWith('Bearer ')) {
    token = auth.slice(7)
  } else {
    try {
      const r = await fetch('https://slcuaijctwvmumgtpxgv.supabase.co/functions/v1/get-tiktok-token', {
        headers: { 'x-api-key': process.env.HAWKLAUNCH_API_KEY }
      })
      const d = await r.json()
      token = d.data?.access_token
    } catch(e) { console.error('Token fetch error:', e) }
  }
  if (!token) return res.status(401).json({ error: 'No token' })

  const APP_ID = process.env.TIKTOK_APP_ID
  const SECRET = process.env.TIKTOK_APP_SECRET

  // First: get all authorized advertiser IDs via oauth2/advertiser/get
  // This endpoint uses query params, NOT Access-Token header
  try {
    const advRes = await fetch(
      `https://business-api.tiktok.com/open_api/v1.3/oauth2/advertiser/get/?app_id=${APP_ID}&secret=${SECRET}&access_token=${token}`,
      { method: 'GET', headers: { 'Content-Type': 'application/json' } }
    )
    const advData = await advRes.json()
    const advIds = advData.data?.list || []

    // Return as virtual BC with all advertiser IDs
    return res.json({
      code: 0,
      data: {
        list: [{
          bc_id: 'all',
          bc_name: `Todas as Contas (${advIds.length})`,
          advertiser_ids: advIds
        }]
      }
    })
  } catch(err) {
    console.error('Advertiser get error:', err)
    return res.status(500).json({ error: 'Failed to get advertisers', details: err.message })
  }
}
