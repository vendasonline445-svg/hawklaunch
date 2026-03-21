const { tiktokFetch } = require('../../_lib/tiktok')

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

  // Try BC list first
  const bcData = await tiktokFetch('/bc/get/?page_size=100', token)
  if (bcData.data?.list?.length > 0) {
    return res.json(bcData)
  }

  // Fallback: get all authorized advertiser IDs
  const advData = await tiktokFetch('/oauth2/advertiser/get/?app_id=' + process.env.TIKTOK_APP_ID + '&secret=' + process.env.TIKTOK_APP_SECRET, token)

  const advIds = advData.data?.list || []
  
  // Return as a "virtual BC" so the frontend works
  res.json({
    code: 0,
    data: {
      list: [{
        bc_id: 'direct',
        bc_name: 'Contas Autorizadas',
        advertiser_ids: advIds
      }]
    }
  })
}
