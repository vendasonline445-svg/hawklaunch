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

  const bcId = req.query.bc_id

  // If real BC ID, use BC advertiser endpoint
  if (bcId && bcId !== 'direct') {
    let allAccounts = []
    let page = 1
    let hasMore = true
    while (hasMore) {
      const data = await tiktokFetch(
        `/bc/advertiser/get/?bc_id=${bcId}&page=${page}&page_size=100`, token
      )
      const list = data.data?.list || []
      allAccounts = allAccounts.concat(list)
      const total = data.data?.page_info?.total_number || 0
      hasMore = page < Math.ceil(total / 100)
      page++
      if (page > 10) break
    }
    return res.json({ code: 0, data: { list: allAccounts, total: allAccounts.length } })
  }

  // Direct mode: get all authorized advertisers then fetch info
  const advData = await tiktokFetch(
    '/oauth2/advertiser/get/?app_id=' + process.env.TIKTOK_APP_ID + '&secret=' + process.env.TIKTOK_APP_SECRET,
    token
  )
  const advIds = advData.data?.list || []

  if (advIds.length === 0) {
    return res.json({ code: 0, data: { list: [], total: 0 } })
  }

  // Fetch info for all advertisers in batches of 100
  let allAccounts = []
  for (let i = 0; i < advIds.length; i += 100) {
    const batch = advIds.slice(i, i + 100)
    const idsParam = JSON.stringify(batch)
    const info = await tiktokFetch(
      `/advertiser/info/?advertiser_ids=${encodeURIComponent(idsParam)}`,
      token
    )
    const list = info.data?.list || []
    allAccounts = allAccounts.concat(list)
  }

  res.json({
    code: 0,
    data: {
      list: allAccounts,
      total: allAccounts.length
    }
  })
}
