export default async function handler(req, res) {
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
    } catch(e) {}
  }
  if (!token) return res.status(401).json({ error: 'No token' })

  const bcId = req.query.bc_id
  const APP_ID = process.env.TIKTOK_APP_ID
  const SECRET = process.env.TIKTOK_APP_SECRET

  try {
    // Get all authorized advertiser IDs
    const advRes = await fetch(
      `https://business-api.tiktok.com/open_api/v1.3/oauth2/advertiser/get/?app_id=${APP_ID}&secret=${SECRET}&access_token=${token}`,
      { method: 'GET', headers: { 'Content-Type': 'application/json' } }
    )
    const advData = await advRes.json()
    const advIds = advData.data?.list || []

    if (advIds.length === 0) {
      return res.json({ code: 0, data: { list: [], total: 0 } })
    }

    // Fetch info for all advertisers in batches of 100
    let allAccounts = []
    for (let i = 0; i < advIds.length; i += 100) {
      const batch = advIds.slice(i, i + 100)
      const idsParam = encodeURIComponent(JSON.stringify(batch))
      const infoRes = await fetch(
        `https://business-api.tiktok.com/open_api/v1.3/advertiser/info/?advertiser_ids=${idsParam}`,
        { headers: { 'Access-Token': token, 'Content-Type': 'application/json' } }
      )
      const infoData = await infoRes.json()
      const list = infoData.data?.list || []
      allAccounts = allAccounts.concat(list)
    }

    res.json({
      code: 0,
      data: {
        list: allAccounts,
        total: allAccounts.length
      }
    })
  } catch(err) {
    console.error('Advertisers error:', err)
    res.status(500).json({ error: 'Failed', details: err.message })
  }
}
