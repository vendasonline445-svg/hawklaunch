var TIKTOK_API = 'https://business-api.tiktok.com/open_api/v1.3'

async function getToken() {
  try {
    var r = await fetch('https://slcuaijctwvmumgtpxgv.supabase.co/functions/v1/get-tiktok-token', {
      headers: { 'x-api-key': process.env.HAWKLAUNCH_API_KEY }
    })
    var d = await r.json()
    return d.data ? d.data.access_token : null
  } catch(e) { return null }
}

async function tt(endpoint, token, method, body) {
  var opts = { method: method || 'GET', headers: { 'Access-Token': token, 'Content-Type': 'application/json' } }
  if (body) opts.body = typeof body === 'string' ? body : JSON.stringify(body)
  var r = await fetch(TIKTOK_API + endpoint, opts)
  return r.json()
}

export default async function handler(req, res) {
  try {
    var action = req.query.a
    var token = await getToken()
    if (!token && action !== 'token') return res.status(401).json({ error: 'No token' })

    if (action === 'token') {
      var r = await fetch('https://slcuaijctwvmumgtpxgv.supabase.co/functions/v1/get-tiktok-token', {
        headers: { 'x-api-key': process.env.HAWKLAUNCH_API_KEY }
      })
      return res.json(await r.json())
    }

    if (action === 'bc_list') {
      return res.json(await tt('/bc/get/?page_size=50', token))
    }

    if (action === 'bc_advertisers') {
      var bcId = req.query.bc_id
      if (!bcId) return res.status(400).json({ error: 'bc_id required' })
      var first = await tt('/bc/asset/get/?bc_id=' + bcId + '&asset_type=ADVERTISER&page=1&page_size=50', token)
      if (first.code !== 0) return res.json(first)
      var all = (first.data && first.data.list) ? first.data.list.slice() : []
      var total = (first.data && first.data.page_info) ? first.data.page_info.total_number : 0
      var totalPages = Math.ceil(total / 50)
      for (var p = 2; p <= totalPages && p <= 20; p++) {
        var d = await tt('/bc/asset/get/?bc_id=' + bcId + '&asset_type=ADVERTISER&page=' + p + '&page_size=50', token)
        if (d.data && d.data.list) all = all.concat(d.data.list)
      }
      var mapped = all.map(function(a) {
        return {
          advertiser_id: a.asset_id || a.advertiser_id,
          advertiser_name: a.asset_name || a.advertiser_name || '',
          status: a.advertiser_status || a.status || 'UNKNOWN',
          currency: a.currency || 'BRL',
          role: a.advertiser_role || ''
        }
      })
      return res.json({ code: 0, data: { list: mapped, total: mapped.length } })
    }

    if (action === 'identity_get') {
      var advId = req.query.advertiser_id
      if (!advId) return res.status(400).json({ error: 'advertiser_id required' })
      var ep = '/identity/get/?advertiser_id=' + advId
      if (req.query.identity_type) ep += '&identity_type=' + req.query.identity_type
      return res.json(await tt(ep, token))
    }

    if (action === 'identity_create' && req.method === 'POST') {
      return res.json(await tt('/identity/create/', token, 'POST', req.body))
    }

    if (action === 'campaign_get') {
      var advId = req.query.advertiser_id
      if (!advId) return res.status(400).json({ error: 'advertiser_id required' })
      return res.json(await tt('/campaign/get/?advertiser_id=' + advId + '&page_size=50', token))
    }

    if (action === 'campaign_create' && req.method === 'POST') {
      return res.json(await tt('/campaign/create/', token, 'POST', req.body))
    }

    if (action === 'adgroup_create' && req.method === 'POST') {
      return res.json(await tt('/adgroup/create/', token, 'POST', req.body))
    }

    if (action === 'ad_create' && req.method === 'POST') {
      var body = req.body || {}
      if (!body.identity_type) body.identity_type = 'CUSTOMIZED_USER'
      return res.json(await tt('/ad/create/', token, 'POST', body))
    }

    if (action === 'pixel') {
      var advId = req.query.advertiser_id
      if (!advId) return res.status(400).json({ error: 'advertiser_id required' })
      return res.json(await tt('/pixel/list/?advertiser_id=' + advId, token))
    }

    if (action === 'videos') {
      var advId = req.query.advertiser_id
      if (!advId) return res.status(400).json({ error: 'advertiser_id required' })
      return res.json(await tt('/file/video/ad/get/?advertiser_id=' + advId + '&page_size=50', token))
    }

    if (action === 'advertiser') {
      var advId = req.query.advertiser_id
      if (!advId) return res.status(400).json({ error: 'advertiser_id required' })
      var d = await tt('/advertiser/info/?advertiser_ids=' + encodeURIComponent('["' + advId + '"]'), token)
      if (d.data && d.data.list && d.data.list.length) return res.json({ code: 0, data: d.data.list[0] })
      return res.json(d)
    }

    if (action === 'report' && req.method === 'POST') {
      return res.json(await tt('/report/integrated/get/', token, 'POST', req.body))
    }

    if (action === 'auth' && req.method === 'POST') {
      var body = req.body || {}
      if (!body.auth_code) return res.status(400).json({ error: 'auth_code required' })
      var r = await fetch(TIKTOK_API + '/oauth2/access_token/', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ app_id: process.env.TIKTOK_APP_ID, secret: process.env.TIKTOK_APP_SECRET, auth_code: body.auth_code }),
      })
      return res.json(await r.json())
    }

    res.status(400).json({ error: 'Unknown action', action: action })
  } catch(err) {
    res.status(500).json({ error: err.message })
  }
}
