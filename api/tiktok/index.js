const TIKTOK_API = 'https://business-api.tiktok.com/open_api/v1.3'

async function getToken(req) {
  const auth = req.headers['authorization']
  if (auth?.startsWith('Bearer ')) return auth.slice(7)
  
  try {
    const r = await fetch('https://slcuaijctwvmumgtpxgv.supabase.co/functions/v1/get-tiktok-token', {
      headers: { 'x-api-key': process.env.HAWKLAUNCH_API_KEY }
    })
    const d = await r.json()
    return d.data?.access_token || null
  } catch(e) { return null }
}

async function ttFetch(endpoint, token, options = {}) {
  const res = await fetch(`${TIKTOK_API}${endpoint}`, {
    headers: { 'Access-Token': token, 'Content-Type': 'application/json', ...options.headers },
    ...options,
  })
  return res.json()
}

export default async function handler(req, res) {
  const url = new URL(req.url, `https://${req.headers.host}`)
  const path = url.pathname.replace('/api/tiktok', '').replace(/^\//, '')
  const params = Object.fromEntries(url.searchParams)
  const APP_ID = process.env.TIKTOK_APP_ID
  const SECRET = process.env.TIKTOK_APP_SECRET

  // === AUTH (no token needed) ===
  if (path === 'auth' && req.method === 'POST') {
    const { auth_code } = req.body
    if (!auth_code) return res.status(400).json({ error: 'auth_code required' })
    const r = await fetch(`${TIKTOK_API}/oauth2/access_token/`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ app_id: APP_ID, secret: SECRET, auth_code }),
    })
    return res.json(await r.json())
  }

  // === TOKEN (from Supabase) ===
  if (path === 'token') {
    try {
      const r = await fetch('https://slcuaijctwvmumgtpxgv.supabase.co/functions/v1/get-tiktok-token', {
        headers: { 'x-api-key': process.env.HAWKLAUNCH_API_KEY }
      })
      return res.json(await r.json())
    } catch(e) {
      return res.status(500).json({ error: e.message })
    }
  }

  // All other routes need token
  const token = await getToken(req)
  if (!token) return res.status(401).json({ error: 'No token' })

  // === DEBUG ===
  if (path === 'debug') {
    const r1 = await fetch(`${TIKTOK_API}/oauth2/advertiser/get/?app_id=${APP_ID}&secret=${SECRET}&access_token=${token}`)
    const d1 = await r1.json()

    const r2 = await fetch(`${TIKTOK_API}/advertiser/info/?advertiser_ids=${encodeURIComponent('["7608010387140771841"]')}`, {
      headers: { 'Access-Token': token }
    })
    const d2 = await r2.json()

    const r3 = await fetch(`${TIKTOK_API}/bc/get/?page_size=10`, {
      headers: { 'Access-Token': token }
    })
    const d3 = await r3.json()

    return res.json({
      token_preview: token.substring(0, 10) + '...',
      app_id: APP_ID,
      test1_oauth2_advertiser_get: d1,
      test2_advertiser_info: d2,
      test3_bc_get: d3,
    })
  }

  // === BC LIST ===
  if (path === 'bc/list') {
    // Try oauth2/advertiser/get first
    const advRes = await fetch(`${TIKTOK_API}/oauth2/advertiser/get/?app_id=${APP_ID}&secret=${SECRET}&access_token=${token}`)
    const advData = await advRes.json()
    const advIds = advData.data?.list || []

    // Also try bc/get
    const bcRes = await fetch(`${TIKTOK_API}/bc/get/?page_size=100`, {
      headers: { 'Access-Token': token }
    })
    const bcData = await bcRes.json()
    const bcList = bcData.data?.list || []

    if (bcList.length > 0) {
      return res.json({ code: 0, data: { list: bcList } })
    }

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
  }

  // === BC ADVERTISERS ===
  if (path === 'bc/advertisers') {
    const bcId = params.bc_id

    if (bcId && bcId !== 'all') {
      // Real BC
      let all = [], page = 1, more = true
      while (more) {
        const d = await ttFetch(`/bc/advertiser/get/?bc_id=${bcId}&page=${page}&page_size=100`, token)
        all = all.concat(d.data?.list || [])
        more = page < Math.ceil((d.data?.page_info?.total_number || 0) / 100)
        page++
        if (page > 10) break
      }
      return res.json({ code: 0, data: { list: all, total: all.length } })
    }

    // Virtual "all" - get advertiser IDs then info
    const advRes = await fetch(`${TIKTOK_API}/oauth2/advertiser/get/?app_id=${APP_ID}&secret=${SECRET}&access_token=${token}`)
    const advData = await advRes.json()
    const advIds = advData.data?.list || []

    let allAccounts = []
    for (let i = 0; i < advIds.length; i += 100) {
      const batch = advIds.slice(i, i + 100)
      const d = await ttFetch(`/advertiser/info/?advertiser_ids=${encodeURIComponent(JSON.stringify(batch))}`, token)
      allAccounts = allAccounts.concat(d.data?.list || [])
    }
    return res.json({ code: 0, data: { list: allAccounts, total: allAccounts.length } })
  }

  // === IDENTITY ===
  if (path === 'identity') {
    if (req.method === 'POST') {
      return res.json(await ttFetch('/identity/create/', token, { method: 'POST', body: JSON.stringify(req.body) }))
    }
    const { advertiser_id, identity_type } = params
    if (!advertiser_id) return res.status(400).json({ error: 'advertiser_id required' })
    let ep = `/identity/get/?advertiser_id=${advertiser_id}`
    if (identity_type) ep += `&identity_type=${identity_type}`
    return res.json(await ttFetch(ep, token))
  }

  // === CAMPAIGN ===
  if (path === 'campaign') {
    if (req.method === 'POST') {
      return res.json(await ttFetch('/campaign/create/', token, { method: 'POST', body: JSON.stringify(req.body) }))
    }
    const { advertiser_id } = params
    if (!advertiser_id) return res.status(400).json({ error: 'advertiser_id required' })
    return res.json(await ttFetch(`/campaign/get/?advertiser_id=${advertiser_id}&page_size=100`, token))
  }

  // === ADGROUP ===
  if (path === 'adgroup' && req.method === 'POST') {
    return res.json(await ttFetch('/adgroup/create/', token, { method: 'POST', body: JSON.stringify(req.body) }))
  }

  // === AD ===
  if (path === 'ad' && req.method === 'POST') {
    if (!req.body.identity_type) req.body.identity_type = 'CUSTOMIZED_USER'
    return res.json(await ttFetch('/ad/create/', token, { method: 'POST', body: JSON.stringify(req.body) }))
  }

  // === PIXEL ===
  if (path === 'pixel') {
    const { advertiser_id } = params
    if (!advertiser_id) return res.status(400).json({ error: 'advertiser_id required' })
    return res.json(await ttFetch(`/pixel/list/?advertiser_id=${advertiser_id}`, token))
  }

  // === VIDEOS ===
  if (path === 'videos') {
    const { advertiser_id } = params
    if (!advertiser_id) return res.status(400).json({ error: 'advertiser_id required' })
    return res.json(await ttFetch(`/file/video/ad/get/?advertiser_id=${advertiser_id}&page_size=50`, token))
  }

  // === ADVERTISER INFO ===
  if (path === 'advertiser') {
    const { advertiser_id } = params
    if (!advertiser_id) return res.status(400).json({ error: 'advertiser_id required' })
    const d = await ttFetch(`/advertiser/info/?advertiser_ids=${encodeURIComponent(`["${advertiser_id}"]`)}`, token)
    if (d.data?.list?.length) return res.json({ code: 0, data: d.data.list[0] })
    return res.json(d)
  }

  // === REPORT ===
  if (path === 'report' && req.method === 'POST') {
    return res.json(await ttFetch('/report/integrated/get/', token, { method: 'POST', body: JSON.stringify(req.body) }))
  }

  res.status(404).json({ error: 'Route not found', path })
}
