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

async function tt(endpoint, token, options = {}) {
  const res = await fetch(`${TIKTOK_API}${endpoint}`, {
    headers: { 'Access-Token': token, 'Content-Type': 'application/json', ...options.headers },
    ...options,
  })
  return res.json()
}

export default async function handler(req, res) {
  try {
    const url = new URL(req.url, `https://${req.headers.host}`)
    const path = url.pathname.replace('/api/tiktok', '').replace(/^\//, '')
    const params = Object.fromEntries(url.searchParams)
    const APP_ID = process.env.TIKTOK_APP_ID
    const SECRET = process.env.TIKTOK_APP_SECRET

    // AUTH
    if (path === 'auth' && req.method === 'POST') {
      const { auth_code } = req.body
      if (!auth_code) return res.status(400).json({ error: 'auth_code required' })
      const r = await fetch(`${TIKTOK_API}/oauth2/access_token/`, {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ app_id: APP_ID, secret: SECRET, auth_code }),
      })
      return res.json(await r.json())
    }

    // TOKEN
    if (path === 'token') {
      const r = await fetch('https://slcuaijctwvmumgtpxgv.supabase.co/functions/v1/get-tiktok-token', {
        headers: { 'x-api-key': process.env.HAWKLAUNCH_API_KEY }
      })
      return res.json(await r.json())
    }

    const token = await getToken(req)
    if (!token) return res.status(401).json({ error: 'No token' })

    // BC LIST
    if (path === 'bc/list') {
      return res.json(await tt('/bc/get/?page_size=50', token))
    }

    // BC ADVERTISERS - page_size max 50 for this endpoint too
    if (path === 'bc/advertisers') {
      const bcId = params.bc_id
      if (!bcId) return res.status(400).json({ error: 'bc_id required' })

      // First page to get total
      const first = await tt(`/bc/advertiser/get/?bc_id=${bcId}&page=1&page_size=50`, token)
      
      if (first.code !== 0) {
        return res.json(first)
      }

      let all = first.data?.list || []
      const total = first.data?.page_info?.total_number || 0
      const totalPages = Math.ceil(total / 50)

      // Fetch remaining pages
      for (let page = 2; page <= totalPages && page <= 20; page++) {
        const d = await tt(`/bc/advertiser/get/?bc_id=${bcId}&page=${page}&page_size=50`, token)
        all = all.concat(d.data?.list || [])
      }

      return res.json({ code: 0, data: { list: all, total: all.length } })
    }

    // IDENTITY
    if (path === 'identity') {
      if (req.method === 'POST') return res.json(await tt('/identity/create/', token, { method: 'POST', body: JSON.stringify(req.body) }))
      const { advertiser_id, identity_type } = params
      if (!advertiser_id) return res.status(400).json({ error: 'advertiser_id required' })
      let ep = `/identity/get/?advertiser_id=${advertiser_id}`
      if (identity_type) ep += `&identity_type=${identity_type}`
      return res.json(await tt(ep, token))
    }

    // CAMPAIGN
    if (path === 'campaign') {
      if (req.method === 'POST') return res.json(await tt('/campaign/create/', token, { method: 'POST', body: JSON.stringify(req.body) }))
      const { advertiser_id } = params
      if (!advertiser_id) return res.status(400).json({ error: 'advertiser_id required' })
      return res.json(await tt(`/campaign/get/?advertiser_id=${advertiser_id}&page_size=50`, token))
    }

    // ADGROUP
    if (path === 'adgroup' && req.method === 'POST') {
      return res.json(await tt('/adgroup/create/', token, { method: 'POST', body: JSON.stringify(req.body) }))
    }

    // AD
    if (path === 'ad' && req.method === 'POST') {
      if (!req.body.identity_type) req.body.identity_type = 'CUSTOMIZED_USER'
      return res.json(await tt('/ad/create/', token, { method: 'POST', body: JSON.stringify(req.body) }))
    }

    // PIXEL
    if (path === 'pixel') {
      const { advertiser_id } = params
      if (!advertiser_id) return res.status(400).json({ error: 'advertiser_id required' })
      return res.json(await tt(`/pixel/list/?advertiser_id=${advertiser_id}`, token))
    }

    // VIDEOS
    if (path === 'videos') {
      const { advertiser_id } = params
      if (!advertiser_id) return res.status(400).json({ error: 'advertiser_id required' })
      return res.json(await tt(`/file/video/ad/get/?advertiser_id=${advertiser_id}&page_size=50`, token))
    }

    // ADVERTISER INFO
    if (path === 'advertiser') {
      const { advertiser_id } = params
      if (!advertiser_id) return res.status(400).json({ error: 'advertiser_id required' })
      const d = await tt(`/advertiser/info/?advertiser_ids=${encodeURIComponent(`["${advertiser_id}"]`)}`, token)
      if (d.data?.list?.length) return res.json({ code: 0, data: d.data.list[0] })
      return res.json(d)
    }

    // REPORT
    if (path === 'report' && req.method === 'POST') {
      return res.json(await tt('/report/integrated/get/', token, { method: 'POST', body: JSON.stringify(req.body) }))
    }

    res.status(404).json({ error: 'Not found', path })
  } catch(err) {
    console.error('API Error:', err)
    res.status(500).json({ error: err.message, stack: err.stack?.split('\n').slice(0,3) })
  }
}
