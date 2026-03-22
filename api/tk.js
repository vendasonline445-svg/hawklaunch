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

async function authorizeSpark(token, advertiserId, authCode) {
  return await tt('/tt_video/authorize/', token, 'POST', {
    advertiser_id: advertiserId,
    auth_code: authCode
  })
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

    if (action === 'spark_authorize' && req.method === 'POST') {
      var body = req.body || {}
      if (!body.advertiser_id || !body.auth_code) {
        return res.status(400).json({ error: 'advertiser_id and auth_code required' })
      }
      return res.json(await authorizeSpark(token, body.advertiser_id, body.auth_code))
    }

    // ============ FULL SMART+ LAUNCH ============
    if (action === 'launch_smart' && req.method === 'POST') {
      var body = req.body
      var results = { campaigns: 0, adgroups: 0, ads: 0, spark_authorized: 0, errors: [], logs: [] }
      var sparkCodes = body.spark_codes || []
      var sparkAuthCache = {}

      // STEP 0: Pre-authorize all Spark Codes → get identity_id per account
      for (var i = 0; i < body.accounts.length; i++) {
        var acc = body.accounts[i]
        var advId = acc.advertiser_id
        sparkAuthCache[advId] = {}

        for (var s = 0; s < sparkCodes.length; s++) {
          var code = sparkCodes[s]
          results.logs.push({ account: advId, message: 'Authorizing Spark ' + (s+1) + '/' + sparkCodes.length + '...', time: new Date().toISOString() })

          try {
            var authRes = await authorizeSpark(token, advId, code)
            if (authRes.code === 0 && authRes.data) {
              sparkAuthCache[advId][code] = {
                identity_id: authRes.data.identity_id || null,
                item_id: authRes.data.tiktok_item_id || null
              }
              results.logs.push({ account: advId, message: '✅ Spark OK → identity_id: ' + (authRes.data.identity_id || 'n/a') + ' item_id: ' + (authRes.data.tiktok_item_id || 'n/a'), time: new Date().toISOString() })
              results.spark_authorized++
            } else {
              results.logs.push({ account: advId, message: '⚠️ Spark auth: ' + (authRes.message || JSON.stringify(authRes)), time: new Date().toISOString() })
              results.errors.push({ account: advId, step: 'spark_auth', code: code.substring(0,20), error: authRes.message })
            }
          } catch(e) {
            results.logs.push({ account: advId, message: '❌ Spark error: ' + e.message, time: new Date().toISOString() })
            results.errors.push({ account: advId, step: 'spark_auth', code: code.substring(0,20), error: e.message })
          }
        }
      }

      // STEP 1-3: Campaign → AdGroup → Ads
      for (var i = 0; i < body.accounts.length; i++) {
        var acc = body.accounts[i]
        var advId = acc.advertiser_id
        var accountSparks = sparkAuthCache[advId] || {}

        try {
          var campaignPayload = {
            advertiser_id: advId,
            campaign_name: (body.campaign_name || 'HL') + ' ' + (i+1) + '-' + Date.now().toString().slice(-4),
            objective_type: 'CONVERSIONS',
            budget_mode: 'BUDGET_MODE_DAY',
            budget: body.budget || 80,
            campaign_type: 'REGULAR_CAMPAIGN',
            smart_performance_campaign: true,
          }
          results.logs.push({ account: advId, message: 'Creating campaign: ' + campaignPayload.campaign_name, time: new Date().toISOString() })

          var campRes = await tt('/campaign/create/', token, 'POST', campaignPayload)
          if (campRes.code !== 0) {
            results.logs.push({ account: advId, message: '❌ Campaign: ' + campRes.message, time: new Date().toISOString() })
            results.errors.push({ account: advId, step: 'campaign', error: campRes.message }); continue
          }
          var campaignId = campRes.data.campaign_id
          results.logs.push({ account: advId, message: '✅ Campaign: ' + campaignId, time: new Date().toISOString() })
          results.campaigns++

          var pixelId = body.pixel_id || null
          if (!pixelId) {
            try {
              var pixelRes = await tt('/pixel/list/?advertiser_id=' + advId, token)
              if (pixelRes.data && pixelRes.data.pixels && pixelRes.data.pixels.length > 0) {
                pixelId = pixelRes.data.pixels[0].pixel_id
              } else {
                results.logs.push({ account: advId, message: '⚠️ No pixel', time: new Date().toISOString() })
                results.errors.push({ account: advId, step: 'pixel', error: 'No pixel' }); continue
              }
            } catch(e) { continue }
          }

          var scheduleStart = body.schedule_start || new Date(Date.now() + 10*60000).toISOString().replace('T',' ').substring(0,19)
          var bidValue = parseFloat(body.target_cpa) || parseFloat(body.budget) || 50
          var agRes = await tt('/adgroup/create/', token, 'POST', {
            advertiser_id: advId, campaign_id: campaignId,
            adgroup_name: body.adgroup_name || ('AG ' + new Date().toLocaleDateString('pt-BR')),
            placement_type: 'PLACEMENT_TYPE_AUTOMATIC',
            promotion_type: 'WEBSITE', optimization_goal: 'CONVERT',
            optimization_event: body.optimization_event || 'ON_WEB_ORDER',
            billing_event: 'OCPM', bid_type: 'BID_TYPE_CUSTOM',
            budget_mode: 'BUDGET_MODE_DAY', budget: body.budget || 80,
            schedule_type: 'SCHEDULE_FROM_NOW', schedule_start_time: scheduleStart,
            location_ids: body.location_ids || ['3469034'],
            pacing: 'PACING_MODE_SMOOTH', pixel_id: pixelId,
            bid: bidValue, conversion_bid_price: bidValue,
          })
          if (agRes.code !== 0) {
            results.logs.push({ account: advId, message: '❌ AdGroup: ' + agRes.message, time: new Date().toISOString() })
            results.errors.push({ account: advId, step: 'adgroup', error: agRes.message }); continue
          }
          var adgroupId = agRes.data.adgroup_id
          results.logs.push({ account: advId, message: '✅ AdGroup: ' + adgroupId, time: new Date().toISOString() })
          results.adgroups++

          var adsPerCode = body.ads_per_code || 1
          for (var c = 0; c < sparkCodes.length; c++) {
            var code = sparkCodes[c]
            var sparkData = accountSparks[code]
            if (!sparkData) {
              results.logs.push({ account: advId, message: '⚠️ Spark ' + (c+1) + ' not auth, skip', time: new Date().toISOString() })
              continue
            }
            for (var a = 0; a < adsPerCode; a++) {
              var creative = {
                ad_name: (body.ad_name || 'Ad') + ' ' + (c+1) + '-' + (a+1) + ' ' + Date.now().toString().slice(-4),
                identity_type: 'AUTH_CODE',
                identity_id: sparkData.identity_id || code,
                creative_authorized: true,
                ad_format: 'SINGLE_VIDEO',
                landing_page_url: body.landing_page_url || '',
                ad_text: body.ad_texts && body.ad_texts[a % body.ad_texts.length] ? body.ad_texts[a % body.ad_texts.length] : 'Shop now',
                call_to_action: body.call_to_action || 'SHOP_NOW',
              }
              if (sparkData.item_id) creative.tiktok_item_id = sparkData.item_id

              var adPayload = { advertiser_id: advId, adgroup_id: adgroupId, creatives: [creative] }
              results.logs.push({ account: advId, message: 'Ad ' + (c+1) + '-' + (a+1) + ' identity=' + creative.identity_id, time: new Date().toISOString() })

              var adRes = await tt('/ad/create/', token, 'POST', adPayload)
              if (adRes.code !== 0) {
                results.logs.push({ account: advId, message: '❌ Ad: ' + (adRes.message || JSON.stringify(adRes)), time: new Date().toISOString() })
                results.errors.push({ account: advId, step: 'ad', code: code.substring(0,20), error: adRes.message })
              } else {
                var adId = (adRes.data && adRes.data.ad_ids) ? adRes.data.ad_ids[0] : (adRes.data && adRes.data.ad_id) || '?'
                results.logs.push({ account: advId, message: '✅ Ad: ' + adId, time: new Date().toISOString() })
                results.ads++
              }
            }
          }
        } catch(err) {
          results.logs.push({ account: advId, message: '❌ Fatal: ' + err.message, time: new Date().toISOString() })
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
