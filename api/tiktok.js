var TIKTOK_API = 'https://business-api.tiktok.com/open_api/v1.3'

async function getToken(req) {
  var auth = req.headers['authorization']
  if (auth && auth.startsWith('Bearer ')) return auth.slice(7)
  try {
    var r = await fetch('https://slcuaijctwvmumgtpxgv.supabase.co/functions/v1/get-tiktok-token', {
      headers: { 'x-api-key': process.env.HAWKLAUNCH_API_KEY }
    })
    var d = await r.json()
    return d.data ? d.data.access_token : null
  } catch(e) { return null }
}

async function tt(endpoint, token, method, body) {
  var opts = {
    method: method || 'GET',
    headers: { 'Access-Token': token, 'Content-Type': 'application/json' },
  }
  if (body) opts.body = typeof body === 'string' ? body : JSON.stringify(body)
  var r = await fetch(TIKTOK_API + endpoint, opts)
  return r.json()
}

function parsePath(req) {
  var raw = req.url || ''
  var withoutQuery = raw.split('?')[0]
  var p = withoutQuery.replace('/api/tiktok/', '').replace('/api/tiktok', '')
  if (p.startsWith('/')) p = p.substring(1)
  return decodeURIComponent(p)
}

function parseQuery(req) {
  if (req.query && Object.keys(req.query).length > 0) return req.query
  var raw = req.url || ''
  var idx = raw.indexOf('?')
  if (idx === -1) return {}
  var qs = raw.substring(idx + 1)
  var result = {}
  qs.split('&').forEach(function(pair) {
    var parts = pair.split('=')
    result[decodeURIComponent(parts[0])] = decodeURIComponent(parts[1] || '')
  })
  return result
}

export default async function handler(req, res) {
  var path = parsePath(req)
  var query = parseQuery(req)

  try {
    var APP_ID = process.env.TIKTOK_APP_ID
    var SECRET = process.env.TIKTOK_APP_SECRET

    // DEBUG
    if (path === 'debug-path') {
      return res.json({ raw_url: req.url, parsed_path: path, query: query })
    }

    // AUTH
    if (path === 'auth' && req.method === 'POST') {
      var body = req.body || {}
      if (!body.auth_code) return res.status(400).json({ error: 'auth_code required' })
      var r = await fetch(TIKTOK_API + '/oauth2/access_token/', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ app_id: APP_ID, secret: SECRET, auth_code: body.auth_code }),
      })
      return res.json(await r.json())
    }

    // TOKEN
    if (path === 'token') {
      var r = await fetch('https://slcuaijctwvmumgtpxgv.supabase.co/functions/v1/get-tiktok-token', {
        headers: { 'x-api-key': process.env.HAWKLAUNCH_API_KEY }
      })
      return res.json(await r.json())
    }

    var token = await getToken(req)
    if (!token) return res.status(401).json({ error: 'No token' })

    // BC LIST
    if (path === 'bc/list' || path === 'bc%2Flist') {
      return res.json(await tt('/bc/get/?page_size=50', token))
    }

    // BC ADVERTISERS
    if (path === 'bc/advertisers' || path === 'bc%2Fadvertisers') {
      var bcId = query.bc_id
      if (!bcId) return res.status(400).json({ error: 'bc_id required' })
      var first = await tt('/bc/advertiser/get/?bc_id=' + bcId + '&page=1&page_size=50', token)
      if (first.code !== 0) return res.json(first)
      var all = (first.data && first.data.list) ? first.data.list.slice() : []
      var total = (first.data && first.data.page_info) ? first.data.page_info.total_number : 0
      var totalPages = Math.ceil(total / 50)
      for (var p = 2; p <= totalPages && p <= 20; p++) {
        var d = await tt('/bc/advertiser/get/?bc_id=' + bcId + '&page=' + p + '&page_size=50', token)
        if (d.data && d.data.list) all = all.concat(d.data.list)
      }
      return res.json({ code: 0, data: { list: all, total: all.length } })
    }

    // IDENTITY
    if (path === 'identity') {
      if (req.method === 'POST') return res.json(await tt('/identity/create/', token, 'POST', req.body))
      var advId = query.advertiser_id
      if (!advId) return res.status(400).json({ error: 'advertiser_id required' })
      var ep = '/identity/get/?advertiser_id=' + advId
      if (query.identity_type) ep += '&identity_type=' + query.identity_type
      return res.json(await tt(ep, token))
    }

    // CAMPAIGN
    if (path === 'campaign') {
      if (req.method === 'POST') return res.json(await tt('/campaign/create/', token, 'POST', req.body))
      var advId = query.advertiser_id
      if (!advId) return res.status(400).json({ error: 'advertiser_id required' })
      return res.json(await tt('/campaign/get/?advertiser_id=' + advId + '&page_size=50', token))
    }

    // ADGROUP
    if (path === 'adgroup' && req.method === 'POST') {
      return res.json(await tt('/adgroup/create/', token, 'POST', req.body))
    }

    // AD
    if (path === 'ad' && req.method === 'POST') {
      var body = req.body || {}
      if (!body.identity_type) body.identity_type = 'CUSTOMIZED_USER'
      return res.json(await tt('/ad/create/', token, 'POST', body))
    }

    // PIXEL
    if (path === 'pixel') {
      var advId = query.advertiser_id
      if (!advId) return res.status(400).json({ error: 'advertiser_id required' })
      return res.json(await tt('/pixel/list/?advertiser_id=' + advId, token))
    }

    // VIDEOS
    if (path === 'videos') {
      var advId = query.advertiser_id
      if (!advId) return res.status(400).json({ error: 'advertiser_id required' })
      return res.json(await tt('/file/video/ad/get/?advertiser_id=' + advId + '&page_size=50', token))
    }

    // ADVERTISER INFO
    if (path === 'advertiser') {
      var advId = query.advertiser_id
      if (!advId) return res.status(400).json({ error: 'advertiser_id required' })
      var d = await tt('/advertiser/info/?advertiser_ids=' + encodeURIComponent('["' + advId + '"]'), token)
      if (d.data && d.data.list && d.data.list.length) return res.json({ code: 0, data: d.data.list[0] })
      return res.json(d)
    }

    // REPORT
    if (path === 'report' && req.method === 'POST') {
      return res.json(await tt('/report/integrated/get/', token, 'POST', req.body))
    }

    res.status(404).json({ error: 'Not found', path: path, raw_url: req.url })
  } catch(err) {
    res.status(500).json({ error: err.message })
  }
}
