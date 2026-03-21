const TIKTOK_API = 'https://business-api.tiktok.com/open_api/v1.3'

async function getToken(req) {
  const auth = req.headers['authorization']
  if (auth && auth.startsWith('Bearer ')) return auth.slice(7)
  try {
    const r = await fetch('https://slcuaijctwvmumgtpxgv.supabase.co/functions/v1/get-tiktok-token', {
      headers: { 'x-api-key': process.env.HAWKLAUNCH_API_KEY }
    })
    const d = await r.json()
    return d.data ? d.data.access_token : null
  } catch(e) { return null }
}

async function tt(endpoint, token, options) {
  options = options || {}
  var r = await fetch(TIKTOK_API + endpoint, {
    method: options.method || 'GET',
    headers: Object.assign({ 'Access-Token': token, 'Content-Type': 'application/json' }, options.headers || {}),
    body: options.body || undefined,
  })
  return r.json()
}

module.exports = async function handler(req, res) {
  try {
    var path = req.url.split('?')[0].replace('/api/tiktok', '').replace(/^\//, '')
    var query = req.query || {}
    var APP_ID = process.env.TIKTOK_APP_ID
    var SECRET = process.env.TIKTOK_APP_SECRET

    if (path === 'auth' && req.method === 'POST') {
      var body = req.body || {}
      if (!body.auth_code) return res.status(400).json({ error: 'auth_code required' })
      var r = await fetch(TIKTOK_API + '/oauth2/access_token/', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ app_id: APP_ID, secret: SECRET, auth_code: body.auth_code }),
      })
      return res.json(await r.json())
    }

    if (path === 'token') {
      var r = await fetch('https://slcuaijctwvmumgtpxgv.supabase.co/functions/v1/get-tiktok-token', {
        headers: { 'x-api-key': process.env.HAWKLAUNCH_API_KEY }
      })
      return res.json(await r.json())
    }

    var token = await getToken(req)
    if (!token) return res.status(401).json({ error: 'No token' })

    if (path === 'bc/list' || path === 'bc%2Flist') {
      return res.json(await tt('/bc/get/?page_size=50', token))
    }

    if (path === 'bc/advertisers' || path === 'bc%2Fadvertisers') {
      var bcId = query.bc_id
      if (!bcId) return res.status(400).json({ error: 'bc_id required' })
      var first = await tt('/bc/advertiser/get/?bc_id=' + bcId + '&page=1&page_size=50', token)
      if (first.code !== 0) return res.json(first)
      var all = first.data && first.data.list ? first.data.list : []
      var total = first.data && first.data.page_info ? first.data.page_info.total_number : 0
      var totalPages = Math.ceil(total / 50)
      for (var p = 2; p <= totalPages && p <= 20; p++) {
        var d = await tt('/bc/advertiser/get/?bc_id=' + bcId + '&page=' + p + '&page_size=50', token)
        all = all.concat(d.data && d.data.list ? d.data.list : [])
      }
      return res.json({ code: 0, data: { list: all, total: all.length } })
    }

    if (path === 'identity') {
      if (req.method === 'POST') {
        return res.json(await tt('/identity/create/', token, { method: 'POST', body: JSON.stringify(req.body || {}) }))
      }
      var advId = query.advertiser_id
      if (!advId) return res.status(400).json({ error: 'advertiser_id required' })
      var ep = '/identity/get/?advertiser_id=' + advId
      if (query.identity_type) ep += '&identity_type=' + query.identity_type
      return res.json(await tt(ep, token))
    }

    if (path === 'campaign') {
      if (req.method === 'POST') {
        return res.json(await tt('/campaign/create/', token, { method: 'POST', body: JSON.stringify(req.body || {}) }))
      }
      var advId = query.advertiser_id
      if (!advId) return res.status(400).json({ error: 'advertiser_id required' })
      return res.json(await tt('/campaign/get/?advertiser_id=' + advId + '&page_size=50', token))
    }

    if (path === 'adgroup' && req.method === 'POST') {
      return res.json(await tt('/adgroup/create/', token, { method: 'POST', body: JSON.stringify(req.body || {}) }))
    }

    if (path === 'ad' && req.method === 'POST') {
      var body = req.body || {}
      if (!body.identity_type) body.identity_type = 'CUSTOMIZED_USER'
      return res.json(await tt('/ad/create/', token, { method: 'POST', body: JSON.stringify(body) }))
    }

    if (path === 'pixel') {
      var advId = query.advertiser_id
      if (!advId) return res.status(400).json({ error: 'advertiser_id required' })
      return res.json(await tt('/pixel/list/?advertiser_id=' + advId, token))
    }

    if (path === 'videos') {
      var advId = query.advertiser_id
      if (!advId) return res.status(400).json({ error: 'advertiser_id required' })
      return res.json(await tt('/file/video/ad/get/?advertiser_id=' + advId + '&page_size=50', token))
    }

    if (path === 'advertiser') {
      var advId = query.advertiser_id
      if (!advId) return res.status(400).json({ error: 'advertiser_id required' })
      var d = await tt('/advertiser/info/?advertiser_ids=' + encodeURIComponent('["' + advId + '"]'), token)
      if (d.data && d.data.list && d.data.list.length) return res.json({ code: 0, data: d.data.list[0] })
      return res.json(d)
    }

    if (path === 'report' && req.method === 'POST') {
      return res.json(await tt('/report/integrated/get/', token, { method: 'POST', body: JSON.stringify(req.body || {}) }))
    }

    res.status(404).json({ error: 'Not found', path: path })
  } catch(err) {
    res.status(500).json({ error: err.message })
  }
}
