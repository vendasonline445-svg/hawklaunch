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

  if (!token) return res.status(401).json({ error: 'No token available' })

  const bcId = req.query.bc_id
  if (!bcId) return res.status(400).json({ error: 'bc_id required' })

  // Fetch all pages
  let allAccounts = []
  let page = 1
  let hasMore = true

  while (hasMore) {
    const data = await tiktokFetch(
      `/bc/advertiser/get/?bc_id=${bcId}&page=${page}&page_size=100`,
      token
    )
    const list = data.data?.list || []
    allAccounts = allAccounts.concat(list)
    
    const totalPages = Math.ceil((data.data?.page_info?.total_number || 0) / 100)
    hasMore = page < totalPages
    page++
    
    // Safety limit
    if (page > 10) break
  }

  res.json({
    code: 0,
    data: {
      list: allAccounts,
      total: allAccounts.length
    }
  })
}
