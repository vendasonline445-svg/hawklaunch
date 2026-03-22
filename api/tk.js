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
      var advIds = all.map(function(a) { return a.asset_id || a.advertiser_id })
      var infoMap = {}
      for (var i = 0; i < advIds.length; i += 50) {
        var batch = advIds.slice(i, i + 50)
        try {
          var info = await tt('/advertiser/info/?advertiser_ids=' + encodeURIComponent(JSON.stringify(batch)), token)
          if (info.data && info.data.list) info.data.list.forEach(function(a) { infoMap[a.advertiser_id] = a })
        } catch(e) {}
      }
      var mapped = all.map(function(a) {
        var id = a.asset_id || a.advertiser_id
        var info = infoMap[id] || {}
        return { advertiser_id: id, advertiser_name: info.name || a.asset_name || '', status: info.status || 'UNKNOWN', currency: info.currency || 'BRL', role: a.advertiser_role || '', balance: info.balance || 0 }
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

    if (action === 'campaign_get') {
      var advId = req.query.advertiser_id
      if (!advId) return res.status(400).json({ error: 'advertiser_id required' })
      return res.json(await tt('/campaign/get/?advertiser_id=' + advId + '&page_size=50', token))
    }

    // ============ FULL SMART+ LAUNCH ============
    if (action === 'launch_smart' && req.method === 'POST') {
      var body = req.body
      var results = { campaigns: 0, adgroups: 0, ads: 0, errors: [], logs: [] }

      for (var i = 0; i < body.accounts.length; i++) {
        var acc = body.accounts[i]
        var advId = acc.advertiser_id
        var log = function(msg) { results.logs.push({ account: advId, message: msg, time: new Date().toISOString() }) }

        try {
          // 1. CREATE CAMPAIGN
          log('Campaign payload: ' + JSON.stringify(campaignPayload))
          var campaignPayload = {
            advertiser_id: advId,
            campaign_name: body.campaign_name + ' ' + (i+1) + '-' + Date.now().toString().slice(-4) || ('HL ' + new Date().toLocaleDateString('pt-BR') + ' ' + (i+1)),
            objective_type: 'CONVERSIONS',
            budget_mode: 'BUDGET_MODE_DAY',
            budget: body.budget || 80,
            campaign_type: 'REGULAR_CAMPAIGN',
            smart_performance_campaign: true,
          }
          var campRes = await tt('/campaign/create/', token, 'POST', campaignPayload)
          if (campRes.code !== 0) { log('Campaign FULL error: ' + JSON.stringify(campRes)); results.errors.push({ account: advId, step: 'campaign', error: campRes.message }); continue }
          var campaignId = campRes.data.campaign_id
          log('Campaign created: ' + campaignId)
          results.campaigns++

          // 2. CREATE AD GROUP
          // Auto-fetch pixel for this account
          var pixelId = body.pixel_id || null
          log('Pixel from config: ' + (pixelId || 'auto-detect'))
          if (!pixelId) {
            try {
              var pixelRes = await tt('/pixel/list/?advertiser_id=' + advId, token)
              if (pixelRes.data && pixelRes.data.pixels && pixelRes.data.pixels.length > 0) {
                pixelId = pixelRes.data.pixels[0].pixel_id
                log('Pixel found: ' + pixelId + ' (' + pixelRes.data.pixels[0].pixel_name + ')')
              } else {
                log('No pixel found for account ' + advId)
                results.errors.push({ account: advId, step: 'pixel', error: 'No pixel found' })
                continue
              }
            } catch(e) {
              log('Pixel fetch error: ' + e.message)
            }
          }
          log('AdGroup payload: ' + JSON.stringify(adgroupPayload))
          var scheduleStart = body.schedule_start || new Date(Date.now() + 10*60000).toISOString().replace('T',' ').substring(0,19)
          var adgroupPayload = {
            advertiser_id: advId,
            campaign_id: campaignId,
            adgroup_name: body.adgroup_name || ('AG ' + new Date().toLocaleDateString('pt-BR')),
            placement_type: 'PLACEMENT_TYPE_AUTOMATIC',
            promotion_type: 'WEBSITE', optimization_goal: 'CONVERT',
            optimization_event: body.optimization_event || 'ON_WEB_ORDER',
            billing_event: 'OCPM',
            bid_type: 'BID_TYPE_CUSTOM',
            budget_mode: 'BUDGET_MODE_DAY',
            budget: body.budget || 80,
            schedule_type: 'SCHEDULE_FROM_NOW',
            schedule_start_time: scheduleStart,
            location_ids: body.location_ids || ['3469034'],
            pacing: 'PACING_MODE_SMOOTH',
          }
          adgroupPayload.pixel_id = pixelId
          var bidValue = parseFloat(body.target_cpa) || parseFloat(body.budget) || 50; adgroupPayload.bid = bidValue; adgroupPayload.conversion_bid_price = bidValue

          var agRes = await tt('/adgroup/create/', token, 'POST', adgroupPayload)
          if (agRes.code !== 0) { log('AdGroup FULL error: ' + JSON.stringify(agRes)); results.errors.push({ account: advId, step: 'adgroup', error: agRes.message }); continue }
          var adgroupId = agRes.data.adgroup_id
          log('AdGroup created: ' + adgroupId)
          results.adgroups++

          // 3. CREATE ADS (one per spark code x ads_per_code)
          var sparkCodes = body.spark_codes || []
          var adsPerCode = body.ads_per_code || 1

          for (var c = 0; c < sparkCodes.length; c++) {
            for (var a = 0; a < adsPerCode; a++) {
              log('Ad payload: ' + JSON.stringify(adPayload))
              var adPayload = {
                advertiser_id: advId,
                adgroup_id: adgroupId,
                creatives: [{
                  ad_name: body.ad_name || ('Ad ' + new Date().toLocaleDateString('pt-BR') + ' ' + (c+1) + '-' + (a+1)),
                  identity_type: 'AUTH_CODE',
                  identity_id: sparkCodes[c],
                  creative_authorized: true,
                  ad_format: 'SINGLE_VIDEO',
                  landing_page_url: body.landing_page_url || '',
                  ad_text: body.ad_texts && body.ad_texts[0] ? body.ad_texts[0] : 'Shop now',
                  call_to_action: body.call_to_action || 'SHOP_NOW',
                }]
              }

              var adRes = await tt('/ad/create/', token, 'POST', adPayload)
              if (adRes.code !== 0) {
                log('Ad FULL error: ' + JSON.stringify(adRes))
                results.errors.push({ account: advId, step: 'ad', code: sparkCodes[c].substring(0,20), error: adRes.message })
              } else {
                log('Ad created: ' + adRes.data.ad_id)
                results.ads++
              }
            }
          }
        } catch(err) {
          log('Fatal error: ' + err.message)
          results.errors.push({ account: advId, step: 'fatal', error: err.message })
        }
      }

      return res.json({ code: 0, data: results })
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

    if (action === 'regions') {
      var advId = req.query.advertiser_id
      var d = await tt('/tool/region/?advertiser_id=' + advId + '&placements=["PLACEMENT_TIKTOK"]&objective_type=CONVERSIONS', token)
      return res.json(d)
    }
    res.status(400).json({ error: 'Unknown action', action: action })
  } catch(err) {
    res.status(500).json({ error: err.message })
  }
}

// Standalone region lookup - can call via: /api/tk?a=regions&advertiser_id=X
