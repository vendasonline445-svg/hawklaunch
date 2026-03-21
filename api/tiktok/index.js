export const config = {
  api: { bodyParser: false }
}

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
  const r = await fetch(`${TIKTOK_API}${endpoint}`, {
    headers: { 'Access-Token': token, 'Content-Type': 'application/json', ...options.headers },
    ...options,
  })
  return r.json()
}

function readBody(req) {
  return new Promise((resolve) => {
    if (req.method === 'GET') return resolve({})
    let data = ''
    req.on('data', chunk => data += chunk)
    req.on('end', () => {
      try { resolve(JSON.parse(data)) }
      catch(e) { resolve({}) }
    })
  })
}

export default async function handler(req, res) {
  try {
    const url = new URL(req.url, `https://${req.headers.host}`)
    const path = url.pathname.replace('/api/tiktok', '').replace(/^\//, '')
    const params = Object.fromEntries(url.searchParams)
    const APP_ID = process.env.TIKTOK_APP_ID
    const SECRET = process.env.TIKTOK_APP_SECRET

    if (path === 'auth' && req.method === 'POST') {
      const body = await readBody(req)
      if (!body.auth_code) return res.status(400).json({ error: 'auth_code required' })
      const r = await fetch(`${TIKTOK_API}/oauth2/access_token/`, {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ app_id: APP_ID, secret: SECRET, auth_code: body.auth_code }),
      })
      return res.json(await r.json())
    }

    if (path === 'token') {
      const r = await fetch('https://slcuaijctwvmumgtpxgv.supabase.co/functions/v1/get-tiktok-token', {
        headers: { 'x-api-key': process.env.HAWKLAUNCH_API_KEY }
      })
      return res.json(await r.json())
    }

    const token = await getToken(req)
    if (!token) return res.status(401).json({ error: 'No token' })

    if (path === 'bc/list') {
      return res.json(await tt('/bc/get/?page_size=50', token))
    }

    if (path === 'bc/advertisers') {
      const bcId = params.bc_id
      if (!bcId) return res.status(400).json({ error: 'bc_id required' })
      const first = await tt(`/bc/advertiser/get/?bc_id=${bcId}&page=1&page_size=50`, token)
      if (first.code !== 0) return res.json(first)
      let all = first.data?.list || []
      const total = first.data?.page_info?.total_number || 0
      const totalPages = Math.ceil(total / 50)
      for (let p = 2; p <= totalPages && p <= 20; p++) {
        const d = await tt(`/bc/advertiser/get/?bc_id=${bcId}&page=${p}&page_size=50`, token)
        all = all.concat(d.data?.list || [])
      }
      return res.json({ code: 0, data: { list: all, total: all.length } })
    }

    if (path === 'identity') {
      if (req.method === 'POST') {
        const body = await readBody(req)
        return res.json(await tt('/identity/create/', token, { method: 'POST', body: JSON.stringify(body) }))
      }
      const { advertiser_id, identity_type } = params
      if (!advertiser_id) return res.status(400).json({ error: 'advertiser_id required' })
      let ep = `/identity/get/?advertiser_id=${advertiser_id}`
      if (identity_type) ep += `&identity_type=${identity_type}`
      return res.json(await tt(ep, token))
    }

    if (path === 'campaign') {
      if (req.method === 'POST') {
        const body = await readBody(req)
        return res.json(await tt('/campaign/create/', token, { method: 'POST', body: JSON.stringify(body) }))
      }
      const { advertiser_id } = params
      if (!advertiser_id) return res.status(400).json({ error: 'advertiser_id required' })
      return res.json(await tt(`/campaign/get/?advertiser_id=${advertiser_id}&page_size=50`, token))
    }

    if (path === 'adgroup' && req.method === 'POST') {
      const body = await readBody(req)
      return res.json(await tt('/adgroup/create/', token, { method: 'POST', body: JSON.stringify(body) }))
    }

    if (path === 'ad' && req.method === 'POST') {
      const body = await readBody(req)
      if (!body.identity_type) body.identity_type = 'CUSTOMIZED_USER'
      return res.json(await tt('/ad/create/', token, { method: 'POST', body: JSON.stringify(body) }))
    }

    if (path === 'pixel') {
      const { advertiser_id } = params
      if (!advertiser_id) return res.status(400).json({ error: 'advertiser_id required' })
      return res.json(await tt(`/pixel/list/?advertiser_id=${advertiser_id}`, token))
    }

    if (path === 'videos') {
      const { advertiser_id } = params
      if (!advertiser_id) return res.status(400).json({ error: 'advertiser_id required' })
      return res.json(await tt(`/file/video/ad/get/?advertiser_id=${advertiser_id}&page_size=50`, token))
    }

    if (path === 'advertiser') {
      const { advertiser_id } = params
      if (!advertiser_id) return res.status(400).json({ error: 'advertiser_id required' })
      const d = await tt(`/advertiser/info/?advertiser_ids=${encodeURIComponent(`["${advertiser_id}"]`)}`, token)
      if (d.data?.list?.length) return res.json({ code: 0, data: d.data.list[0] })
      return res.json(d)
    }

    if (path === 'report' && req.method === 'POST') {
      const body = await readBody(req)
      return res.json(await tt('/report/integrated/get/', token, { method: 'POST', body: JSON.stringify(body) }))
    }

    res.status(404).json({ error: 'Not found', path })
  } catch(err) {
    res.status(500).json({ error: err.message })
  }
}
